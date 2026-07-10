import React, { useState } from 'react'
import { StoreProvider, useStore } from './store'
import { isUnlocked, markUnlocked } from './security'
import { LockScreen } from './views/Lock'
import { ApiceSymbol, Wordmark } from './components/Brand'
import { SaldosView } from './views/Saldos'
import { DayView } from './views/Day'
import { TotaisView } from './views/Totais'
import { TagsView } from './views/Tags'
import { InvestView } from './views/Invest'
import { MenuView } from './views/Menu'
import { AddMovModal } from './views/AddMov'
import { Toast, useToast } from './components/ui'
import { parseISO, todayISO } from './dates'

type Tab = 'saldos' | 'totais' | 'invest' | 'tags' | 'menu'

const NAV: { tab: Tab; label: string; icon: string }[] = [
  { tab: 'saldos', label: 'saldos', icon: '▦' },
  { tab: 'totais', label: 'totais', icon: '∑' },
  { tab: 'invest', label: 'investir', icon: '⬆' },
  { tab: 'tags', label: 'tags', icon: '⬚' },
  { tab: 'menu', label: 'menu', icon: '☰' },
]

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}

function Shell() {
  const { state } = useStore()
  const [locked, setLocked] = useState(() => !!state.settings.pin && !isUnlocked())
  const t = parseISO(todayISO())
  const [tab, setTab] = useState<Tab>('saldos')
  const [year, setYear] = useState(t.y)
  const [month, setMonth] = useState(t.m)
  const [openDay, setOpenDay] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [toast, showToast] = useToast()

  const nav = (y: number, m: number) => {
    setYear(y)
    setMonth(m)
  }

  if (locked && state.settings.pin) {
    return (
      <LockScreen
        pin={state.settings.pin}
        onUnlock={() => {
          markUnlocked()
          setLocked(false)
        }}
      />
    )
  }

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
            onClick={() => {
              setTab(n.tab)
              setOpenDay(null)
            }}
          >
            <span className="nav-ico">{n.icon}</span> {n.label}
          </button>
        ))}
        <button className="fab side" onClick={() => setAdding(true)}>
          ＋ nova movimentação
        </button>
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
            {tab === 'saldos' && <SaldosView year={year} month={month} onNav={nav} onOpenDay={setOpenDay} />}
            {tab === 'totais' && <TotaisView year={year} month={month} onNav={nav} />}
            {tab === 'invest' && <InvestView onToast={showToast} />}
            {tab === 'tags' && <TagsView year={year} month={month} onNav={nav} onToast={showToast} />}
            {tab === 'menu' && <MenuView onToast={showToast} />}
          </>
        )}
      </main>

      <nav className="bottomnav">
        {NAV.slice(0, 2).map((n) => (
          <NavBtn key={n.tab} n={n} cur={tab} openDay={openDay} onPick={(t2) => { setTab(t2); setOpenDay(null) }} />
        ))}
        <button className="fab" onClick={() => setAdding(true)} aria-label="nova movimentação">
          ＋
        </button>
        {NAV.slice(2, 4).map((n) => (
          <NavBtn key={n.tab} n={n} cur={tab} openDay={openDay} onPick={(t2) => { setTab(t2); setOpenDay(null) }} />
        ))}
        <NavBtn n={NAV[4]} cur={tab} openDay={openDay} onPick={(t2) => { setTab(t2); setOpenDay(null) }} />
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
