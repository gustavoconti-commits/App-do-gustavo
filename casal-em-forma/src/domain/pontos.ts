// Motor de pontos — funções puras. Sem React, sem Supabase, sem `new Date()`
// interno: toda data de referência entra por parâmetro (ver seção 6.1 do
// PROMPT MESTRE v3).
import { eachDayOfInterval, getISODay, startOfWeek, endOfWeek, format } from 'date-fns'

export type HabitoParaPontos = {
  id: string
  diasSemana: number[] // 1=segunda … 7=domingo
  criadoEm: string // ISO date (yyyy-MM-dd) ou timestamp — só o prefixo de data é usado
  arquivadoEm: string | null
}

export type LogParaPontos = {
  habitId: string
  data: string // yyyy-MM-dd
}

export type SettingsParaPontos = {
  pontos_por_habito: number
  bonus_dia_perfeito: number
  bonus_semana_perfeita: number
  data_inicio: string // yyyy-MM-dd
}

function paraData(dataISO: string): Date {
  return new Date(`${dataISO}T12:00:00`)
}

function prefixoData(valor: string): string {
  return valor.slice(0, 10)
}

export function habitoProgramadoNoDia(habito: HabitoParaPontos, dataISO: string): boolean {
  return habito.diasSemana.includes(getISODay(paraData(dataISO)))
}

export function habitoAtivoNaData(habito: HabitoParaPontos, dataISO: string): boolean {
  const jaExistia = dataISO >= prefixoData(habito.criadoEm)
  const aindaNaoArquivado = !habito.arquivadoEm || dataISO < prefixoData(habito.arquivadoEm)
  return jaExistia && aindaNaoArquivado
}

/** Hábitos que valem para aquele dia específico: ativos e programados. */
export function habitosDoDia(habitos: HabitoParaPontos[], dataISO: string): HabitoParaPontos[] {
  return habitos.filter((h) => habitoAtivoNaData(h, dataISO) && habitoProgramadoNoDia(h, dataISO))
}

export function dataDentroDoPeriodo(dataISO: string, dataInicio: string, hojeISO: string): boolean {
  return dataISO >= dataInicio && dataISO <= hojeISO
}

/** Um dia é perfeito quando todos os hábitos programados naquele dia foram marcados.
 *  Dia sem hábito programado nunca é perfeito. */
export function diaEhPerfeito(
  habitosDoDiaCalculados: HabitoParaPontos[],
  habitIdsMarcadosNoDia: Set<string>,
): boolean {
  if (habitosDoDiaCalculados.length === 0) return false
  return habitosDoDiaCalculados.every((h) => habitIdsMarcadosNoDia.has(h.id))
}

export type ResultadoDia = {
  data: string
  pontosHabitos: number
  diaPerfeito: boolean
  bonusDiaPerfeito: number
}

/** Pontos de um único dia: 1 por hábito marcado + bônus de dia perfeito. */
export function calcularPontosDoDia(
  habitos: HabitoParaPontos[],
  logs: LogParaPontos[],
  dataISO: string,
  settings: SettingsParaPontos,
): ResultadoDia {
  const habitosDeHoje = habitosDoDia(habitos, dataISO)
  const marcadosNoDia = new Set(
    logs.filter((l) => l.data === dataISO).map((l) => l.habitId),
  )
  const marcadosValidos = habitosDeHoje.filter((h) => marcadosNoDia.has(h.id))
  const perfeito = diaEhPerfeito(habitosDeHoje, marcadosNoDia)

  return {
    data: dataISO,
    pontosHabitos: marcadosValidos.length * settings.pontos_por_habito,
    diaPerfeito: perfeito,
    bonusDiaPerfeito: perfeito ? settings.bonus_dia_perfeito : 0,
  }
}

/** Uma semana (segunda a domingo) é perfeita quando os 7 dias são perfeitos e
 *  os 7 dias estão dentro do período de apuração (>= data_inicio, <= hoje). */
export function semanaEhPerfeita(
  inicioSemanaISO: string,
  habitos: HabitoParaPontos[],
  logs: LogParaPontos[],
  settings: SettingsParaPontos,
  hojeISO: string,
): boolean {
  const dias = eachDayOfInterval({
    start: startOfWeek(paraData(inicioSemanaISO), { weekStartsOn: 1 }),
    end: endOfWeek(paraData(inicioSemanaISO), { weekStartsOn: 1 }),
  }).map((d) => format(d, 'yyyy-MM-dd'))

  if (!dias.every((d) => dataDentroDoPeriodo(d, settings.data_inicio, hojeISO))) return false

  return dias.every((d) => calcularPontosDoDia(habitos, logs, d, settings).diaPerfeito)
}

export type ResultadoPontosHabitos = {
  total: number
  pontosHabitos: number
  bonusDiasPerfeitos: number
  bonusSemanasPerfeitas: number
  porDia: ResultadoDia[]
  semanasPerfeitas: string[] // início (segunda) de cada semana perfeita
}

/** Soma os pontos de hábito de um perfil entre `data_inicio` e `hojeISO`, incluindo
 *  bônus de dia perfeito e semana perfeita. Fonte única para saldo e extrato. */
export function calcularPontosHabitos(
  habitos: HabitoParaPontos[],
  logs: LogParaPontos[],
  settings: SettingsParaPontos,
  hojeISO: string,
): ResultadoPontosHabitos {
  if (settings.data_inicio > hojeISO) {
    return {
      total: 0,
      pontosHabitos: 0,
      bonusDiasPerfeitos: 0,
      bonusSemanasPerfeitas: 0,
      porDia: [],
      semanasPerfeitas: [],
    }
  }

  const dias = eachDayOfInterval({
    start: paraData(settings.data_inicio),
    end: paraData(hojeISO),
  }).map((d) => format(d, 'yyyy-MM-dd'))

  const porDia = dias.map((d) => calcularPontosDoDia(habitos, logs, d, settings))

  const iniciosDeSemanaVistos = new Set<string>()
  for (const d of dias) {
    iniciosDeSemanaVistos.add(
      format(startOfWeek(paraData(d), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    )
  }
  const semanasPerfeitas = [...iniciosDeSemanaVistos].filter((inicio) =>
    semanaEhPerfeita(inicio, habitos, logs, settings, hojeISO),
  )

  const pontosHabitos = porDia.reduce((soma, d) => soma + d.pontosHabitos, 0)
  const bonusDiasPerfeitos = porDia.reduce((soma, d) => soma + d.bonusDiaPerfeito, 0)
  const bonusSemanasPerfeitas = semanasPerfeitas.length * settings.bonus_semana_perfeita

  return {
    total: pontosHabitos + bonusDiasPerfeitos + bonusSemanasPerfeitas,
    pontosHabitos,
    bonusDiasPerfeitos,
    bonusSemanasPerfeitas,
    porDia,
    semanasPerfeitas,
  }
}

// --- Saldo, total ganho e cofrinho (seção 6.1 e 6.3) ---------------------

export type LancamentoParaSaldo = {
  pontos: number
}

export type LancamentoParaTotalGanho = {
  pontos: number
  contaParaTotalGanho: boolean
}

export function calcularSaldo(
  pontosDeHabitos: number,
  lancamentos: LancamentoParaSaldo[],
): number {
  return pontosDeHabitos + lancamentos.reduce((soma, l) => soma + l.pontos, 0)
}

export function calcularTotalGanho(
  pontosDeHabitos: number,
  lancamentos: LancamentoParaTotalGanho[],
): number {
  const creditosQueContam = lancamentos
    .filter((l) => l.pontos > 0 && l.contaParaTotalGanho)
    .reduce((soma, l) => soma + l.pontos, 0)
  return pontosDeHabitos + creditosQueContam
}

export function calcularCofrinho(
  totalGanho: number,
  valorPontoCofrinho: number,
  saques: { valorReais: number }[],
): number {
  const bruto = totalGanho * valorPontoCofrinho
  const sacado = saques.reduce((soma, s) => soma + s.valorReais, 0)
  return bruto - sacado
}

// --- Transferência entre pessoas (seção 6.4) ------------------------------

export class SaldoInsuficienteError extends Error {
  constructor() {
    super('Saldo insuficiente para transferir.')
    this.name = 'SaldoInsuficienteError'
  }
}

export type ResultadoTransferencia = {
  pontosEnviados: number
  pontosRecebidos: number
}

/** Pedágio de 50%: quem envia perde o valor cheio, quem recebe leva metade,
 *  arredondando para baixo. Lança se o saldo do remetente for insuficiente. */
export function calcularTransferencia(
  saldoRemetente: number,
  pontosEnviados: number,
  pedagioTransferencia: number,
): ResultadoTransferencia {
  if (pontosEnviados <= 0) {
    throw new Error('A quantidade de pontos a transferir deve ser positiva.')
  }
  if (saldoRemetente < pontosEnviados) {
    throw new SaldoInsuficienteError()
  }
  const pontosRecebidos = Math.floor(pontosEnviados * (1 - pedagioTransferencia))
  return { pontosEnviados, pontosRecebidos }
}

/** Os dois lançamentos de ledger gerados por uma transferência. Nenhum dos
 *  dois alimenta o cofrinho — representa movimentação interna, não esforço. */
export function criarLancamentosTransferencia(
  transferencia: ResultadoTransferencia,
): {
  envio: LancamentoParaTotalGanho & { pontos: number }
  recebimento: LancamentoParaTotalGanho & { pontos: number }
} {
  return {
    envio: { pontos: -transferencia.pontosEnviados, contaParaTotalGanho: false },
    recebimento: { pontos: transferencia.pontosRecebidos, contaParaTotalGanho: false },
  }
}
