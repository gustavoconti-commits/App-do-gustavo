import React, { useMemo } from 'react'
import { useStore } from '../store'
import { monthTotals } from '../engine'
import { TypeIcon, ProgressBar } from '../components/ui'
import { formatMonthYear, parseISO, todayISO } from '../dates'
import { fmtBRL } from '../format'

interface Props {
  year: number
  month: number
  onNav: (y: number, m: number) => void
}

export function TotaisView({ year, month, onNav }: Props) {
  const { state } = useStore()
  const today = todayISO()
  const tot = useMemo(() => monthTotals(state, year, month, today), [state, year, month, today])
  const t = parseISO(today)
  const goal = state.settings.savingsGoalPct

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

      <div className="totais">
        <h4 className="section-title">cálculos do mês</h4>

        <div className="tot-card">
          <div className="tot-head">
            <span className="tot-title">performance</span>
            <span className={`tot-value ${tot.performance < 0 ? 'neg' : 'pos'}`}>{fmtBRL(tot.performance)}</span>
          </div>
          <div className="tot-sub">
            <span className="formula">
              <TypeIcon type="entrada" size={15} /> − <TypeIcon type="saida" size={15} /> −{' '}
              <TypeIcon type="diario" size={15} /> − <TypeIcon type="economia" size={15} /> −{' '}
              <TypeIcon type="cartao" size={15} /> − <TypeIcon type="diario" size={15} dashed />
            </span>
            <span className="muted">{tot.performance < 0 ? 'faltou dinheiro' : 'sobrou dinheiro'}</span>
          </div>
        </div>

        <div className="tot-card">
          <div className="tot-head">
            <span className="tot-title">economizado</span>
            <span className="tot-value">{tot.economizadoPct}%</span>
          </div>
          <div className="tot-sub">
            <span className="formula grow-bar">
              <TypeIcon type="economia" size={15} />
              <ProgressBar pct={(tot.economizadoPct / Math.max(goal, 1)) * 100} color="#63b30f" />
              <TypeIcon type="entrada" size={15} />
            </span>
            <span className="muted">{tot.economizadoPct >= goal ? 'meta batida 🎉' : `abaixo do ideal (${goal}%)`}</span>
          </div>
        </div>

        <div className="tot-card">
          <div className="tot-head">
            <span className="tot-title">custo de vida</span>
            <span className="tot-value">{fmtBRL(tot.custoDeVida)}</span>
          </div>
          <div className="tot-sub">
            <span className="formula">
              <TypeIcon type="saida" size={15} /> + <TypeIcon type="diario" size={15} /> +{' '}
              <TypeIcon type="cartao" size={15} /> + <TypeIcon type="diario" size={15} dashed />
            </span>
            <span className="muted">{tot.custoDeVida <= tot.entradas ? 'dentro da renda' : 'acima da renda'}</span>
          </div>
        </div>

        <div className="tot-card">
          <div className="tot-head">
            <span className="tot-title">diário médio</span>
            <span className={`tot-value ${tot.allowance > 0 && tot.diarioMedio > tot.allowance ? 'neg' : ''}`}>
              {fmtBRL(tot.diarioMedio)}
            </span>
          </div>
          <div className="tot-sub">
            <span className="formula">
              <TypeIcon type="diario" size={15} /> / {tot.daysElapsed || '—'}
            </span>
            <span className="muted">
              <TypeIcon type="diario" size={15} dashed /> {fmtBRL(tot.allowance)}
            </span>
          </div>
        </div>

        <h4 className="section-title">movimentações do mês</h4>
        <div className="tot-list">
          <Row type="entrada" label="entradas" value={tot.entradas} />
          <Row type="saida" label="saídas" value={tot.saidas} />
          <Row type="diario" label="diários" value={tot.diarios} />
          <Row type="economia" label="economias" value={tot.economias} />
          <Row type="cartao" label="gastos com cartão" value={tot.cartao} />
          <Row type="investimento" label="investimentos (aportes)" value={tot.investAportes} />
          {tot.investResgates > 0 && <Row type="investimento" label="investimentos (resgates)" value={tot.investResgates} />}
        </div>

        <h4 className="section-title">previsão de diários do mês</h4>
        <div className="tot-list">
          <div className="tot-row">
            <TypeIcon type="diario" size={20} dashed />
            <span className="grow">previsão de diário × {tot.forecastCount}</span>
            <strong>{fmtBRL(tot.forecastTotal)}</strong>
          </div>
        </div>

        <h4 className="section-title">projeção</h4>
        <div className="tot-list">
          <div className="tot-row">
            <span className="row-ico">🏦</span>
            <span className="grow">saldo projetado ao fim de {formatMonthYear(year, month)}</span>
            <strong className={tot.endBalance < 0 ? 'neg' : ''}>{fmtBRL(tot.endBalance)}</strong>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ type, label, value }: { type: any; label: string; value: number }) {
  return (
    <div className="tot-row">
      <TypeIcon type={type} size={20} />
      <span className="grow">{label}</span>
      <strong>{fmtBRL(value)}</strong>
    </div>
  )
}
