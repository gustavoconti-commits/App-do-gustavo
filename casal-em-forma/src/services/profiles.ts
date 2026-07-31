import { supabase } from './supabase'
import type { Profile } from '../types'

export async function listarPerfis(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('criado_em')
  if (error) throw error
  return data
}
