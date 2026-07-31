export type Profile = {
  id: string
  nome: string
  cor_hex: string
  altura_cm: number | null
  criado_em: string
}

export type Settings = {
  id: 1
  data_inicio: string
  pontos_por_habito: number
  bonus_dia_perfeito: number
  bonus_semana_perfeita: number
  limite_habitos_ativos: number
  faixa_parcial: number
  faixa_completa: number
  bonus_peso_parcial: number
  bonus_peso_completo: number
  bonus_streak_2: number
  bonus_streak_3mais: number
  tolerancia_manutencao_kg: number
  min_pesagens_mes: number
  meta_mensal_maxima_pct: number
  valor_ponto_cofrinho: number
  teto_cofrinho_mensal_reais: number
  pedagio_transferencia: number
  custo_tier_pequena: number
  custo_tier_media: number
  custo_escapada_pequena: number
  custo_escapada_grande: number
  custo_tier_casal: number
}

export type Habit = {
  id: string
  profile_id: string
  nome: string
  dias_semana: number[]
  pontos: number
  ordem: number
  arquivado_em: string | null
  criado_em: string
}

export type HabitLog = {
  id: string
  habit_id: string
  profile_id: string
  data: string
  criado_em: string
}

export type WeighIn = {
  id: string
  profile_id: string
  data: string
  peso_kg: number
  observacao: string | null
}

export type AnnualGoal = {
  id: string
  profile_id: string
  ano: number
  data_criacao: string
  peso_base_kg: number
  kg_a_perder: number
  peso_alvo_kg: number
  criado_em: string
}

export type MonthlyClosingStatus = 'previa' | 'fechado' | 'insuficiente' | 'sem_meta'
export type Modo = 'emagrecimento' | 'manutencao'

export type MonthlyClosing = {
  id: string
  profile_id: string
  ano_mes: string
  modo: Modo
  peso_inicial_kg: number | null
  peso_final_kg: number | null
  meses_restantes: number | null
  meta_kg: number | null
  meta_limitada: boolean
  perda_kg: number | null
  percentual_atingido: number | null
  qtd_pesagens: number
  bonus_base: number
  bonus_streak: number
  bonus_total: number
  streak_meses: number
  status: MonthlyClosingStatus
  fechado_em: string | null
}

export type LedgerTipo =
  | 'bonus_peso'
  | 'resgate'
  | 'transferencia_envio'
  | 'transferencia_recebimento'
  | 'ajuste'

export type LedgerEntry = {
  id: string
  profile_id: string
  data: string
  tipo: LedgerTipo
  pontos: number
  conta_para_total_ganho: boolean
  referencia_id: string | null
  descricao: string
  criado_em: string
}

export type RedemptionCategoria =
  | 'pequena'
  | 'media'
  | 'escapada_pequena'
  | 'escapada_grande'
  | 'casal'

export type Redemption = {
  id: string
  escopo: 'individual' | 'casal'
  categoria: RedemptionCategoria
  profile_id: string | null
  pontos_gastos: number
  descricao: string
  data: string
  criado_em: string
}

export type Transfer = {
  id: string
  de_profile_id: string
  para_profile_id: string
  pontos_enviados: number
  pontos_recebidos: number
  data: string
  criado_em: string
}

export type PiggyWithdrawal = {
  id: string
  profile_id: string
  data: string
  valor_reais: number
  descricao: string | null
  criado_em: string
}
