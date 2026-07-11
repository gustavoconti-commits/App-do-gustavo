import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../store'
import { balanceAt, monthRows, monthTotals } from '../engine'
import { MovType, MOV_TYPES, TYPE_META } from '../types'
import { TypeIcon } from '../components/ui'
import { formatMonthYear, MONTH_NAMES_SHORT, parseISO, todayISO, weekdayOf, WEEKDAY_SHORT } from '../dates'
import { fmtBRL } from '../format'

// Filtro do fluxo: '' (todas), 'type:<tipo>' ou 'tag:<id>'
export type FluxFilter = string

interface Props {
  year: number
  month: number
  filter: FluxFilter
  onFilter: (f: FluxFilter) => void
  onNav: (y: number, m: number) => void
  onOpenDay: (iso: string) => void
}

export function SaldosView({ year, month, filter, onFilter, onNav, onOpenDay }: Props) {
  const { state } = useStore()
  const today = todayISO()
  const [yearMode, setYearMode] = useState(false)
  const typeFilter = filter.startsWith('type:') ? (filter.slice(5) as MovType) : null
  const tagFilter = filter.startsWith('tag:') ? filter.slice(4) : null
  const rows = useMemo(() => monthRows(state, year, month, today), [state, year, month, today])
  const saldoHoje = useMemo(() => balanceAt(state, today), [state, today])
  const t = parseISO(today)
  const isCurrentMonth = t.y === year && t.m === month
  const todayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isCurrentMonth && todayRef.current) {
      todayRef.current.scrollIntoView({ block: 'center' })
    }
  }, [year, month, isCurrentMonth])

  function prev() {
    if (yearMode) onNav(year - 1, month)
    else if (month === 1) onNav(year - 1, 12)
    else onNav(year, month - 1)
  }
  function next() {
    if (yearMode) onNav(year + 1, month)
    else if (month === 12) onNav(year, month + 1)
    else onNav(year, month + 1)
  }

  return (
    <div className="view">
      <header className="topbar">
        <button
          className="cal-btn"
          onClick={() => {
            onNav(t.y, t.m)
            setYearMode(false)
          }}
          title="ir para hoje"
        >
          <span className="cal-top" />
          <span className="cal-num">{t.d}</span>
        </button>
        <div className="month-nav">
          <button className="nav-arrow" onClick={prev} aria-label="anterior">‹</button>
          <button className="month-label" onClick={() => setYearMode((v) => !v)}>
            {yearMode ? year : formatMonthYear(year, month)}
          </button>
          <button className="nav-arrow" onClick={next} aria-label="próximo">›</button>
        </div>
        <button className={`grid-btn${yearMode ? ' active' : ''}`} onClick={() => setYearMode((v) => !v)} title="visão anual">
          <span /><span /><span /><span />
        </button>
      </header>

      {yearMode ? (
        <YearGrid
          year={year}
          onPick={(m) => {
            setYearMode(false)
            onNav(year, m)
          }}
        />
      ) : (
        <>
          <div className="subbar">
            <span className="muted">dia</span>
            <select className="tag-filter" value={filter} onChange={(e) => onFilter(e.target.value)}>
              <option value="">✻ todas</option>
              <optgroup label="por tipo">
                {MOV_TYPES.map((tp) => (
                  <option key={tp} value={`type:${tp}`}>
                    {TYPE_META[tp].label}
                  </option>
                ))}
              </optgroup>
              {state.tags.filter((tg) => tg.isDaily).length > 0 && (
                <optgroup label="diário">
                  {state.tags
                    .filter((tg) => tg.isDaily)
                    .map((tg) => (
                      <option key={tg.id} value={`tag:${tg.id}`}>
                        {tg.name}
                      </option>
                    ))}
                </optgroup>
              )}
              {state.tags.filter((tg) => !tg.isDaily).length > 0 && (
                <optgroup label="tags">
                  {state.tags
                    .filter((tg) => !tg.isDaily)
                    .map((tg) => (
                      <option key={tg.id} value={`tag:${tg.id}`}>
                        {tg.name}
                      </option>
                    ))}
                </optgroup>
              )}
            </select>
            <span className="muted right">saldos</span>
          </div>

          <div className="flux">
            {rows.map((r) => {
              const isToday = r.date === today
              const isPast = r.date < today
              const filtered = r.movs.filter(
                (m) => (!tagFilter || m.tagIds.includes(tagFilter)) && (!typeFilter || m.type === typeFilter)
              )
              const byType: Partial<Record<MovType, number>> = {}
              for (const m of filtered) byType[m.type] = (byType[m.type] || 0) + m.amount
              const lines = MOV_TYPES.filter((tp) => (byType[tp] || 0) > 0)
              const showForecast = r.forecastDiario > 0 && !tagFilter && (!typeFilter || typeFilter === 'diario')
              return (
                <div
                  key={r.date}
                  ref={isToday ? todayRef : undefined}
                  className={`flux-day${isToday ? ' today' : ''}${isPast ? ' past' : ''}`}
                  onClick={() => onOpenDay(r.date)}
                >
                  <div className={`flux-daynum${isToday ? ' today' : ''}`}>
                    <div className="dnum">{r.day}</div>
                    <div className="dwk">{WEEKDAY_SHORT[weekdayOf(r.date)]}</div>
                  </div>
                  <div className="flux-lines">
                    {lines.length === 0 && !showForecast && (
                      <div className="flux-line empty">
                        <span className="muted small">—</span>
                      </div>
                    )}
                    {lines.map((tp) => (
                      <div className="flux-line" key={tp}>
                        <TypeIcon type={tp} size={18} />
                        <span className="flux-amt" style={{ color: TYPE_META[tp].color }}>
                          {fmtBRL(byType[tp]!)}
                        </span>
                      </div>
                    ))}
                    {showForecast && (
                      <div className="flux-line forecast">
                        <TypeIcon type="diario" size={18} dashed />
                        <span className="flux-amt muted">{fmtBRL(r.forecastDiario)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flux-saldo">
                    <span className={r.balance < 0 ? 'neg' : ''}>{fmtBRL(r.balance)}</span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="saldo-footer">
            <span>saldo em conta hoje</span>
            <strong className={saldoHoje < 0 ? 'neg' : ''}>{fmtBRL(saldoHoje)}</strong>
          </div>
        </>
      )}
    </div>
  )
}

function YearGrid({ year, onPick }: { year: number; onPick: (m: number) => void }) {
  const { state } = useStore()
  const today = todayISO()
  const t = parseISO(today)
  return (
    <div className="year-grid">
      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
        const tot = monthTotals(state, year, m, today)
        const isCur = t.y === year && t.m === m
        return (
          <button key={m} className={`year-cell${isCur ? ' cur' : ''}`} onClick={() => onPick(m)}>
            <div className="yc-month">{MONTH_NAMES_SHORT[m - 1]}</div>
            <div className="yc-row">
              <span className="yc-lbl in">entra</span>
              <span>{fmtBRL(tot.entradas)}</span>
            </div>
            <div className="yc-row">
              <span className="yc-lbl out">sai</span>
              <span>{fmtBRL(tot.saidas + tot.diarios + tot.cartao + tot.forecastTotal)}</span>
            </div>
            <div className="yc-row saldo">
              <span className="yc-lbl">saldo</span>
              <span className={tot.endBalance < 0 ? 'neg' : ''}>{fmtBRL(tot.endBalance)}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
