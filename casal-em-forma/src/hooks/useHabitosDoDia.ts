import { useCallback, useEffect, useState } from 'react'
import { listarHabitos } from '../services/habits'
import { listarLogsNoPeriodo, marcarHabito, desmarcarHabito } from '../services/habitLogs'
import { habitosDoDia, type HabitoParaPontos } from '../domain/pontos'
import { useRecarregarQuandoMudar } from './useRealtimeInvalidation'
import type { Habit } from '../types'

function paraDominio(h: Habit): HabitoParaPontos {
  return { id: h.id, diasSemana: h.dias_semana, criadoEm: h.criado_em, arquivadoEm: h.arquivado_em }
}

/** Hábitos programados e ativos para uma data, com o estado de marcação daquele dia. */
export function useHabitosDoDia(profileId: string | undefined, dataISO: string) {
  const [habitos, setHabitos] = useState<Habit[]>([])
  const [marcados, setMarcados] = useState<Set<string>>(new Set())
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    if (!profileId) return
    setCarregando(true)
    const [todosHabitos, logs] = await Promise.all([
      listarHabitos(profileId),
      listarLogsNoPeriodo(profileId, dataISO, dataISO),
    ])
    const idsDoDia = new Set(habitosDoDia(todosHabitos.map(paraDominio), dataISO).map((h) => h.id))
    setHabitos(todosHabitos.filter((h) => idsDoDia.has(h.id)))
    setMarcados(new Set(logs.map((l) => l.habit_id)))
    setCarregando(false)
  }, [profileId, dataISO])

  useEffect(() => {
    carregar()
  }, [carregar])

  useRecarregarQuandoMudar(['habit_logs'], carregar)

  async function alternar(habito: Habit) {
    if (!profileId) return
    const estavaMarcado = marcados.has(habito.id)
    setMarcados((atual) => {
      const novo = new Set(atual)
      if (estavaMarcado) novo.delete(habito.id)
      else novo.add(habito.id)
      return novo
    })
    try {
      if (estavaMarcado) await desmarcarHabito(habito.id, dataISO)
      else await marcarHabito(habito.id, profileId, dataISO)
    } catch (erro) {
      setMarcados((atual) => {
        const novo = new Set(atual)
        if (estavaMarcado) novo.add(habito.id)
        else novo.delete(habito.id)
        return novo
      })
      throw erro
    }
  }

  return { habitos, marcados, carregando, alternar, recarregar: carregar }
}
