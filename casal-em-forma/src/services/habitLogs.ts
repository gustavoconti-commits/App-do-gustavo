import { supabase } from './supabase'
import type { HabitLog } from '../types'

export async function listarLogsNoPeriodo(
  profileId: string,
  dataInicio: string,
  dataFim: string,
): Promise<HabitLog[]> {
  const { data, error } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('profile_id', profileId)
    .gte('data', dataInicio)
    .lte('data', dataFim)
  if (error) throw error
  return data
}

export async function marcarHabito(habitId: string, profileId: string, data: string): Promise<void> {
  const { error } = await supabase
    .from('habit_logs')
    .insert({ habit_id: habitId, profile_id: profileId, data })
  if (error) throw error
}

export async function desmarcarHabito(habitId: string, data: string): Promise<void> {
  const { error } = await supabase
    .from('habit_logs')
    .delete()
    .eq('habit_id', habitId)
    .eq('data', data)
  if (error) throw error
}
