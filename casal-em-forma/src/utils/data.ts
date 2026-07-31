import { format, startOfWeek, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function hojeISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function formatarDataExtensa(dataISO: string): string {
  return format(new Date(`${dataISO}T12:00:00`), "EEEE, d 'de' MMMM", { locale: ptBR })
}

export function formatarDataCurta(dataISO: string): string {
  return format(new Date(`${dataISO}T12:00:00`), 'dd/MM', { locale: ptBR })
}

function paraData(dataISO: string): Date {
  return new Date(`${dataISO}T12:00:00`)
}

/** Segunda-feira (ISO, weekStartsOn: 1) da semana que contém a data dada. */
export function inicioDaSemanaISO(dataISO: string): string {
  return format(startOfWeek(paraData(dataISO), { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

/** Os 7 dias (segunda a domingo) da semana que começa em `inicioSemanaISO`. */
export function diasDaSemana(inicioSemanaISO: string): string[] {
  const inicio = paraData(inicioSemanaISO)
  return Array.from({ length: 7 }, (_, i) => format(addDays(inicio, i), 'yyyy-MM-dd'))
}

export function semanaAnteriorISO(inicioSemanaISO: string): string {
  return format(addDays(paraData(inicioSemanaISO), -7), 'yyyy-MM-dd')
}

export function semanaSeguinteISO(inicioSemanaISO: string): string {
  return format(addDays(paraData(inicioSemanaISO), 7), 'yyyy-MM-dd')
}

export function formatarIntervaloSemana(inicioSemanaISO: string): string {
  const dias = diasDaSemana(inicioSemanaISO)
  const inicio = format(paraData(dias[0]), 'd/MM')
  const fim = format(paraData(dias[6]), 'd/MM')
  return `${inicio} – ${fim}`
}

export function iniciaisDia(dataISO: string): string {
  return format(paraData(dataISO), 'EEEEEE', { locale: ptBR })
}
