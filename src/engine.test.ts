import { describe, expect, it } from 'vitest'
import { AppState, Mov } from './types'
import {
  accountEffect,
  balanceAt,
  boxBalance,
  boxMonthlyNeeded,
  buildSeries,
  dailyAllowance,
  monthRows,
  monthTotals,
} from './engine'
import { addMonthsClamped, daysInMonth } from './dates'

let seq = 0
const mkId = () => `id${seq++}`

function baseState(): AppState {
  return {
    version: 1,
    accounts: [{ id: 'acc1', name: 'Conta', color: '#000', initialBalance: 1000 }],
    cards: [],
    tags: [
      { id: 't1', name: 'ALIMENTAÇÃO', color: '#eee', isDaily: true, monthlyBudget: 900 },
      { id: 't2', name: 'LAZER', color: '#eee', isDaily: true, monthlyBudget: 600 },
    ],
    boxes: [{ id: 'b1', name: 'Viagem', color: '#00f', target: 1200, deadline: '2026-12-10' }],
    movs: [],
    settings: { savingsGoalPct: 10 },
  }
}

function mov(partial: Partial<Mov> & Pick<Mov, 'type' | 'amount' | 'date'>): Mov {
  return { id: mkId(), description: '', tagIds: [], createdAt: seq, ...partial }
}

describe('accountEffect', () => {
  it('entrada soma, saída/diário/aporte subtraem, cartão neutro', () => {
    expect(accountEffect(mov({ type: 'entrada', amount: 10, date: '2026-07-01' }))).toBe(10)
    expect(accountEffect(mov({ type: 'saida', amount: 10, date: '2026-07-01' }))).toBe(-10)
    expect(accountEffect(mov({ type: 'diario', amount: 10, date: '2026-07-01' }))).toBe(-10)
    expect(accountEffect(mov({ type: 'cartao', amount: 10, date: '2026-07-01' }))).toBe(0)
    expect(accountEffect(mov({ type: 'investimento', direction: 'aporte', amount: 10, date: '2026-07-01' }))).toBe(-10)
    expect(accountEffect(mov({ type: 'investimento', direction: 'resgate', amount: 10, date: '2026-07-01' }))).toBe(10)
  })
})

describe('dailyAllowance', () => {
  it('divide o orçamento diário do mês pelos dias', () => {
    const s = baseState()
    // 1500 / 31 dias de julho = 48,39
    expect(dailyAllowance(s.tags, 2026, 7)).toBeCloseTo(48.39, 2)
    // 1500 / 30 dias de junho = 50
    expect(dailyAllowance(s.tags, 2026, 6)).toBe(50)
  })
})

describe('balanceAt / monthRows', () => {
  it('saldo corrido bate com movimentações registradas', () => {
    const s = baseState()
    s.tags = [] // sem previsão de diário para este teste
    s.movs = [
      mov({ type: 'entrada', amount: 500, date: '2026-07-05' }),
      mov({ type: 'saida', amount: 200, date: '2026-07-10' }),
      mov({ type: 'cartao', amount: 999, date: '2026-07-10' }), // não afeta saldo
    ]
    expect(balanceAt(s, '2026-07-04')).toBe(1000)
    expect(balanceAt(s, '2026-07-05')).toBe(1500)
    expect(balanceAt(s, '2026-07-31')).toBe(1300)

    const rows = monthRows(s, 2026, 7, '2026-07-10')
    expect(rows[4].balance).toBe(1500) // dia 5
    expect(rows[9].balance).toBe(1300) // dia 10
    expect(rows[30].balance).toBe(1300) // fim do mês (sem previsões)
  })

  it('desconta previsão de diário só em dias futuros', () => {
    const s = baseState()
    s.tags = [{ id: 't1', name: 'X', color: '#eee', isDaily: true, monthlyBudget: 310 }] // 10/dia em julho
    const rows = monthRows(s, 2026, 7, '2026-07-29')
    expect(rows[28].forecastDiario).toBe(0) // dia 29 = hoje
    expect(rows[29].forecastDiario).toBe(10) // dia 30
    expect(rows[30].forecastDiario).toBe(10) // dia 31
    expect(rows[30].balance).toBe(1000 - 20)
  })

  it('diário já lançado num dia futuro abate a previsão daquele dia', () => {
    const s = baseState()
    s.tags = [{ id: 't1', name: 'X', color: '#eee', isDaily: true, monthlyBudget: 310 }]
    s.movs = [mov({ type: 'diario', amount: 4, date: '2026-07-30' })]
    const rows = monthRows(s, 2026, 7, '2026-07-29')
    expect(rows[29].forecastDiario).toBe(6) // 10 − 4
    expect(rows[30].balance).toBe(1000 - 4 - 6 - 10)
  })

  it('meses futuros herdam as previsões dos dias entre hoje e o início do mês', () => {
    const s = baseState()
    s.tags = [{ id: 't1', name: 'X', color: '#eee', isDaily: true, monthlyBudget: 310 }] // 10/dia jul, 310/31
    // hoje 29/jul: 2 dias de previsão em julho (30, 31) = 20
    // agosto inteiro: 310/31 = 10/dia × 31 = 310
    const rowsAug = monthRows(s, 2026, 8, '2026-07-29')
    expect(rowsAug[0].balance).toBe(1000 - 20 - 10)
    expect(rowsAug[30].balance).toBe(1000 - 20 - 310)
  })
})

describe('monthTotals', () => {
  it('calcula performance, custo de vida e economizado como o app de referência', () => {
    const s = baseState()
    s.tags = [{ id: 't1', name: 'X', color: '#eee', isDaily: true, monthlyBudget: 620 }] // 20/dia em julho
    s.movs = [
      mov({ type: 'entrada', amount: 5000, date: '2026-07-01' }),
      mov({ type: 'saida', amount: 2000, date: '2026-07-05' }),
      mov({ type: 'diario', amount: 300, date: '2026-07-08' }),
      mov({ type: 'cartao', amount: 400, date: '2026-07-09' }),
      mov({ type: 'investimento', direction: 'aporte', amount: 500, date: '2026-07-09', boxId: 'b1' }),
    ]
    const t = monthTotals(s, 2026, 7, '2026-07-10')
    // previsão: dias 11..31 = 21 dias × 20 = 420
    expect(t.forecastCount).toBe(21)
    expect(t.forecastTotal).toBe(420)
    expect(t.custoDeVida).toBe(2000 + 300 + 400 + 420)
    expect(t.performance).toBe(5000 - 2000 - 300 - 400 - 500 - 420)
    expect(t.economizadoPct).toBe(10) // 500 de aporte / 5000 de entradas
    expect(t.diarioMedio).toBe(30) // 300 / 10 dias
  })
})

describe('parcelamento e recorrência', () => {
  it('parcelado gera N parcelas mensais numeradas', () => {
    const base = mov({ type: 'saida', amount: 100, date: '2026-01-31', description: 'geladeira' })
    const { id, ...rest } = base
    const out = buildSeries(rest, { kind: 'parcelado', installments: 3 }, mkId)
    expect(out).toHaveLength(3)
    expect(out[0].date).toBe('2026-01-31')
    expect(out[1].date).toBe('2026-02-28') // clamp fim de mês
    expect(out[2].date).toBe('2026-03-31')
    expect(out[0].description).toBe('geladeira (1/3)')
    expect(out[2].description).toBe('geladeira (3/3)')
    expect(out.every((m) => m.seriesId === out[0].seriesId)).toBe(true)
  })

  it('fixo mensal gera uma ocorrência por mês (financiamento 30 anos = 360)', () => {
    const base = mov({ type: 'saida', amount: 2500, date: '2026-07-10', description: 'financiamento' })
    const { id, ...rest } = base
    const out = buildSeries(rest, { kind: 'fixo', months: 360 }, mkId)
    expect(out).toHaveLength(360)
    expect(out[359].date).toBe('2056-06-10')
    expect(out[359].description).toBe('financiamento')
  })
})

describe('caixinhas', () => {
  it('saldo = aportes − resgates; projeção mensal para bater a meta', () => {
    const s = baseState()
    s.movs = [
      mov({ type: 'investimento', direction: 'aporte', amount: 500, date: '2026-06-01', boxId: 'b1' }),
      mov({ type: 'investimento', direction: 'aporte', amount: 300, date: '2026-07-01', boxId: 'b1' }),
      mov({ type: 'investimento', direction: 'resgate', amount: 100, date: '2026-07-05', boxId: 'b1' }),
    ]
    expect(boxBalance(s, 'b1')).toBe(700)
    // faltam 500 até a meta de 1200; prazo 2026-12-10, hoje 2026-07-10 → 5 meses
    expect(boxMonthlyNeeded(s, 'b1', '2026-07-10')).toBe(100)
  })
})

describe('datas', () => {
  it('addMonthsClamped trata fim de mês e virada de ano', () => {
    expect(addMonthsClamped('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonthsClamped('2026-12-15', 1)).toBe('2027-01-15')
    expect(addMonthsClamped('2024-01-31', 1)).toBe('2024-02-29') // bissexto
    expect(daysInMonth(2026, 2)).toBe(28)
  })
})
