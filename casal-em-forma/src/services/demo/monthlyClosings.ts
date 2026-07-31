import { novoId, obterBanco, notificar } from './store'
import type { MonthlyClosing, MonthlyClosingStatus, Modo } from '../../types'

export async function buscarFechamento(
  profileId: string,
  anoMesISO: string,
): Promise<MonthlyClosing | null> {
  const fechamento = obterBanco().monthly_closings.find(
    (f) => f.profile_id === profileId && f.ano_mes === anoMesISO,
  )
  return fechamento ? { ...fechamento } : null
}

export async function listarFechamentos(profileId: string): Promise<MonthlyClosing[]> {
  return obterBanco()
    .monthly_closings.filter((f) => f.profile_id === profileId)
    .sort((a, b) => b.ano_mes.localeCompare(a.ano_mes))
    .map((f) => ({ ...f }))
}

export async function salvarFechamento(input: {
  profileId: string
  anoMesISO: string
  status: MonthlyClosingStatus
  modo?: Modo
  pesoInicialKg?: number | null
  pesoFinalKg?: number | null
  mesesRestantes?: number | null
  metaKg?: number | null
  metaLimitada?: boolean
  perdaKg?: number | null
  percentualAtingido?: number | null
  qtdPesagens: number
  bonusBase?: number
  bonusStreak?: number
  bonusTotal?: number
  streakMeses?: number
}): Promise<MonthlyClosing> {
  const banco = obterBanco()
  const campos = {
    status: input.status,
    modo: input.modo ?? ('emagrecimento' as Modo),
    peso_inicial_kg: input.pesoInicialKg ?? null,
    peso_final_kg: input.pesoFinalKg ?? null,
    meses_restantes: input.mesesRestantes ?? null,
    meta_kg: input.metaKg ?? null,
    meta_limitada: input.metaLimitada ?? false,
    perda_kg: input.perdaKg ?? null,
    percentual_atingido: input.percentualAtingido ?? null,
    qtd_pesagens: input.qtdPesagens,
    bonus_base: input.bonusBase ?? 0,
    bonus_streak: input.bonusStreak ?? 0,
    bonus_total: input.bonusTotal ?? 0,
    streak_meses: input.streakMeses ?? 0,
    fechado_em: input.status === 'fechado' ? new Date().toISOString() : null,
  }
  const existente = banco.monthly_closings.find(
    (f) => f.profile_id === input.profileId && f.ano_mes === input.anoMesISO,
  )
  if (existente) {
    Object.assign(existente, campos)
    notificar('monthly_closings')
    return { ...existente }
  }
  const novo: MonthlyClosing = {
    id: novoId(),
    profile_id: input.profileId,
    ano_mes: input.anoMesISO,
    ...campos,
  }
  banco.monthly_closings.push(novo)
  notificar('monthly_closings')
  return { ...novo }
}
