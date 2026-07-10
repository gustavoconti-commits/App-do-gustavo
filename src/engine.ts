import { AppState, Mov, MovType, Tag } from './types'
import { addMonthsClamped, daysInMonth, monthEnd, monthStart, monthsUntil, parseISO, toISO, todayISO } from './dates'
import { round2 } from './format'

// Efeito de uma movimentação sobre o saldo em conta bancária.
// Cartão não afeta o saldo (a fatura entra como saída quando for paga),
// para que o saldo do app bata com o saldo somado das contas no banco.
export function accountEffect(m: Mov): number {
  switch (m.type) {
    case 'entrada':
      return m.amount
    case 'saida':
    case 'diario':
    case 'economia':
      return -m.amount
    case 'investimento':
      return m.direction === 'resgate' ? m.amount : -m.amount
    case 'cartao':
      return 0
  }
}

export function initialBalanceTotal(state: AppState): number {
  return state.accounts.filter((a) => !a.archived).reduce((s, a) => s + a.initialBalance, 0)
}

// Teto mensal de gasto diário = soma dos orçamentos das tags marcadas como diário.
export function dailyBudgetMonthly(tags: Tag[]): number {
  return tags.filter((t) => t.isDaily && t.monthlyBudget).reduce((s, t) => s + (t.monthlyBudget || 0), 0)
}

// Diária: teto mensal dividido pelos dias do mês.
export function dailyAllowance(tags: Tag[], y: number, m: number): number {
  return round2(dailyBudgetMonthly(tags) / daysInMonth(y, m))
}

export function movsByDate(state: AppState): Map<string, Mov[]> {
  const map = new Map<string, Mov[]>()
  for (const mv of state.movs) {
    const arr = map.get(mv.date)
    if (arr) arr.push(mv)
    else map.set(mv.date, [mv])
  }
  return map
}

// Saldo em conta ao fim do dia `iso` considerando só movimentações registradas.
export function balanceAt(state: AppState, iso: string): number {
  let bal = initialBalanceTotal(state)
  for (const mv of state.movs) {
    if (mv.date <= iso) bal += accountEffect(mv)
  }
  return round2(bal)
}

// Previsão de diário de um dia futuro: a diária do mês menos o que já houver
// lançado de diário naquele dia (nunca negativa). Dias passados/hoje não têm previsão.
export function dayDiarioForecast(allowance: number, diarioSpent: number, iso: string, today: string): number {
  if (iso <= today) return 0
  return Math.max(0, round2(allowance - diarioSpent))
}

export interface DayRow {
  date: string
  day: number
  byType: Record<MovType, number>
  forecastDiario: number
  balance: number // saldo ao fim do dia, incluindo previsões de diário de dias futuros
  movs: Mov[]
}

// Linhas do fluxo de caixa de um mês, com saldo corrido.
// O saldo corrido de dias futuros desconta a previsão de diário dia a dia,
// como no app de referência.
export function monthRows(state: AppState, y: number, m: number, today = todayISO()): DayRow[] {
  const start = monthStart(y, m)
  const byDate = movsByDate(state)

  // saldo base: tudo antes do início do mês + previsões de diário entre hoje e o início do mês
  let bal = initialBalanceTotal(state)
  for (const mv of state.movs) {
    if (mv.date < start) bal += accountEffect(mv)
  }
  if (start > today) {
    // meses futuros: descontar previsão de diário dos dias entre amanhã e o fim do mês anterior
    let cursor = parseISO(today)
    const tYM = cursor.y * 12 + cursor.m
    const startYM = y * 12 + m
    for (let ym = tYM; ym < startYM; ym++) {
      const cy = Math.floor((ym - 1) / 12)
      const cm = ((ym - 1) % 12) + 1
      const allowanceC = dailyAllowance(state.tags, cy, cm)
      const dTotal = daysInMonth(cy, cm)
      const firstDay = ym === tYM ? cursor.d + 1 : 1
      for (let d = firstDay; d <= dTotal; d++) {
        const iso = toISO(cy, cm, d)
        const spent = (byDate.get(iso) || [])
          .filter((mv) => mv.type === 'diario')
          .reduce((s, mv) => s + mv.amount, 0)
        bal -= dayDiarioForecast(allowanceC, spent, iso, today)
      }
    }
  }

  const allowance = dailyAllowance(state.tags, y, m)
  const rows: DayRow[] = []
  const total = daysInMonth(y, m)
  for (let d = 1; d <= total; d++) {
    const iso = toISO(y, m, d)
    const movs = (byDate.get(iso) || []).slice().sort((a, b) => a.createdAt - b.createdAt)
    const byType: Record<MovType, number> = { entrada: 0, saida: 0, diario: 0, economia: 0, cartao: 0, investimento: 0 }
    for (const mv of movs) {
      byType[mv.type] += mv.amount
      bal += accountEffect(mv)
    }
    const forecast = dayDiarioForecast(allowance, byType.diario, iso, today)
    bal -= forecast
    rows.push({ date: iso, day: d, byType, forecastDiario: forecast, balance: round2(bal), movs })
  }
  return rows
}

export interface MonthTotals {
  entradas: number
  saidas: number
  diarios: number
  economias: number
  cartao: number
  investAportes: number
  investResgates: number
  forecastCount: number
  forecastTotal: number
  allowance: number
  performance: number
  custoDeVida: number
  economizadoPct: number // 0-100
  diarioMedio: number
  daysElapsed: number
  endBalance: number // saldo projetado ao fim do mês
}

export function monthTotals(state: AppState, y: number, m: number, today = todayISO()): MonthTotals {
  const rows = monthRows(state, y, m, today)
  const t = { entradas: 0, saidas: 0, diarios: 0, economias: 0, cartao: 0, investAportes: 0, investResgates: 0 }
  let forecastCount = 0
  let forecastTotal = 0
  for (const r of rows) {
    t.entradas += r.byType.entrada
    t.saidas += r.byType.saida
    t.diarios += r.byType.diario
    t.economias += r.byType.economia
    t.cartao += r.byType.cartao
    for (const mv of r.movs) {
      if (mv.type === 'investimento') {
        if (mv.direction === 'resgate') t.investResgates += mv.amount
        else t.investAportes += mv.amount
      }
    }
    if (r.forecastDiario > 0) {
      forecastCount++
      forecastTotal += r.forecastDiario
    }
  }
  const allowance = dailyAllowance(state.tags, y, m)
  const tk = today.slice(0, 7)
  const mk = `${y}-${String(m).padStart(2, '0')}`
  let daysElapsed: number
  if (mk < tk) daysElapsed = daysInMonth(y, m)
  else if (mk > tk) daysElapsed = 0
  else daysElapsed = parseISO(today).d

  const custoDeVida = round2(t.saidas + t.diarios + t.cartao + forecastTotal)
  const performance = round2(t.entradas - t.saidas - t.diarios - t.economias - t.cartao - forecastTotal)
  const economizadoPct = t.entradas > 0 ? Math.round(((t.economias + t.investAportes) / t.entradas) * 100) : 0
  return {
    ...t,
    forecastCount,
    forecastTotal: round2(forecastTotal),
    allowance,
    performance,
    custoDeVida,
    economizadoPct,
    diarioMedio: daysElapsed > 0 ? round2(t.diarios / daysElapsed) : 0,
    daysElapsed,
    endBalance: rows[rows.length - 1].balance,
  }
}

// Total gasto por tag em um mês (todas as movimentações que levam a tag).
export function tagSpentInMonth(state: AppState, tagId: string, y: number, m: number): number {
  const start = monthStart(y, m)
  const end = monthEnd(y, m)
  let sum = 0
  for (const mv of state.movs) {
    if (mv.date >= start && mv.date <= end && mv.tagIds.includes(tagId) && mv.type !== 'entrada') {
      sum += mv.amount
    }
  }
  return round2(sum)
}

// Saldo de uma caixinha de investimento: aportes − resgates.
export function boxBalance(state: AppState, boxId: string): number {
  let sum = 0
  for (const mv of state.movs) {
    if (mv.type === 'investimento' && mv.boxId === boxId) {
      sum += mv.direction === 'resgate' ? -mv.amount : mv.amount
    }
  }
  return round2(sum)
}

export function investedTotal(state: AppState): number {
  return round2(state.boxes.filter((b) => !b.archived).reduce((s, b) => s + boxBalance(state, b.id), 0))
}

// Quanto guardar por mês para bater a meta da caixinha até o prazo.
export function boxMonthlyNeeded(state: AppState, boxId: string, today = todayISO()): number | null {
  const box = state.boxes.find((b) => b.id === boxId)
  if (!box || !box.target || !box.deadline || box.deadline <= today) return null
  const missing = box.target - boxBalance(state, boxId)
  if (missing <= 0) return 0
  return round2(missing / monthsUntil(today, box.deadline))
}

// ---- Recorrência / parcelamento -----------------------------------------
// As ocorrências são materializadas como movimentações individuais ligadas
// por seriesId, para que cada parcela possa ser editada/paga individualmente.

export interface RepeatSpec {
  kind: 'none' | 'parcelado' | 'fixo'
  installments?: number // parcelado: número de parcelas
  months?: number // fixo: repetir por N meses
}

export function buildSeries(base: Omit<Mov, 'id' | 'seriesId' | 'seriesIndex' | 'seriesTotal'>, repeat: RepeatSpec, mkId: () => string): Mov[] {
  if (repeat.kind === 'none') {
    return [{ ...base, id: mkId() }]
  }
  const seriesId = mkId()
  const n = repeat.kind === 'parcelado' ? Math.max(1, repeat.installments || 1) : Math.max(1, repeat.months || 1)
  const out: Mov[] = []
  for (let i = 0; i < n; i++) {
    out.push({
      ...base,
      id: mkId(),
      date: addMonthsClamped(base.date, i),
      description:
        repeat.kind === 'parcelado' && n > 1 ? `${base.description || 'parcelado'} (${i + 1}/${n})` : base.description,
      seriesId,
      seriesIndex: i + 1,
      seriesTotal: repeat.kind === 'parcelado' ? n : undefined,
    })
  }
  return out
}
