import { supabase } from './supabase'

// Tabelas da seção 10 do documento, mais piggy_withdrawals: um saque de
// cofrinho registrado num celular também precisa aparecer no outro.
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

/** Assina um canal único de Realtime cobrindo todas as tabelas sincronizadas.
 *  Devolve a função de cancelamento. */
export function assinarMudancas(
  aoMudar: (tabela: TabelaSincronizada) => void,
  aoMudarEstadoCanal?: (conectado: boolean) => void,
): () => void {
  let canal = supabase.channel('sincronizacao-casal')
  for (const tabela of TABELAS_SINCRONIZADAS) {
    canal = canal.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: tabela },
      () => aoMudar(tabela),
    )
  }
  canal.subscribe((status) => {
    aoMudarEstadoCanal?.(status === 'SUBSCRIBED')
  })
  return () => {
    supabase.removeChannel(canal)
  }
}
