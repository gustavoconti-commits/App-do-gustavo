// Utilitários de data baseados em strings YYYY-MM-DD (sem fuso horário).

export function todayISO(): string {
  const d = new Date()
  return toISO(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

export function toISO(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export function parseISO(s: string): { y: number; m: number; d: number } {
  const [y, m, d] = s.split('-').map(Number)
  return { y, m, d }
}

export function daysInMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate()
}

// Soma meses mantendo o dia, ajustando para o fim do mês quando necessário
// (31/jan + 1 mês = 28/fev).
export function addMonthsClamped(iso: string, months: number): string {
  const { y, m, d } = parseISO(iso)
  const total = y * 12 + (m - 1) + months
  const ny = Math.floor(total / 12)
  const nm = (total % 12) + 1
  const nd = Math.min(d, daysInMonth(ny, nm))
  return toISO(ny, nm, nd)
}

export function addDays(iso: string, days: number): string {
  const { y, m, d } = parseISO(iso)
  const dt = new Date(y, m - 1, d + days)
  return toISO(dt.getFullYear(), dt.getMonth() + 1, dt.getDate())
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7) // YYYY-MM
}

export function monthStart(y: number, m: number): string {
  return toISO(y, m, 1)
}

export function monthEnd(y: number, m: number): string {
  return toISO(y, m, daysInMonth(y, m))
}

export const MONTH_NAMES_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
export const MONTH_NAMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]
export const WEEKDAY_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

export function weekdayOf(iso: string): number {
  const { y, m, d } = parseISO(iso)
  return new Date(y, m - 1, d).getDay()
}

export function formatMonthYear(y: number, m: number): string {
  return `${MONTH_NAMES_SHORT[m - 1]}/${String(y).slice(2)}`
}

export function formatDateBR(iso: string): string {
  const { y, m, d } = parseISO(iso)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
}

export function formatDateShortBR(iso: string): string {
  const { m, d } = parseISO(iso)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`
}

// Diferença inteira de meses entre hoje e uma data futura (mínimo 1).
export function monthsUntil(fromISO: string, toISO_: string): number {
  const a = parseISO(fromISO)
  const b = parseISO(toISO_)
  const diff = (b.y - a.y) * 12 + (b.m - a.m) + (b.d >= a.d ? 0 : -1)
  return Math.max(1, diff)
}
