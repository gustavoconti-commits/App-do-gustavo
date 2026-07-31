import { novoId, obterBanco, notificar } from './store'
import type { LedgerEntry, LedgerTipo } from '../../types'

export async function listarLancamentos(profileId: string): Promise<LedgerEntry[]> {
  return obterBanco()
    .ledger.filter((l) => l.profile_id === profileId)
    .sort((a, b) => b.data.localeCompare(a.data) || b.criado_em.localeCompare(a.criado_em))
    .map((l) => ({ ...l }))
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
  const lancamento: LedgerEntry = {
    id: novoId(),
    profile_id: input.profileId,
    data: input.data,
    tipo: input.tipo,
    pontos: input.pontos,
    conta_para_total_ganho: input.contaParaTotalGanho,
    referencia_id: input.referenciaId ?? null,
    descricao: input.descricao,
    criado_em: new Date().toISOString(),
  }
  obterBanco().ledger.push(lancamento)
  notificar('ledger')
  return { ...lancamento }
}
