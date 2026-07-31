import { novoId, obterBanco, salvar } from './store'
import type { Habit } from '../../types'

export async function listarHabitos(profileId: string): Promise<Habit[]> {
  return obterBanco()
    .habits.filter((h) => h.profile_id === profileId)
    .sort((a, b) => a.ordem - b.ordem)
    .map((h) => ({ ...h }))
}

export async function criarHabito(input: {
  profileId: string
  nome: string
  diasSemana: number[]
  ordem: number
}): Promise<Habit> {
  const banco = obterBanco()
  const ativos = banco.habits.filter(
    (h) => h.profile_id === input.profileId && !h.arquivado_em,
  ).length
  if (ativos >= banco.settings.limite_habitos_ativos) {
    throw new Error(
      `Limite de ${banco.settings.limite_habitos_ativos} hábitos ativos atingido. Arquive um antes de criar outro.`,
    )
  }
  const habito: Habit = {
    id: novoId(),
    profile_id: input.profileId,
    nome: input.nome,
    dias_semana: input.diasSemana,
    pontos: 1,
    ordem: input.ordem,
    arquivado_em: null,
    criado_em: new Date().toISOString(),
  }
  banco.habits.push(habito)
  salvar()
  return { ...habito }
}

export async function renomearHabito(id: string, nome: string): Promise<void> {
  const habito = obterBanco().habits.find((h) => h.id === id)
  if (habito) {
    habito.nome = nome
    salvar()
  }
}

export async function definirDiasHabito(id: string, diasSemana: number[]): Promise<void> {
  const habito = obterBanco().habits.find((h) => h.id === id)
  if (habito) {
    habito.dias_semana = diasSemana
    salvar()
  }
}

export async function reordenarHabito(id: string, ordem: number): Promise<void> {
  const habito = obterBanco().habits.find((h) => h.id === id)
  if (habito) {
    habito.ordem = ordem
    salvar()
  }
}

export async function arquivarHabito(id: string): Promise<void> {
  const habito = obterBanco().habits.find((h) => h.id === id)
  if (habito) {
    habito.arquivado_em = new Date().toISOString()
    salvar()
  }
}
