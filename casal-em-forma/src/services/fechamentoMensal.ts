// Fechamento mensal automático e idempotente + recálculo em cascata
// (seção 8.7 do PROMPT MESTRE v3). Orquestra domain/bonusPeso.ts com o
// Supabase. Roda no carregamento do app — sem servidor com agendador.
import { calcularFechamentoMensal, type SettingsParaBonusPeso } from '../domain/bonusPeso'
import type { MetaAnual } from '../domain/metas'
import { buscarSettings } from './settings'
import { buscarMetaAnual } from './annualGoals'
import { listarPesagens } from './weighIns'
import { buscarFechamento, salvarFechamento } from './monthlyClosings'
import { inserirLancamento } from './ledger'
import {
  hojeISO,
  infoDoMes,
  mesesFechaveis,
  mesAnteriorISO,
  ultimoDiaDoMesISO,
  type InfoMes,
} from '../utils/data'
import type { MonthlyClosingStatus, WeighIn } from '../types'

function pesagensDoMes(todasAsPesagens: WeighIn[], anoMesISO: string): number[] {
  const fim = ultimoDiaDoMesISO(anoMesISO)
  return todasAsPesagens
    .filter((p) => p.data >= anoMesISO && p.data <= fim)
    .map((p) => p.peso_kg)
}

function statusFechamento(
  status: 'ok' | 'insuficiente' | 'sem_meta',
  ehMesAtual: boolean,
): MonthlyClosingStatus {
  if (status === 'ok') return ehMesAtual ? 'previa' : 'fechado'
  return status
}

type EstadoIteracao = {
  streakMesesAnterior: number
  estavaEmManutencaoNoAno: boolean
  anoCorrente: number | null
}

async function processarMes(
  profileId: string,
  info: InfoMes,
  ehMesAtual: boolean,
  todasAsPesagens: WeighIn[],
  primeiroMesISO: string,
  settings: SettingsParaBonusPeso,
  metaDoAno: (ano: number) => Promise<MetaAnual | null>,
  estado: EstadoIteracao,
  gerarAjuste: boolean,
): Promise<void> {
  if (info.ano !== estado.anoCorrente) {
    estado.estavaEmManutencaoNoAno = false // janeiro reabre o modo emagrecimento
    estado.anoCorrente = info.ano
  }

  const existente = await buscarFechamento(profileId, info.anoMesISO)
  const bonusAntigo = existente?.bonus_total ?? 0

  const metaAnual = await metaDoAno(info.ano)
  const resultado = calcularFechamentoMensal({
    mes: info.mes,
    pesagensMesAnterior: pesagensDoMes(todasAsPesagens, mesAnteriorISO(info.anoMesISO)),
    pesagensDesdeOInicio: todasAsPesagens.map((p) => p.peso_kg),
    pesagensMesCorrente: pesagensDoMes(todasAsPesagens, info.anoMesISO),
    ehPrimeiroMes: info.anoMesISO === primeiroMesISO,
    metaAnual,
    estavaEmManutencaoNoAno: estado.estavaEmManutencaoNoAno,
    streakMesesAnterior: estado.streakMesesAnterior,
    settings,
  })

  const salvo = await salvarFechamento({
    profileId,
    anoMesISO: info.anoMesISO,
    status: statusFechamento(resultado.status, ehMesAtual),
    modo: resultado.status === 'ok' ? resultado.modo : undefined,
    pesoInicialKg: resultado.status === 'ok' ? resultado.pesoInicialKg : null,
    pesoFinalKg: resultado.status === 'ok' ? resultado.pesoFinalKg : null,
    mesesRestantes: null,
    metaKg: resultado.status === 'ok' ? resultado.metaKg : null,
    metaLimitada: resultado.status === 'ok' ? resultado.metaLimitada : false,
    perdaKg: resultado.status === 'ok' ? resultado.perdaKg : null,
    percentualAtingido: resultado.status === 'ok' ? resultado.percentualAtingido : null,
    qtdPesagens: pesagensDoMes(todasAsPesagens, info.anoMesISO).length,
    bonusBase: resultado.status === 'ok' ? resultado.bonusBase : 0,
    bonusStreak: resultado.status === 'ok' ? resultado.bonusStreak : 0,
    bonusTotal: resultado.status === 'ok' ? resultado.bonusTotal : 0,
    streakMeses: resultado.streakMeses,
  })

  if (!ehMesAtual) {
    const bonusNovo = resultado.status === 'ok' ? resultado.bonusTotal : 0
    if (!gerarAjuste && bonusNovo > 0) {
      await inserirLancamento({
        profileId,
        data: ultimoDiaDoMesISO(info.anoMesISO),
        tipo: 'bonus_peso',
        pontos: bonusNovo,
        contaParaTotalGanho: true,
        referenciaId: salvo.id,
        descricao: `Bônus de peso — ${String(info.mes).padStart(2, '0')}/${info.ano}`,
      })
    } else if (gerarAjuste && bonusNovo !== bonusAntigo) {
      await inserirLancamento({
        profileId,
        data: hojeISO(),
        tipo: 'ajuste',
        pontos: bonusNovo - bonusAntigo,
        contaParaTotalGanho: true,
        referenciaId: salvo.id,
        descricao: `Ajuste do fechamento de ${String(info.mes).padStart(2, '0')}/${info.ano}`,
      })
    }
  }

  estado.streakMesesAnterior = resultado.status === 'ok' ? resultado.streakMeses : 0
  estado.estavaEmManutencaoNoAno =
    estado.estavaEmManutencaoNoAno || (resultado.status === 'ok' && resultado.modo === 'manutencao')
}

/** Roda a cada carregamento do app: fecha e credita, de uma vez, todo mês
 *  anterior ao atual que ainda esteja como prévia — idempotente porque cada
 *  mês só é processado enquanto seu fechamento não estiver 'fechado'. */
export async function executarFechamentosPendentes(profileId: string): Promise<void> {
  const settings = await buscarSettings()
  const hoje = hojeISO()
  const primeiroMesISO = infoDoMes(settings.data_inicio).anoMesISO
  const todasAsPesagens = await listarPesagens(profileId)
  const metasCache = new Map<number, Promise<import('../types').AnnualGoal | null>>()
  const metaDoAno = (ano: number) => {
    if (!metasCache.has(ano)) metasCache.set(ano, buscarMetaAnual(profileId, ano))
    return metasCache.get(ano)!.then((m) =>
      m ? { pesoBaseKg: m.peso_base_kg, kgAPerder: m.kg_a_perder, pesoAlvoKg: m.peso_alvo_kg } : null,
    )
  }

  const estado: EstadoIteracao = {
    streakMesesAnterior: 0,
    estavaEmManutencaoNoAno: false,
    anoCorrente: null,
  }

  for (const info of mesesFechaveis(settings.data_inicio, hoje)) {
    const existente = await buscarFechamento(profileId, info.anoMesISO)
    if (existente?.status === 'fechado') {
      // já fechado: preserva o estado herdado para o próximo mês, sem recreditar
      estado.streakMesesAnterior = existente.streak_meses
      estado.estavaEmManutencaoNoAno = estado.estavaEmManutencaoNoAno || existente.modo === 'manutencao'
      estado.anoCorrente = info.ano
      continue
    }
    await processarMes(
      profileId,
      info,
      false,
      todasAsPesagens,
      primeiroMesISO,
      settings,
      metaDoAno,
      estado,
      false,
    )
  }

  const infoMesAtual = infoDoMes(hoje)
  await processarMes(
    profileId,
    infoMesAtual,
    true,
    todasAsPesagens,
    primeiroMesISO,
    settings,
    metaDoAno,
    estado,
    false,
  )
}

/** Editar/excluir uma pesagem de um mês já fechado reabre aquele mês e
 *  recalcula-o e a todos os seguintes — o peso inicial de um mês depende do
 *  mês anterior. A diferença de bônus vira lançamento de `ajuste`; o
 *  lançamento original nunca é apagado. */
export async function recalcularAPartirDoMes(
  profileId: string,
  anoMesAfetadoISO: string,
): Promise<void> {
  const settings = await buscarSettings()
  const hoje = hojeISO()
  const primeiroMesISO = infoDoMes(settings.data_inicio).anoMesISO
  const todasAsPesagens = await listarPesagens(profileId)
  const metasCache = new Map<number, Promise<import('../types').AnnualGoal | null>>()
  const metaDoAno = (ano: number) => {
    if (!metasCache.has(ano)) metasCache.set(ano, buscarMetaAnual(profileId, ano))
    return metasCache.get(ano)!.then((m) =>
      m ? { pesoBaseKg: m.peso_base_kg, kgAPerder: m.kg_a_perder, pesoAlvoKg: m.peso_alvo_kg } : null,
    )
  }

  const fechamentoAnterior = await buscarFechamento(profileId, mesAnteriorISO(anoMesAfetadoISO))
  const estado: EstadoIteracao = {
    streakMesesAnterior: fechamentoAnterior?.streak_meses ?? 0,
    estavaEmManutencaoNoAno: fechamentoAnterior?.modo === 'manutencao',
    anoCorrente: Number(anoMesAfetadoISO.slice(0, 4)),
  }

  const mesesAfetados = mesesFechaveis(settings.data_inicio, hoje).filter(
    (m) => m.anoMesISO >= anoMesAfetadoISO,
  )
  for (const info of mesesAfetados) {
    await processarMes(
      profileId,
      info,
      false,
      todasAsPesagens,
      primeiroMesISO,
      settings,
      metaDoAno,
      estado,
      true,
    )
  }

  const infoMesAtual = infoDoMes(hoje)
  await processarMes(
    profileId,
    infoMesAtual,
    true,
    todasAsPesagens,
    primeiroMesISO,
    settings,
    metaDoAno,
    estado,
    false,
  )
}
