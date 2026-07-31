import { supabase } from './supabase'
import type { MonthlyClosing, MonthlyClosingStatus, Modo } from '../types'

export async function buscarFechamento(
  profileId: string,
  anoMesISO: string,
): Promise<MonthlyClosing | null> {
  const { data, error } = await supabase
    .from('monthly_closings')
    .select('*')
    .eq('profile_id', profileId)
    .eq('ano_mes', anoMesISO)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function listarFechamentos(profileId: string): Promise<MonthlyClosing[]> {
  const { data, error } = await supabase
    .from('monthly_closings')
    .select('*')
    .eq('profile_id', profileId)
    .order('ano_mes', { ascending: false })
  if (error) throw error
  return data
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
  const { data, error } = await supabase
    .from('monthly_closings')
    .upsert(
      {
        profile_id: input.profileId,
        ano_mes: input.anoMesISO,
        status: input.status,
        modo: input.modo ?? 'emagrecimento',
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
      },
      { onConflict: 'profile_id,ano_mes' },
    )
    .select()
    .single()
  if (error) throw error
  return data
}
