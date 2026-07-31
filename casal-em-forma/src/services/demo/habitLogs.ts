import { novoId, obterBanco, notificar } from './store'
import type { HabitLog } from '../../types'

export async function listarLogsNoPeriodo(
  profileId: string,
  dataInicio: string,
  dataFim: string,
): Promise<HabitLog[]> {
  return obterBanco()
    .habit_logs.filter(
      (l) => l.profile_id === profileId && l.data >= dataInicio && l.data <= dataFim,
    )
    .map((l) => ({ ...l }))
}

export async function marcarHabito(
  habitId: string,
  profileId: string,
  data: string,
): Promise<void> {
  const banco = obterBanco()
  if (banco.habit_logs.some((l) => l.habit_id === habitId && l.data === data)) return
  banco.habit_logs.push({
    id: novoId(),
    habit_id: habitId,
    profile_id: profileId,
    data,
    criado_em: new Date().toISOString(),
  })
  notificar('habit_logs')
}

export async function desmarcarHabito(habitId: string, data: string): Promise<void> {
  const banco = obterBanco()
  banco.habit_logs = banco.habit_logs.filter(
    (l) => !(l.habit_id === habitId && l.data === data),
  )
  notificar('habit_logs')
}
