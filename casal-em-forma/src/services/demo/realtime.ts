// Dublê do Realtime: o barramento do store local notifica as mudanças.
import { aoMudarTabela } from './store'

export const TABELAS_SINCRONIZADAS = [
  'habit_logs',
  'weigh_ins',
  'ledger',
  'redemptions',
  'transfers',
  'monthly_closings',
  'annual_goals',
  'piggy_withdrawals',
] as const

export type TabelaSincronizada = (typeof TABELAS_SINCRONIZADAS)[number]

export function assinarMudancas(
  aoMudar: (tabela: TabelaSincronizada) => void,
  aoMudarEstadoCanal?: (conectado: boolean) => void,
): () => void {
  aoMudarEstadoCanal?.(true)
  return aoMudarTabela(aoMudar)
}
