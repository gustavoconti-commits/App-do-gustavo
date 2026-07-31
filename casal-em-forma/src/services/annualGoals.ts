import { supabase } from './supabase'
import type { AnnualGoal } from '../types'

export async function buscarMetaAnual(profileId: string, ano: number): Promise<AnnualGoal | null> {
  const { data, error } = await supabase
    .from('annual_goals')
    .select('*')
    .eq('profile_id', profileId)
    .eq('ano', ano)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function listarMetasAnuais(profileId: string): Promise<AnnualGoal[]> {
  const { data, error } = await supabase
    .from('annual_goals')
    .select('*')
    .eq('profile_id', profileId)
    .order('ano', { ascending: false })
  if (error) throw error
  return data
}

export async function definirMetaAnual(input: {
  profileId: string
  ano: number
  pesoBaseKg: number
  kgAPerder: number
}): Promise<AnnualGoal> {
  const { data, error } = await supabase
    .from('annual_goals')
    .upsert(
      {
        profile_id: input.profileId,
        ano: input.ano,
        peso_base_kg: input.pesoBaseKg,
        kg_a_perder: input.kgAPerder,
        peso_alvo_kg: input.pesoBaseKg - input.kgAPerder,
      },
      { onConflict: 'profile_id,ano' },
    )
    .select()
    .single()
  if (error) throw error
  return data
}
