import { useCallback, useEffect, useState } from 'react'
import { getISODay } from 'date-fns'
import { listarHabitos } from '../services/habits'
import { listarLogsNoPeriodo, marcarHabito, desmarcarHabito } from '../services/habitLogs'
import type { Habit } from '../types'

function habitoProgramadoNoDia(habito: Habit, dataISO: string): boolean {
  const diaSemana = getISODay(new Date(`${dataISO}T12:00:00`))
  return habito.dias_semana.includes(diaSemana)
}

function habitoAtivoNaData(habito: Habit, dataISO: string): boolean {
  if (!habito.arquivado_em) return true
  return dataISO < habito.arquivado_em.slice(0, 10)
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
    setHabitos(
      todosHabitos.filter(
        (h) => habitoAtivoNaData(h, dataISO) && habitoProgramadoNoDia(h, dataISO),
      ),
    )
    setMarcados(new Set(logs.map((l) => l.habit_id)))
    setCarregando(false)
  }, [profileId, dataISO])

  useEffect(() => {
    carregar()
  }, [carregar])

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
