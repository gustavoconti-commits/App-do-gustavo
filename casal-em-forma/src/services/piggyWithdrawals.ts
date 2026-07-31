import { supabase } from './supabase'
import type { PiggyWithdrawal } from '../types'

export async function listarSaques(): Promise<PiggyWithdrawal[]> {
  const { data, error } = await supabase
    .from('piggy_withdrawals')
    .select('*')
    .order('data', { ascending: false })
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data
}

/** Sacar do cofrinho não mexe no saldo de pontos (seção 6.3) — só entra na
 *  subtração de calcularCofrinho. */
export async function registrarSaque(input: {
  profileId: string
  valorReais: number
  descricao?: string
  data: string
}): Promise<PiggyWithdrawal> {
  const { data, error } = await supabase
    .from('piggy_withdrawals')
    .insert({
      profile_id: input.profileId,
      valor_reais: input.valorReais,
      descricao: input.descricao ?? null,
      data: input.data,
    })
    .select()
    .single()
  if (error) throw error
  return data
}
