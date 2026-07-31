// Bônus de peso — apuração mensal, streak e modo manutenção
// (seções 8.3 a 8.6 do PROMPT MESTRE v3). Funções puras.
import { calcularMetaDoMes, type MetaAnual } from './metas'

export type Modo = 'emagrecimento' | 'manutencao'
export type StatusFechamento = 'ok' | 'insuficiente' | 'sem_meta'

function media(pesos: number[]): number {
  return pesos.reduce((soma, p) => soma + p, 0) / pesos.length
}

function mediaUltimos3(pesos: number[]): number {
  return media(pesos.slice(-3))
}

function mediaPrimeiros3(pesos: number[]): number {
  return media(pesos.slice(0, 3))
}

/** Peso inicial do mês: média das 3 últimas pesagens do mês anterior. No
 *  primeiro mês (ou quando o mês anterior não tem nenhuma pesagem), cai para
 *  as 3 primeiras pesagens disponíveis. `null` quando não há dado nenhum. */
export function calcularPesoInicialDoMes(params: {
  pesagensMesAnterior: number[] // ordem cronológica
  pesagensDesdeOInicio: number[] // todo o histórico até então, cronológico
  pesagensMesCorrente: number[]
  ehPrimeiroMes: boolean
}): number | null {
  if (params.ehPrimeiroMes) {
    return params.pesagensDesdeOInicio.length > 0
      ? mediaPrimeiros3(params.pesagensDesdeOInicio)
      : null
  }
  if (params.pesagensMesAnterior.length > 0) {
    return mediaUltimos3(params.pesagensMesAnterior)
  }
  return params.pesagensMesCorrente.length > 0
    ? mediaPrimeiros3(params.pesagensMesCorrente)
    : null
}

/** Peso final do mês: média das 3 últimas pesagens do próprio mês. */
export function calcularPesoFinalDoMes(pesagensMesCorrente: number[]): number | null {
  return pesagensMesCorrente.length > 0 ? mediaUltimos3(pesagensMesCorrente) : null
}

// --- 8.4 Tabela de bônus (modo emagrecimento) -------------------------------

export type ResultadoBonusBase = { bonusBase: number; naFaixa: boolean }

/** Não existe bônus maior por ultrapassar a meta — 115% continua pagando o
 *  mesmo +60 de 90%. Intencional: não incentivar perda acelerada. */
export function calcularBonusEmagrecimento(
  percentualAtingido: number,
  faixaParcial: number,
  faixaCompleta: number,
  bonusPesoParcial: number,
  bonusPesoCompleto: number,
): ResultadoBonusBase {
  if (percentualAtingido >= faixaCompleta) {
    return { bonusBase: bonusPesoCompleto, naFaixa: true }
  }
  if (percentualAtingido >= faixaParcial) {
    return { bonusBase: bonusPesoParcial, naFaixa: false }
  }
  return { bonusBase: 0, naFaixa: false }
}

// --- 8.5 Sequência (streak) --------------------------------------------------

export type ResultadoStreak = { streakMeses: number; bonusStreak: number }

/** "Mês na faixa" = 90%+ (ou dentro da tolerância, em manutenção). Um mês
 *  fora da faixa zera a sequência sem tirar pontos já creditados. */
export function calcularStreak(
  streakMesesAnterior: number,
  naFaixaEsteMs: boolean,
  bonusStreak2: number,
  bonusStreak3Mais: number,
): ResultadoStreak {
  if (!naFaixaEsteMs) return { streakMeses: 0, bonusStreak: 0 }

  const streakMeses = streakMesesAnterior + 1
  if (streakMeses === 1) return { streakMeses, bonusStreak: 0 }
  if (streakMeses === 2) return { streakMeses, bonusStreak: bonusStreak2 }
  return { streakMeses, bonusStreak: bonusStreak3Mais }
}

// --- 8.6 Modo manutenção -----------------------------------------------------

/** Ativa quando um fechamento registra peso final <= peso_alvo_kg do ano, e
 *  permanece ativo pelo resto daquele ano (janeiro reabre emagrecimento). */
export function determinarModoDoMes(params: {
  estavaEmManutencaoNoAno: boolean
  pesoFinalDoMes: number | null
  pesoAlvoAnoKg: number
}): Modo {
  if (params.estavaEmManutencaoNoAno) return 'manutencao'
  if (params.pesoFinalDoMes !== null && params.pesoFinalDoMes <= params.pesoAlvoAnoKg) {
    return 'manutencao'
  }
  return 'emagrecimento'
}

export function calcularBonusManutencao(
  pesoFinalDoMes: number,
  pesoAlvoAnoKg: number,
  toleranciaKg: number,
  bonusPesoCompleto: number,
): ResultadoBonusBase {
  const dentroDaFaixa = Math.abs(pesoFinalDoMes - pesoAlvoAnoKg) <= toleranciaKg
  return { bonusBase: dentroDaFaixa ? bonusPesoCompleto : 0, naFaixa: dentroDaFaixa }
}

// --- Orquestrador: fechamento de um mês -------------------------------------

export type SettingsParaBonusPeso = {
  min_pesagens_mes: number
  faixa_parcial: number
  faixa_completa: number
  bonus_peso_parcial: number
  bonus_peso_completo: number
  bonus_streak_2: number
  bonus_streak_3mais: number
  tolerancia_manutencao_kg: number
  meta_mensal_maxima_pct: number
}

export type ResultadoFechamentoMensal =
  | { status: 'sem_meta'; bonusTotal: 0; streakMeses: 0 }
  | { status: 'insuficiente'; bonusTotal: 0; streakMeses: 0 }
  | {
      status: 'ok'
      modo: Modo
      pesoInicialKg: number
      pesoFinalKg: number
      perdaKg: number
      metaKg: number
      metaLimitada: boolean
      percentualAtingido: number | null
      naFaixa: boolean
      bonusBase: number
      streakMeses: number
      bonusStreak: number
      bonusTotal: number
    }

export function calcularFechamentoMensal(params: {
  mes: number // 1-12
  pesagensMesAnterior: number[]
  pesagensDesdeOInicio: number[]
  pesagensMesCorrente: number[]
  ehPrimeiroMes: boolean
  metaAnual: MetaAnual | null
  estavaEmManutencaoNoAno: boolean
  streakMesesAnterior: number
  settings: SettingsParaBonusPeso
}): ResultadoFechamentoMensal {
  if (params.pesagensMesCorrente.length < params.settings.min_pesagens_mes) {
    return { status: 'insuficiente', bonusTotal: 0, streakMeses: 0 }
  }

  if (!params.metaAnual) {
    return { status: 'sem_meta', bonusTotal: 0, streakMeses: 0 }
  }

  const pesoInicialKg = calcularPesoInicialDoMes({
    pesagensMesAnterior: params.pesagensMesAnterior,
    pesagensDesdeOInicio: params.pesagensDesdeOInicio,
    pesagensMesCorrente: params.pesagensMesCorrente,
    ehPrimeiroMes: params.ehPrimeiroMes,
  })
  const pesoFinalKg = calcularPesoFinalDoMes(params.pesagensMesCorrente)

  if (pesoInicialKg === null || pesoFinalKg === null) {
    return { status: 'insuficiente', bonusTotal: 0, streakMeses: 0 }
  }

  const modo = determinarModoDoMes({
    estavaEmManutencaoNoAno: params.estavaEmManutencaoNoAno,
    pesoFinalDoMes: pesoFinalKg,
    pesoAlvoAnoKg: params.metaAnual.pesoAlvoKg,
  })

  const perdaKg = pesoInicialKg - pesoFinalKg

  if (modo === 'manutencao') {
    const { bonusBase, naFaixa } = calcularBonusManutencao(
      pesoFinalKg,
      params.metaAnual.pesoAlvoKg,
      params.settings.tolerancia_manutencao_kg,
      params.settings.bonus_peso_completo,
    )
    const { streakMeses, bonusStreak } = calcularStreak(
      params.streakMesesAnterior,
      naFaixa,
      params.settings.bonus_streak_2,
      params.settings.bonus_streak_3mais,
    )
    return {
      status: 'ok',
      modo,
      pesoInicialKg,
      pesoFinalKg,
      perdaKg,
      metaKg: params.settings.tolerancia_manutencao_kg,
      metaLimitada: false,
      percentualAtingido: null,
      naFaixa,
      bonusBase,
      streakMeses,
      bonusStreak,
      bonusTotal: bonusBase + bonusStreak,
    }
  }

  const meta = calcularMetaDoMes({
    metaAnual: params.metaAnual,
    mes: params.mes,
    pesoInicialDoMes: pesoInicialKg,
    metaMensalMaximaPct: params.settings.meta_mensal_maxima_pct,
  })
  if (meta.status !== 'ok') {
    return { status: 'sem_meta', bonusTotal: 0, streakMeses: 0 }
  }

  const percentualAtingido = meta.metaKg !== 0 ? perdaKg / meta.metaKg : 0
  const { bonusBase, naFaixa } = calcularBonusEmagrecimento(
    percentualAtingido,
    params.settings.faixa_parcial,
    params.settings.faixa_completa,
    params.settings.bonus_peso_parcial,
    params.settings.bonus_peso_completo,
  )
  const { streakMeses, bonusStreak } = calcularStreak(
    params.streakMesesAnterior,
    naFaixa,
    params.settings.bonus_streak_2,
    params.settings.bonus_streak_3mais,
  )

  return {
    status: 'ok',
    modo,
    pesoInicialKg,
    pesoFinalKg,
    perdaKg,
    metaKg: meta.metaKg,
    metaLimitada: meta.metaLimitada,
    percentualAtingido,
    naFaixa,
    bonusBase,
    streakMeses,
    bonusStreak,
    bonusTotal: bonusBase + bonusStreak,
  }
}
