import { supabase } from './supabase'
import { inserirLancamento } from './ledger'
import type { Transfer } from '../types'

export async function listarTransferencias(): Promise<Transfer[]> {
  const { data, error } = await supabase
    .from('transfers')
    .select('*')
    .order('data', { ascending: false })
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data
}

/** Grava 1 linha em transfers + 2 no ledger (seção 6.4). Os dois lançamentos
 *  entram com conta_para_total_ganho = false: transferência é movimentação
 *  interna e nunca alimenta o cofrinho. O cálculo do pedágio e a validação de
 *  saldo acontecem antes, em domain/pontos.ts (calcularTransferencia). */
export async function registrarTransferencia(input: {
  deProfileId: string
  paraProfileId: string
  nomeDe: string
  nomePara: string
  pontosEnviados: number
  pontosRecebidos: number
  data: string
}): Promise<Transfer> {
  const { data, error } = await supabase
    .from('transfers')
    .insert({
      de_profile_id: input.deProfileId,
      para_profile_id: input.paraProfileId,
      pontos_enviados: input.pontosEnviados,
      pontos_recebidos: input.pontosRecebidos,
      data: input.data,
    })
    .select()
    .single()
  if (error) throw error

  await inserirLancamento({
    profileId: input.deProfileId,
    data: input.data,
    tipo: 'transferencia_envio',
    pontos: -input.pontosEnviados,
    contaParaTotalGanho: false,
    referenciaId: data.id,
    descricao: `Transferência para ${input.nomePara}`,
  })
  await inserirLancamento({
    profileId: input.paraProfileId,
    data: input.data,
    tipo: 'transferencia_recebimento',
    pontos: input.pontosRecebidos,
    contaParaTotalGanho: false,
    referenciaId: data.id,
    descricao: `Transferência de ${input.nomeDe}`,
  })

  return data
}
