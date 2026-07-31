import { supabase } from './supabase'
import type { Habit } from '../types'

export async function listarHabitos(profileId: string): Promise<Habit[]> {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('profile_id', profileId)
    .order('ordem')
  if (error) throw error
  return data
}

export async function criarHabito(input: {
  profileId: string
  nome: string
  diasSemana: number[]
  ordem: number
}): Promise<Habit> {
  const { data, error } = await supabase
    .from('habits')
    .insert({
      profile_id: input.profileId,
      nome: input.nome,
      dias_semana: input.diasSemana,
      ordem: input.ordem,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function renomearHabito(id: string, nome: string): Promise<void> {
  const { error } = await supabase.from('habits').update({ nome }).eq('id', id)
  if (error) throw error
}

export async function definirDiasHabito(id: string, diasSemana: number[]): Promise<void> {
  const { error } = await supabase
    .from('habits')
    .update({ dias_semana: diasSemana })
    .eq('id', id)
  if (error) throw error
}

export async function reordenarHabito(id: string, ordem: number): Promise<void> {
  const { error } = await supabase.from('habits').update({ ordem }).eq('id', id)
  if (error) throw error
}

export async function arquivarHabito(id: string): Promise<void> {
  const { error } = await supabase
    .from('habits')
    .update({ arquivado_em: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
