import { novoId, obterBanco, notificar } from './store'
import { inserirLancamento } from './ledger'
import type { Transfer } from '../../types'

export async function listarTransferencias(): Promise<Transfer[]> {
  return [...obterBanco().transfers]
    .sort((a, b) => b.data.localeCompare(a.data) || b.criado_em.localeCompare(a.criado_em))
    .map((t) => ({ ...t }))
}

export async function registrarTransferencia(input: {
  deProfileId: string
  paraProfileId: string
  nomeDe: string
  nomePara: string
  pontosEnviados: number
  pontosRecebidos: number
  data: string
}): Promise<Transfer> {
  const transferencia: Transfer = {
    id: novoId(),
    de_profile_id: input.deProfileId,
    para_profile_id: input.paraProfileId,
    pontos_enviados: input.pontosEnviados,
    pontos_recebidos: input.pontosRecebidos,
    data: input.data,
    criado_em: new Date().toISOString(),
  }
  obterBanco().transfers.push(transferencia)
  await inserirLancamento({
    profileId: input.deProfileId,
    data: input.data,
    tipo: 'transferencia_envio',
    pontos: -input.pontosEnviados,
    contaParaTotalGanho: false,
    referenciaId: transferencia.id,
    descricao: `Transferência para ${input.nomePara}`,
  })
  await inserirLancamento({
    profileId: input.paraProfileId,
    data: input.data,
    tipo: 'transferencia_recebimento',
    pontos: input.pontosRecebidos,
    contaParaTotalGanho: false,
    referenciaId: transferencia.id,
    descricao: `Transferência de ${input.nomeDe}`,
  })
  notificar('transfers')
  return { ...transferencia }
}
