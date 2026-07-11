import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './cloud'
import { DEMO_FLAG_KEY, DEMO_USER_ID, StoreProvider } from './store'
import { AuthView, NewPasswordForm } from './views/Auth'
import { ComprarView } from './views/Comprar'
import { FluxFilter, SaldosView } from './views/Saldos'
import { DayView } from './views/Day'
import { TotaisView } from './views/Totais'
import { DashboardView } from './views/Dashboard'
import { DiarioView } from './views/Diario'
import { TagsView } from './views/Tags'
import { InvestView } from './views/Invest'
import { MenuView } from './views/Menu'
import { AddMovModal } from './views/AddMov'
import { Toast, useToast } from './components/ui'
import { ApiceSymbol, Wordmark } from './components/Brand'
import { parseISO, todayISO } from './dates'

export type Tab = 'saldos' | 'totais' | 'dash' | 'invest' | 'diario' | 'tags' | 'menu'

const NAV: { tab: Tab; label: string; icon: string }[] = [
  { tab: 'saldos', label: 'saldos', icon: '▦' },
  { tab: 'totais', label: 'totais', icon: '∑' },
  { tab: 'dash', label: 'dashboard', icon: '◔' },
  { tab: 'invest', label: 'investir', icon: '⬆' },
  { tab: 'diario', label: 'diário', icon: '◎' },
  { tab: 'tags', label: 'tags', icon: '⬚' },
  { tab: 'menu', label: 'menu', icon: '☰' },
]

// No celular a barra inferior mostra 4 abas + o botão de adicionar;
// investir, diário e tags ficam como atalhos dentro do menu.
const MOBILE_NAV: Tab[] = ['saldos', 'totais', 'dash', 'menu']

const SessionCtx = createContext<Session | null>(null)
export function useSession() {
  return useContext(SessionCtx)
}

// Roteamento simples por hash: o app não tem servidor de rotas (GitHub Pages
// serve só o index.html), então a página de vendas vive em "#comprar".
function useHash() {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const onChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return hash
}

export default function App() {
  const hash = useHash()
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  const [recovery, setRecovery] = useState(false)
  const [demo, setDemo] = useState(() => {
    try {
      return localStorage.getItem(DEMO_FLAG_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      setReady(true)
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  if (hash === '#comprar') return <ComprarView />

  if (!ready) {
    return (
      <div className="lock-screen">
        <div className="lock-card">
          <ApiceSymbol width={64} />
          <Wordmark size={28} />
          <p className="lock-sub">carregando…</p>
        </div>
      </div>
    )
  }

  if (!session && demo) {
    // modo demonstração: app completo, dados só neste aparelho
    return (
      <SessionCtx.Provider value={null}>
        <StoreProvider userId={DEMO_USER_ID} local>
          <Shell />
        </StoreProvider>
      </SessionCtx.Provider>
    )
  }

  if (!session)
    return (
      <AuthView
        onDemo={() => {
          try {
            localStorage.setItem(DEMO_FLAG_KEY, '1')
          } catch {
            // segue em memória
          }
          setDemo(true)
        }}
      />
    )
  if (recovery) return <NewPasswordForm onDone={() => setRecovery(false)} />

  return (
    <SessionCtx.Provider value={session}>
      <StoreProvider userId={session.user.id}>
        <Shell />
      </StoreProvider>
    </SessionCtx.Provider>
  )
}

function Shell() {
  const session = useSession()
  const t = parseISO(todayISO())
  const [tab, setTab] = useState<Tab>('saldos')
  const [year, setYear] = useState(t.y)
  const [month, setMonth] = useState(t.m)
  const [openDay, setOpenDay] = useState<string | null>(null)
  const [fluxFilter, setFluxFilter] = useState<FluxFilter>('')
  const [adding, setAdding] = useState(false)
  const [toast, showToast] = useToast()

  const nav = (y: number, m: number) => {
    setYear(y)
    setMonth(m)
  }

  const goTab = (t2: Tab) => {
    setTab(t2)
    setOpenDay(null)
  }

  const goSaldos = (filter: FluxFilter = '') => {
    setFluxFilter(filter)
    goTab('saldos')
  }

  const mobileNav = NAV.filter((n) => MOBILE_NAV.includes(n.tab))

  return (
    <div className="app">
      <aside className="sidenav">
        <div className="brand">
          <ApiceSymbol width={34} />
          <Wordmark size={19} />
        </div>
        {NAV.map((n) => (
          <button
            key={n.tab}
            className={`sidenav-item${tab === n.tab && !openDay ? ' active' : ''}`}
            onClick={() => goTab(n.tab)}
          >
            <span className="nav-ico">{n.icon}</span> {n.label}
          </button>
        ))}
        <button className="fab side" onClick={() => setAdding(true)}>
          ＋ nova movimentação
        </button>
        {session && (
          <button className="sidenav-item logout" onClick={() => supabase.auth.signOut()}>
            <span className="nav-ico">⎋</span> sair da conta
          </button>
        )}
      </aside>

      <main className="content">
        {openDay ? (
          <DayView
            date={openDay}
            onChangeDate={setOpenDay}
            onBack={() => {
              const d = parseISO(openDay)
              nav(d.y, d.m)
              setOpenDay(null)
            }}
            onToast={showToast}
          />
        ) : (
          <>
            {tab === 'saldos' && (
              <SaldosView
                year={year}
                month={month}
                filter={fluxFilter}
                onFilter={setFluxFilter}
                onNav={nav}
                onOpenDay={setOpenDay}
              />
            )}
            {tab === 'totais' && (
              <TotaisView
                year={year}
                month={month}
                onNav={nav}
                onGoSaldos={goSaldos}
                onGoInvest={() => goTab('invest')}
                onGoDiario={() => goTab('diario')}
              />
            )}
            {tab === 'dash' && <DashboardView year={year} month={month} onNav={nav} />}
            {tab === 'invest' && <InvestView onToast={showToast} />}
            {tab === 'diario' && <DiarioView year={year} month={month} onNav={nav} onToast={showToast} />}
            {tab === 'tags' && <TagsView year={year} month={month} onNav={nav} onToast={showToast} />}
            {tab === 'menu' && <MenuView onToast={showToast} onGoTab={goTab} />}
          </>
        )}
      </main>

      <nav className="bottomnav">
        {mobileNav.slice(0, 2).map((n) => (
          <NavBtn key={n.tab} n={n} cur={tab} openDay={openDay} onPick={goTab} />
        ))}
        <button className="fab" onClick={() => setAdding(true)} aria-label="nova movimentação">
          ＋
        </button>
        {mobileNav.slice(2).map((n) => (
          <NavBtn key={n.tab} n={n} cur={tab} openDay={openDay} onPick={goTab} />
        ))}
      </nav>

      {adding && <AddMovModal onClose={() => setAdding(false)} onSaved={showToast} />}
      {toast && <Toast msg={toast} />}
    </div>
  )
}

function NavBtn({
  n,
  cur,
  openDay,
  onPick,
}: {
  n: { tab: Tab; label: string; icon: string }
  cur: Tab
  openDay: string | null
  onPick: (t: Tab) => void
}) {
  const active = cur === n.tab && !openDay
  return (
    <button className={`bottomnav-item${active ? ' active' : ''}`} onClick={() => onPick(n.tab)}>
      <span className="nav-ico">{n.icon}</span>
      <span className="nav-lbl">{n.label}</span>
    </button>
  )
}
