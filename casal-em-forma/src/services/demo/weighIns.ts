import { novoId, obterBanco, notificar } from './store'
import type { WeighIn } from '../../types'

export async function listarPesagens(profileId: string): Promise<WeighIn[]> {
  return obterBanco()
    .weigh_ins.filter((p) => p.profile_id === profileId)
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((p) => ({ ...p }))
}

export async function registrarPesagem(input: {
  profileId: string
  data: string
  pesoKg: number
  observacao?: string
}): Promise<WeighIn> {
  const banco = obterBanco()
  const existente = banco.weigh_ins.find(
    (p) => p.profile_id === input.profileId && p.data === input.data,
  )
  if (existente) {
    existente.peso_kg = input.pesoKg
    existente.observacao = input.observacao ?? null
    notificar('weigh_ins')
    return { ...existente }
  }
  const pesagem: WeighIn = {
    id: novoId(),
    profile_id: input.profileId,
    data: input.data,
    peso_kg: input.pesoKg,
    observacao: input.observacao ?? null,
  }
  banco.weigh_ins.push(pesagem)
  notificar('weigh_ins')
  return { ...pesagem }
}

export async function editarPesagem(
  id: string,
  input: { pesoKg?: number; data?: string; observacao?: string | null },
): Promise<void> {
  const pesagem = obterBanco().weigh_ins.find((p) => p.id === id)
  if (!pesagem) return
  if (input.pesoKg !== undefined) pesagem.peso_kg = input.pesoKg
  if (input.data !== undefined) pesagem.data = input.data
  if (input.observacao !== undefined) pesagem.observacao = input.observacao
  notificar('weigh_ins')
}

export async function excluirPesagem(id: string): Promise<void> {
  const banco = obterBanco()
  banco.weigh_ins = banco.weigh_ins.filter((p) => p.id !== id)
  notificar('weigh_ins')
}
