import { novoId, obterBanco, notificar } from './store'
import type { AnnualGoal } from '../../types'

export async function buscarMetaAnual(
  profileId: string,
  ano: number,
): Promise<AnnualGoal | null> {
  const meta = obterBanco().annual_goals.find(
    (m) => m.profile_id === profileId && m.ano === ano,
  )
  return meta ? { ...meta } : null
}

export async function listarMetasAnuais(profileId: string): Promise<AnnualGoal[]> {
  return obterBanco()
    .annual_goals.filter((m) => m.profile_id === profileId)
    .sort((a, b) => b.ano - a.ano)
    .map((m) => ({ ...m }))
}

export async function definirMetaAnual(input: {
  profileId: string
  ano: number
  pesoBaseKg: number
  kgAPerder: number
}): Promise<AnnualGoal> {
  const banco = obterBanco()
  const existente = banco.annual_goals.find(
    (m) => m.profile_id === input.profileId && m.ano === input.ano,
  )
  if (existente) {
    existente.peso_base_kg = input.pesoBaseKg
    existente.kg_a_perder = input.kgAPerder
    existente.peso_alvo_kg = input.pesoBaseKg - input.kgAPerder
    notificar('annual_goals')
    return { ...existente }
  }
  const meta: AnnualGoal = {
    id: novoId(),
    profile_id: input.profileId,
    ano: input.ano,
    data_criacao: new Date().toISOString().slice(0, 10),
    peso_base_kg: input.pesoBaseKg,
    kg_a_perder: input.kgAPerder,
    peso_alvo_kg: input.pesoBaseKg - input.kgAPerder,
    criado_em: new Date().toISOString(),
  }
  banco.annual_goals.push(meta)
  notificar('annual_goals')
  return { ...meta }
}
