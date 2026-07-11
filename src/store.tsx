import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { Account, AppState, Box, Card, Mov, Settings, Tag } from './types'
import { Envelope, fetchRemote, pushRemote, SyncStatus } from './cloud'

// Dados antigos da versão sem login (guardados só no aparelho)
const LEGACY_KEY = 'grana-gustavo-v1'

const storageKeyFor = (userId: string) => `grana:v2:${userId}`

export function mkId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function defaultState(): AppState {
  // Sem tags nem caixinhas de exemplo: cada usuário cria as suas,
  // com os nomes, valores e prazos que quiser.
  return {
    version: 2,
    accounts: [{ id: mkId(), name: 'Conta principal', color: '#0B3A2A', initialBalance: 0 }],
    cards: [],
    tags: [],
    boxes: [],
    movs: [],
    settings: { savingsGoalPct: 10 },
  }
}

// Migração v1 → v2: o tipo "economia" foi unificado com "investimento"
// (aporte em caixinha).
function migrate(state: AppState): AppState {
  const movs = state.movs.map((m) =>
    (m.type as string) === 'economia' ? { ...m, type: 'investimento' as const, direction: m.direction ?? ('aporte' as const) } : m
  )
  return { ...state, movs, version: 2 }
}

function sanitize(parsed: AppState): AppState {
  return migrate({ ...defaultState(), ...parsed, settings: { ...defaultState().settings, ...parsed.settings } })
}

function readEnvelope(key: string): Envelope | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !parsed.state || !Array.isArray(parsed.state.movs)) return null
    return { state: sanitize(parsed.state), savedAt: Number(parsed.savedAt) || 0 }
  } catch {
    return null
  }
}

function readLegacy(): AppState | null {
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AppState
    if (!parsed || !Array.isArray(parsed.movs)) return null
    return sanitize(parsed)
  } catch {
    return null
  }
}

function writeEnvelope(key: string, env: Envelope) {
  try {
    localStorage.setItem(key, JSON.stringify(env))
  } catch {
    // storage cheio/indisponível: seguimos em memória e na nuvem
  }
}

export type Action =
  | { type: 'addMovs'; movs: Mov[] }
  | { type: 'updateMov'; mov: Mov }
  | { type: 'deleteMov'; id: string }
  | { type: 'deleteSeries'; seriesId: string; fromDate?: string } // fromDate: apaga desta data em diante
  | { type: 'updateSeriesFuture'; seriesId: string; fromDate: string; patch: Partial<Mov> }
  | { type: 'toggleDone'; id: string }
  | { type: 'upsertAccount'; account: Account }
  | { type: 'deleteAccount'; id: string }
  | { type: 'upsertCard'; card: Card }
  | { type: 'deleteCard'; id: string }
  | { type: 'upsertTag'; tag: Tag }
  | { type: 'deleteTag'; id: string }
  | { type: 'upsertBox'; box: Box }
  | { type: 'deleteBox'; id: string }
  | { type: 'setSettings'; settings: Partial<Settings> }
  | { type: 'importState'; state: AppState }
  | { type: 'reset' }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'addMovs':
      return { ...state, movs: [...state.movs, ...action.movs] }
    case 'updateMov':
      return { ...state, movs: state.movs.map((m) => (m.id === action.mov.id ? action.mov : m)) }
    case 'deleteMov':
      return { ...state, movs: state.movs.filter((m) => m.id !== action.id) }
    case 'deleteSeries':
      return {
        ...state,
        movs: state.movs.filter(
          (m) => m.seriesId !== action.seriesId || (action.fromDate ? m.date < action.fromDate : false)
        ),
      }
    case 'updateSeriesFuture':
      return {
        ...state,
        movs: state.movs.map((m) =>
          m.seriesId === action.seriesId && m.date >= action.fromDate ? { ...m, ...action.patch, id: m.id, date: m.date } : m
        ),
      }
    case 'toggleDone':
      return { ...state, movs: state.movs.map((m) => (m.id === action.id ? { ...m, done: !m.done } : m)) }
    case 'upsertAccount': {
      const exists = state.accounts.some((a) => a.id === action.account.id)
      return {
        ...state,
        accounts: exists
          ? state.accounts.map((a) => (a.id === action.account.id ? action.account : a))
          : [...state.accounts, action.account],
      }
    }
    case 'deleteAccount':
      return {
        ...state,
        accounts: state.accounts.filter((a) => a.id !== action.id),
        movs: state.movs.map((m) => (m.accountId === action.id ? { ...m, accountId: undefined } : m)),
      }
    case 'upsertCard': {
      const exists = state.cards.some((c) => c.id === action.card.id)
      return {
        ...state,
        cards: exists ? state.cards.map((c) => (c.id === action.card.id ? action.card : c)) : [...state.cards, action.card],
      }
    }
    case 'deleteCard':
      return {
        ...state,
        cards: state.cards.filter((c) => c.id !== action.id),
        movs: state.movs.map((m) => (m.cardId === action.id ? { ...m, cardId: undefined } : m)),
      }
    case 'upsertTag': {
      const exists = state.tags.some((t) => t.id === action.tag.id)
      return {
        ...state,
        tags: exists ? state.tags.map((t) => (t.id === action.tag.id ? action.tag : t)) : [...state.tags, action.tag],
      }
    }
    case 'deleteTag':
      return {
        ...state,
        tags: state.tags.filter((t) => t.id !== action.id),
        movs: state.movs.map((m) => ({ ...m, tagIds: m.tagIds.filter((id) => id !== action.id) })),
      }
    case 'upsertBox': {
      const exists = state.boxes.some((b) => b.id === action.box.id)
      return {
        ...state,
        boxes: exists ? state.boxes.map((b) => (b.id === action.box.id ? action.box : b)) : [...state.boxes, action.box],
      }
    }
    case 'deleteBox':
      return {
        ...state,
        boxes: state.boxes.filter((b) => b.id !== action.id),
        movs: state.movs.filter((m) => m.boxId !== action.id),
      }
    case 'setSettings':
      return { ...state, settings: { ...state.settings, ...action.settings } }
    case 'importState':
      return action.state
    case 'reset':
      return defaultState()
  }
}

interface StoreCtxValue {
  state: AppState
  dispatch: React.Dispatch<Action>
  sync: SyncStatus
  lastSyncAt: number | null
}

const StoreCtx = createContext<StoreCtxValue | null>(null)

const PUSH_DEBOUNCE_MS = 1500
const RETRY_INTERVAL_MS = 30000

export function StoreProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  const storageKey = storageKeyFor(userId)
  const [state, dispatch] = useReducer(
    reducer,
    storageKey,
    (key) => readEnvelope(key)?.state ?? defaultState()
  )
  const [sync, setSync] = useState<SyncStatus>('salvando')
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null)

  const stateRef = useRef(state)
  stateRef.current = state
  const savedAtRef = useRef(readEnvelope(storageKey)?.savedAt ?? 0) // versão local atual
  const syncedAtRef = useRef(0) // última versão confirmada na nuvem
  const pushTimer = useRef<number | undefined>(undefined)
  const booted = useRef(false)

  async function doPush() {
    const env: Envelope = { state: stateRef.current, savedAt: savedAtRef.current }
    try {
      setSync('salvando')
      await pushRemote(userId, env)
      syncedAtRef.current = env.savedAt
      setSync('sincronizado')
      setLastSyncAt(Date.now())
    } catch {
      setSync(typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'erro')
    }
  }

  function schedulePush() {
    window.clearTimeout(pushTimer.current)
    pushTimer.current = window.setTimeout(doPush, PUSH_DEBOUNCE_MS)
  }

  // Carga inicial: compara nuvem × aparelho e fica com o mais novo.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const remote = await fetchRemote(userId)
        if (cancelled) return
        const local = readEnvelope(storageKey)
        if (remote && remote.savedAt > (local?.savedAt ?? 0)) {
          savedAtRef.current = remote.savedAt
          syncedAtRef.current = remote.savedAt
          writeEnvelope(storageKey, { state: sanitize(remote.state), savedAt: remote.savedAt })
          dispatch({ type: 'importState', state: sanitize(remote.state) })
          setSync('sincronizado')
          setLastSyncAt(Date.now())
          return
        }
        if (!remote && !local) {
          // primeira vez desta conta: se houver dados da versão antiga
          // (sem login) neste aparelho, eles passam a ser da conta.
          const legacy = readLegacy()
          if (legacy) {
            savedAtRef.current = Date.now()
            writeEnvelope(storageKey, { state: legacy, savedAt: savedAtRef.current })
            dispatch({ type: 'importState', state: legacy })
          }
        }
        // aparelho é a versão mais nova (ou a única): sobe para a nuvem
        if (savedAtRef.current === 0) savedAtRef.current = Date.now()
        await doPush()
      } catch {
        if (!cancelled) setSync(typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'erro')
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // Toda mudança de estado: grava no aparelho e agenda envio para a nuvem.
  useEffect(() => {
    if (!booted.current) {
      booted.current = true
      return
    }
    savedAtRef.current = Date.now()
    writeEnvelope(storageKey, { state, savedAt: savedAtRef.current })
    schedulePush()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  // Reenvia pendências ao voltar a conexão e periodicamente; ao voltar o foco,
  // busca se outro aparelho salvou uma versão mais nova.
  useEffect(() => {
    const flushIfDirty = () => {
      if (syncedAtRef.current < savedAtRef.current) schedulePush()
    }
    const onFocus = async () => {
      flushIfDirty()
      try {
        const remote = await fetchRemote(userId)
        if (remote && remote.savedAt > savedAtRef.current) {
          savedAtRef.current = remote.savedAt
          syncedAtRef.current = remote.savedAt
          writeEnvelope(storageKey, { state: sanitize(remote.state), savedAt: remote.savedAt })
          dispatch({ type: 'importState', state: sanitize(remote.state) })
          setSync('sincronizado')
          setLastSyncAt(Date.now())
        }
      } catch {
        // sem conexão: fica como está
      }
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') onFocus()
    }
    window.addEventListener('online', flushIfDirty)
    document.addEventListener('visibilitychange', onVisible)
    const interval = window.setInterval(flushIfDirty, RETRY_INTERVAL_MS)
    return () => {
      window.removeEventListener('online', flushIfDirty)
      document.removeEventListener('visibilitychange', onVisible)
      window.clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const value = useMemo(() => ({ state, dispatch, sync, lastSyncAt }), [state, sync, lastSyncAt])
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}

export function useStore() {
  const ctx = useContext(StoreCtx)
  if (!ctx) throw new Error('useStore fora do StoreProvider')
  return ctx
}

export function exportJSON(state: AppState): string {
  return JSON.stringify(state, null, 2)
}

export function parseImport(raw: string): AppState | null {
  try {
    const parsed = JSON.parse(raw) as AppState
    if (!parsed || !Array.isArray(parsed.movs) || !Array.isArray(parsed.accounts)) return null
    return sanitize(parsed)
  } catch {
    return null
  }
}
