import { supabase } from './supabase'
import type { WeighIn } from '../types'

export async function listarPesagens(profileId: string): Promise<WeighIn[]> {
  const { data, error } = await supabase
    .from('weigh_ins')
    .select('*')
    .eq('profile_id', profileId)
    .order('data', { ascending: true })
  if (error) throw error
  return data
}

export async function registrarPesagem(input: {
  profileId: string
  data: string
  pesoKg: number
  observacao?: string
}): Promise<WeighIn> {
  const { data, error } = await supabase
    .from('weigh_ins')
    .upsert(
      {
        profile_id: input.profileId,
        data: input.data,
        peso_kg: input.pesoKg,
        observacao: input.observacao ?? null,
      },
      { onConflict: 'profile_id,data' },
    )
    .select()
    .single()
  if (error) throw error
  return data
}

export async function editarPesagem(
  id: string,
  input: { pesoKg?: number; data?: string; observacao?: string | null },
): Promise<void> {
  const { error } = await supabase
    .from('weigh_ins')
    .update({
      ...(input.pesoKg !== undefined ? { peso_kg: input.pesoKg } : {}),
      ...(input.data !== undefined ? { data: input.data } : {}),
      ...(input.observacao !== undefined ? { observacao: input.observacao } : {}),
    })
    .eq('id', id)
  if (error) throw error
}

export async function excluirPesagem(id: string): Promise<void> {
  const { error } = await supabase.from('weigh_ins').delete().eq('id', id)
  if (error) throw error
}
