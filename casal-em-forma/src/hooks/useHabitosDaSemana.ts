import { useCallback, useEffect, useState } from 'react'
import { getISODay } from 'date-fns'
import { listarHabitos } from '../services/habits'
import { listarLogsNoPeriodo, marcarHabito, desmarcarHabito } from '../services/habitLogs'
import { diasDaSemana } from '../utils/data'
import type { Habit } from '../types'

function habitoAtivoNaData(habito: Habit, dataISO: string): boolean {
  const existiaJa = dataISO >= habito.criado_em.slice(0, 10)
  const aindaNaoArquivado = !habito.arquivado_em || dataISO < habito.arquivado_em.slice(0, 10)
  return existiaJa && aindaNaoArquivado
}

function habitoProgramadoNoDia(habito: Habit, dataISO: string): boolean {
  return habito.dias_semana.includes(getISODay(new Date(`${dataISO}T12:00:00`)))
}

export function habitoEditavelNaData(habito: Habit, dataISO: string): boolean {
  return habitoAtivoNaData(habito, dataISO) && habitoProgramadoNoDia(habito, dataISO)
}

/** Estado da semana inteira (segunda a domingo) para a grade do modo "Semana". */
export function useHabitosDaSemana(profileId: string | undefined, inicioSemanaISO: string) {
  const [habitos, setHabitos] = useState<Habit[]>([])
  const [marcados, setMarcados] = useState<Set<string>>(new Set())
  const [carregando, setCarregando] = useState(true)

  const dias = diasDaSemana(inicioSemanaISO)

  const carregar = useCallback(async () => {
    if (!profileId) return
    setCarregando(true)
    const [todosHabitos, logs] = await Promise.all([
      listarHabitos(profileId),
      listarLogsNoPeriodo(profileId, dias[0], dias[6]),
    ])
    setHabitos(todosHabitos.filter((h) => dias.some((d) => habitoAtivoNaData(h, d))))
    setMarcados(new Set(logs.map((l) => `${l.habit_id}|${l.data}`)))
    setCarregando(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, inicioSemanaISO])

  useEffect(() => {
    carregar()
  }, [carregar])

  function marcado(habitId: string, dataISO: string): boolean {
    return marcados.has(`${habitId}|${dataISO}`)
  }

  async function alternar(habito: Habit, dataISO: string) {
    if (!profileId) return
    const chave = `${habito.id}|${dataISO}`
    const estavaMarcado = marcados.has(chave)
    setMarcados((atual) => {
      const novo = new Set(atual)
      if (estavaMarcado) novo.delete(chave)
      else novo.add(chave)
      return novo
    })
    try {
      if (estavaMarcado) await desmarcarHabito(habito.id, dataISO)
      else await marcarHabito(habito.id, profileId, dataISO)
    } catch (erro) {
      setMarcados((atual) => {
        const novo = new Set(atual)
        if (estavaMarcado) novo.add(chave)
        else novo.delete(chave)
        return novo
      })
      throw erro
    }
  }

  return { dias, habitos, marcado, carregando, alternar, recarregar: carregar }
}
