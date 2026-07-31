import { supabase } from './supabase'
import type { LedgerEntry, LedgerTipo } from '../types'

export async function listarLancamentos(profileId: string): Promise<LedgerEntry[]> {
  const { data, error } = await supabase
    .from('ledger')
    .select('*')
    .eq('profile_id', profileId)
    .order('data', { ascending: false })
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data
}

export async function inserirLancamento(input: {
  profileId: string
  data: string
  tipo: LedgerTipo
  pontos: number
  contaParaTotalGanho: boolean
  referenciaId?: string
  descricao: string
}): Promise<LedgerEntry> {
  const { data, error } = await supabase
    .from('ledger')
    .insert({
      profile_id: input.profileId,
      data: input.data,
      tipo: input.tipo,
      pontos: input.pontos,
      conta_para_total_ganho: input.contaParaTotalGanho,
      referencia_id: input.referenciaId ?? null,
      descricao: input.descricao,
    })
    .select()
    .single()
  if (error) throw error
  return data
}
