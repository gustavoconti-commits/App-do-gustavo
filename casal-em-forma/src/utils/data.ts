import { format } from 'date-fns'
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
