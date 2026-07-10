import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { Account, AppState, Box, Card, Mov, Settings, Tag } from './types'

const STORAGE_KEY = 'grana-gustavo-v1'

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

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as AppState
    if (!parsed || !Array.isArray(parsed.movs)) return defaultState()
    return migrate({ ...defaultState(), ...parsed, settings: { ...defaultState().settings, ...parsed.settings } })
  } catch {
    return defaultState()
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

const StoreCtx = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // storage cheio/indisponível: seguimos em memória
    }
  }, [state])
  const value = useMemo(() => ({ state, dispatch }), [state])
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
    return migrate({ ...defaultState(), ...parsed })
  } catch {
    return null
  }
}
