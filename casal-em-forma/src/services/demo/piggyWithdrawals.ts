import { novoId, obterBanco, notificar } from './store'
import type { PiggyWithdrawal } from '../../types'

export async function listarSaques(): Promise<PiggyWithdrawal[]> {
  return [...obterBanco().piggy_withdrawals]
    .sort((a, b) => b.data.localeCompare(a.data) || b.criado_em.localeCompare(a.criado_em))
    .map((s) => ({ ...s }))
}

export async function registrarSaque(input: {
  profileId: string
  valorReais: number
  descricao?: string
  data: string
}): Promise<PiggyWithdrawal> {
  const saque: PiggyWithdrawal = {
    id: novoId(),
    profile_id: input.profileId,
    data: input.data,
    valor_reais: input.valorReais,
    descricao: input.descricao ?? null,
    criado_em: new Date().toISOString(),
  }
  obterBanco().piggy_withdrawals.push(saque)
  notificar('piggy_withdrawals')
  return { ...saque }
}
