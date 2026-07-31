import { useCallback, useEffect, useState } from 'react'
import {
  listarHabitos,
  criarHabito,
  renomearHabito,
  definirDiasHabito,
  arquivarHabito,
} from '../services/habits'
import type { Habit } from '../types'

export function useGerenciarHabitos(profileId: string | undefined) {
  const [habitos, setHabitos] = useState<Habit[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    if (!profileId) return
    setCarregando(true)
    const todos = await listarHabitos(profileId)
    setHabitos(todos.filter((h) => !h.arquivado_em))
    setCarregando(false)
  }, [profileId])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function adicionar(nome: string, diasSemana: number[]) {
    if (!profileId) return
    setErro(null)
    try {
      await criarHabito({ profileId, nome, diasSemana, ordem: habitos.length })
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível criar o hábito.')
      throw e
    }
  }

  async function renomear(id: string, nome: string) {
    await renomearHabito(id, nome)
    await carregar()
  }

  async function definirDias(id: string, diasSemana: number[]) {
    await definirDiasHabito(id, diasSemana)
    await carregar()
  }

  async function arquivar(id: string) {
    await arquivarHabito(id)
    await carregar()
  }

  return { habitos, carregando, erro, adicionar, renomear, definirDias, arquivar }
}
