// Dublê do cliente Supabase para o modo demonstração: só o que useAuth usa.
import type { Session } from '@supabase/supabase-js'

const CHAVE_SESSAO = 'casal-em-forma-demo-logado'

function sessaoFake(): Session {
  return {
    access_token: 'demo',
    refresh_token: 'demo',
    expires_in: 3600,
    token_type: 'bearer',
    user: { id: 'demo', email: 'demo@casal-em-forma.local' },
  } as unknown as Session
}

function estaLogado(): boolean {
  try {
    return localStorage.getItem(CHAVE_SESSAO) !== 'nao'
  } catch {
    return true
  }
}

type OuvinteAuth = (evento: string, sessao: Session | null) => void
const ouvintesAuth = new Set<OuvinteAuth>()

export function definirLogado(logado: boolean): void {
  try {
    localStorage.setItem(CHAVE_SESSAO, logado ? 'sim' : 'nao')
  } catch {
    // sem localStorage: estado vive só nesta aba
  }
  const sessao = logado ? sessaoFake() : null
  ouvintesAuth.forEach((o) => o(logado ? 'SIGNED_IN' : 'SIGNED_OUT', sessao))
}

export const supabase = {
  auth: {
    async getSession() {
      return { data: { session: estaLogado() ? sessaoFake() : null }, error: null }
    },
    onAuthStateChange(cb: OuvinteAuth) {
      ouvintesAuth.add(cb)
      return {
        data: {
          subscription: {
            unsubscribe() {
              ouvintesAuth.delete(cb)
            },
          },
        },
      }
    },
    async signInWithPassword() {
      definirLogado(true)
      return { data: { session: sessaoFake() }, error: null }
    },
    async signOut() {
      definirLogado(false)
      return { error: null }
    },
  },
}
