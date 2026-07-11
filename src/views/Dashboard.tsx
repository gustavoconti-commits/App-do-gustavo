import React, { useMemo, useState } from 'react'
import { useStore } from '../store'
import { accountBalancesAt, monthlySeries, MonthPoint, Slice, spentByAccount, spentByCard, spentByTag } from '../engine'
import { formatMonthYear, MONTH_NAMES_SHORT, parseISO, todayISO } from '../dates'
import { fmtBRL } from '../format'

// Cores de gráfico validadas para daltonismo (variação viva da paleta da marca)
const CHART_IN = '#178456' // entradas
const CHART_OUT = '#B4532F' // custos

interface Props {
  year: number
  month: number
  onNav: (y: number, m: number) => void
}

export function DashboardView({ year, month, onNav }: Props) {
  const { state } = useStore()
  const today = todayISO()
  const t = parseISO(today)

  const series = useMemo(() => monthlySeries(state, year, month, 6), [state, year, month])
  const byTag = useMemo(() => spentByTag(state, year, month), [state, year, month])
  const byCard = useMemo(() => spentByCard(state, year, month), [state, year, month])
  const byAccount = useMemo(() => spentByAccount(state, year, month), [state, year, month])
  const balances = useMemo(() => accountBalancesAt(state, today), [state, today])

  const cur = series[series.length - 1]

  function prev() {
    if (month === 1) onNav(year - 1, 12)
    else onNav(year, month - 1)
  }
  function next() {
    if (month === 12) onNav(year + 1, 1)
    else onNav(year, month + 1)
  }

  return (
    <div className="view">
      <header className="topbar">
        <button className="cal-btn" onClick={() => onNav(t.y, t.m)} title="ir para hoje">
          <span className="cal-top" />
          <span className="cal-num">{t.d}</span>
        </button>
        <div className="month-nav">
          <button className="nav-arrow" onClick={prev}>‹</button>
          <span className="month-label static">{formatMonthYear(year, month)}</span>
          <button className="nav-arrow" onClick={next}>›</button>
        </div>
        <span style={{ width: 40 }} />
      </header>

      <div className="dash">
        <div className="dash-tiles">
          <div className="dash-tile">
            <span className="dt-label">entradas do mês</span>
            <strong className="dt-value" style={{ color: CHART_IN }}>{fmtBRL(cur?.entradas ?? 0)}</strong>
          </div>
          <div className="dash-tile">
            <span className="dt-label">custos do mês</span>
            <strong className="dt-value" style={{ color: CHART_OUT }}>{fmtBRL(cur?.custos ?? 0)}</strong>
          </div>
          <div className="dash-tile">
            <span className="dt-label">resultado</span>
            <strong className={`dt-value ${(cur?.entradas ?? 0) - (cur?.custos ?? 0) < 0 ? 'neg' : 'pos'}`}>
              {fmtBRL((cur?.entradas ?? 0) - (cur?.custos ?? 0))}
            </strong>
          </div>
        </div>

        <section className="dash-card">
          <h4 className="dash-title">entradas × custos — últimos 6 meses</h4>
          <div className="dash-legend">
            <span><i className="leg-dot" style={{ background: CHART_IN }} /> entradas</span>
            <span><i className="leg-dot" style={{ background: CHART_OUT }} /> custos (saídas + diários + cartão)</span>
          </div>
          <GroupedBars data={series} />
        </section>

        <section className="dash-card">
          <h4 className="dash-title">gastos por tag — {formatMonthYear(year, month)}</h4>
          {byTag.length === 0 ? (
            <p className="muted small">sem gastos no mês (ou sem tags nas movimentações).</p>
          ) : (
            <BarList slices={byTag} />
          )}
        </section>

        <section className="dash-card">
          <h4 className="dash-title">gastos por cartão — {formatMonthYear(year, month)}</h4>
          {byCard.length === 0 ? (
            <p className="muted small">nenhum gasto com cartão no mês.</p>
          ) : (
            <BarList slices={byCard} />
          )}
        </section>

        <section className="dash-card">
          <h4 className="dash-title">gastos por conta — {formatMonthYear(year, month)}</h4>
          {byAccount.length === 0 ? (
            <p className="muted small">nenhuma saída ou diário no mês.</p>
          ) : (
            <BarList slices={byAccount} />
          )}
        </section>

        <section className="dash-card">
          <h4 className="dash-title">saldo em conta hoje</h4>
          <div className="acc-balances">
            {state.accounts
              .filter((a) => !a.archived)
              .map((a) => (
                <div key={a.id} className="acc-row">
                  <span className="tag-swatch big" style={{ background: a.color }} />
                  <span className="grow">{a.name}</span>
                  <strong className={(balances.get(a.id) ?? 0) < 0 ? 'neg' : ''}>{fmtBRL(balances.get(a.id) ?? 0)}</strong>
                </div>
              ))}
            <div className="acc-row total">
              <span className="grow">total</span>
              <strong className={sumMap(balances) < 0 ? 'neg' : ''}>{fmtBRL(sumMap(balances))}</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function sumMap(m: Map<string, number>): number {
  let s = 0
  for (const v of m.values()) s += v
  return Math.round(s * 100) / 100
}

// Barras agrupadas (2 séries) em SVG, com tooltip por grupo.
function GroupedBars({ data }: { data: MonthPoint[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const W = 640
  const H = 240
  const padL = 8
  const padB = 26
  const padT = 30
  const max = Math.max(1, ...data.map((d) => Math.max(d.entradas, d.custos)))
  const groupW = (W - padL * 2) / data.length
  const barW = Math.min(26, groupW * 0.28)
  const plotH = H - padB - padT

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="entradas e custos por mês">
        {/* linhas-guia discretas */}
        {[0.5, 1].map((f) => (
          <line key={f} x1={padL} x2={W - padL} y1={padT + plotH * (1 - f)} y2={padT + plotH * (1 - f)} className="grid-line" />
        ))}
        {data.map((d, i) => {
          const cx = padL + groupW * i + groupW / 2
          const hIn = (d.entradas / max) * plotH
          const hOut = (d.custos / max) * plotH
          const isHover = hover === i
          return (
            <g
              key={i}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onTouchStart={() => setHover(isHover ? null : i)}
            >
              {/* alvo de toque maior que as barras */}
              <rect x={padL + groupW * i} y={0} width={groupW} height={H} fill="transparent" />
              <rect
                x={cx - barW - 1}
                y={padT + plotH - hIn}
                width={barW}
                height={Math.max(hIn, d.entradas > 0 ? 2 : 0)}
                rx={4}
                fill={CHART_IN}
                opacity={hover === null || isHover ? 1 : 0.45}
              />
              <rect
                x={cx + 1}
                y={padT + plotH - hOut}
                width={barW}
                height={Math.max(hOut, d.custos > 0 ? 2 : 0)}
                rx={4}
                fill={CHART_OUT}
                opacity={hover === null || isHover ? 1 : 0.45}
              />
              <text x={cx} y={H - 8} className="axis-label" textAnchor="middle">
                {MONTH_NAMES_SHORT[d.m - 1]}
              </text>
            </g>
          )
        })}
      </svg>
      {hover !== null && data[hover] && (
        <div className="chart-tooltip">
          <strong>{formatMonthYear(data[hover].y, data[hover].m)}</strong>
          <span><i className="leg-dot" style={{ background: CHART_IN }} /> entradas {fmtBRL(data[hover].entradas)}</span>
          <span><i className="leg-dot" style={{ background: CHART_OUT }} /> custos {fmtBRL(data[hover].custos)}</span>
        </div>
      )}
    </div>
  )
}

// Lista de barras horizontais: rótulo + valor + barra proporcional na cor da
// entidade (a identidade vem do rótulo, nunca só da cor).
function BarList({ slices }: { slices: Slice[] }) {
  const max = Math.max(1, ...slices.map((s) => s.value))
  const total = slices.reduce((s, x) => s + x.value, 0)
  return (
    <div className="barlist">
      {slices.map((s) => (
        <div key={s.id + s.label} className="barlist-row" title={`${s.label}: ${fmtBRL(s.value)}`}>
          <div className="barlist-head">
            <span className="barlist-label">
              <span className="tag-swatch" style={{ background: s.color }} /> {s.label}
            </span>
            <span className="barlist-value">
              {fmtBRL(s.value)} <span className="muted small">({Math.round((s.value / total) * 100)}%)</span>
            </span>
          </div>
          <div className="barlist-track">
            <div className="barlist-fill" style={{ width: `${(s.value / max) * 100}%`, background: s.color }} />
          </div>
        </div>
      ))}
    </div>
  )
}
