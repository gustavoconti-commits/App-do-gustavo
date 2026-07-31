import { supabase } from './supabase'
import type { Settings } from '../types'

export async function buscarSettings(): Promise<Settings> {
  const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single()
  if (error) throw error
  return data
}

export async function atualizarSettings(campos: Partial<Omit<Settings, 'id'>>): Promise<void> {
  const { error } = await supabase.from('settings').update(campos).eq('id', 1)
  if (error) throw error
}
