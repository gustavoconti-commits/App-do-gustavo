// Tipos de movimentação, na mesma linha do app de referência:
// entrada (+), saída (−), diário (−, conta no teto de gasto diário),
// cartão (não afeta saldo em conta) e investimento — que unifica
// "economia" e "investimento": dinheiro guardado sai da conta e entra
// na caixinha escolhida (− aporte / + resgate).
export type MovType = 'entrada' | 'saida' | 'diario' | 'cartao' | 'investimento'

export interface Account {
  id: string
  name: string
  color: string
  initialBalance: number // saldo na data em que começou a usar o app
  archived?: boolean
}

export interface Card {
  id: string
  name: string
  color: string
  archived?: boolean
}

export interface Tag {
  id: string
  name: string
  color: string
  // Orçamento mensal desta tag. Tags marcadas como "diário" somam no teto
  // de gasto diário do mês (total / dias do mês = diária).
  monthlyBudget?: number
  isDaily?: boolean
}

// Caixinha de investimento (objetivo)
export interface Box {
  id: string
  name: string
  color: string
  target?: number
  deadline?: string // YYYY-MM-DD
  archived?: boolean
}

export type RepeatKind = 'none' | 'parcelado' | 'fixo'

export interface Mov {
  id: string
  type: MovType
  description: string
  amount: number // sempre positivo; o sinal vem do tipo/direção
  date: string // YYYY-MM-DD
  accountId?: string
  cardId?: string // apenas cartao
  boxId?: string // apenas investimento
  direction?: 'aporte' | 'resgate' // apenas investimento
  tagIds: string[]
  seriesId?: string // grupo de recorrência/parcelamento
  seriesIndex?: number // 1-based
  seriesTotal?: number // total de parcelas (parcelado)
  done?: boolean // pago / recebido
  createdAt: number
}

export interface Settings {
  savingsGoalPct: number // meta de % economizado sobre entradas
}

export interface AppState {
  version: number
  accounts: Account[]
  cards: Card[]
  tags: Tag[]
  boxes: Box[]
  movs: Mov[]
  settings: Settings
}

export const TYPE_META: Record<
  MovType,
  { label: string; letter: string; color: string; verb: string }
> = {
  entrada: { label: 'entrada', letter: 'E', color: '#14603C', verb: 'adicionar entrada' },
  saida: { label: 'saída', letter: 'S', color: '#A3402D', verb: 'adicionar saída' },
  diario: { label: 'diário', letter: 'D', color: '#B0135B', verb: 'adicionar diário' },
  cartao: { label: 'gasto com cartão', letter: 'C', color: '#6A4FA3', verb: 'adicionar gasto com cartão' },
  investimento: { label: 'investimento', letter: 'I', color: '#C2A14E', verb: 'adicionar investimento' },
}

export const MOV_TYPES: MovType[] = ['entrada', 'saida', 'diario', 'cartao', 'investimento']
