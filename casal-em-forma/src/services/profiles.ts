import { supabase } from './supabase'
import type { Profile } from '../types'

export async function listarPerfis(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('criado_em')
  if (error) throw error
  return data
}

export async function atualizarAlturaPerfil(id: string, alturaCm: number | null): Promise<void> {
  const { error } = await supabase.from('profiles').update({ altura_cm: alturaCm }).eq('id', id)
  if (error) throw error
}
