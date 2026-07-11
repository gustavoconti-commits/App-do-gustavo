import { createClient } from '@supabase/supabase-js'
import { SUPABASE_KEY, SUPABASE_URL } from './config'
import { AppState } from './types'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// Envelope gravado na nuvem e no aparelho: o estado + quando foi salvo,
// para decidir qual versão é a mais nova ao abrir o app.
export interface Envelope {
  state: AppState
  savedAt: number // epoch ms
}

export async function fetchRemote(userId: string): Promise<Envelope | null> {
  const { data, error } = await supabase
    .from('user_state')
    .select('state, saved_at')
    .eq('user_id', userId)
    .limit(1)
  if (error) throw error
  const row = data?.[0]
  if (!row) return null
  return { state: row.state as AppState, savedAt: Number(row.saved_at) }
}

export async function pushRemote(userId: string, env: Envelope): Promise<void> {
  const { error } = await supabase.from('user_state').upsert(
    {
      user_id: userId,
      state: env.state,
      saved_at: env.savedAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )
  if (error) throw error
}

export type SyncStatus = 'sincronizado' | 'salvando' | 'offline' | 'erro' | 'local'
