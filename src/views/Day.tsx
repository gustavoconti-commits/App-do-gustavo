import React, { useMemo, useState } from 'react'
import { useStore } from '../store'
import { Mov, MovType, MOV_TYPES, TYPE_META } from '../types'
import { ConfirmDialog, TypeIcon } from '../components/ui'
import { addDays, formatDateShortBR, todayISO, weekdayOf, WEEKDAY_SHORT } from '../dates'
import { fmtBRL } from '../format'
import { AddMovModal } from './AddMov'
import { balanceAt, dailyAllowance, monthRows } from '../engine'
import { parseISO } from '../dates'

interface Props {
  date: string
  onChangeDate: (iso: string) => void
  onBack: () => void
  onToast: (msg: string) => void
}

export function DayView({ date, onChangeDate, onBack, onToast }: Props) {
  const { state, dispatch } = useStore()
  const today = todayISO()
  const [typeFilter, setTypeFilter] = useState<MovType | ''>('')
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Mov | null>(null)
  const [deleting, setDeleting] = useState<Mov | null>(null)

  const movs = useMemo(
    () =>
      state.movs
        .filter((m) => m.date === date && (!typeFilter || m.type === typeFilter))
        .sort((a, b) => a.createdAt - b.createdAt),
    [state.movs, date, typeFilter]
  )

  const { y, m } = parseISO(date)
  const row = useMemo(() => monthRows(state, y, m, today).find((r) => r.date === date), [state, y, m, today, date])
  const allowance = dailyAllowance(state.tags, y, m)
  const diarioSpent = row?.byType.diario || 0
  const diarioLeft = allowance - diarioSpent

  return (
    <div className="view">
      <header className="topbar">
        <button className="nav-arrow" onClick={onBack} aria-label="voltar">←</button>
        <div className="month-nav">
          <button className="nav-arrow" onClick={() => onChangeDate(addDays(date, -1))} aria-label="dia anterior">‹</button>
          <span className="month-label static">
            {formatDateShortBR(date)}{' '}
            <small className="muted">
              {date === today
                ? 'hoje'
                : date === addDays(today, -1)
                  ? 'ontem'
                  : date === addDays(today, 1)
                    ? 'amanhã'
                    : WEEKDAY_SHORT[weekdayOf(date)]}
            </small>
          </span>
          <button className="nav-arrow" onClick={() => onChangeDate(addDays(date, 1))} aria-label="dia seguinte">›</button>
        </div>
        <button className="nav-arrow" onClick={() => setAdding(true)} aria-label="adicionar">＋</button>
      </header>

      <div className="subbar">
        <select className="tag-filter" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as MovType | '')}>
          <option value="">✻ todas</option>
          {MOV_TYPES.map((t) => (
            <option key={t} value={t}>
              {TYPE_META[t].label}
            </option>
          ))}
        </select>
      </div>

      <div className="day-summary">
        <div className="ds-cell">
          <span className="muted small">saldo do dia</span>
          <strong className={(row?.balance ?? 0) < 0 ? 'neg' : ''}>{fmtBRL(row?.balance ?? 0)}</strong>
        </div>
        {allowance > 0 && (
          <div className="ds-cell">
            <span className="muted small">diário: {fmtBRL(diarioSpent)} de {fmtBRL(allowance)}</span>
            <strong className={diarioLeft < 0 ? 'neg' : 'pos'}>
              {diarioLeft >= 0 ? `sobra ${fmtBRL(diarioLeft)}` : `estourou ${fmtBRL(-diarioLeft)}`}
            </strong>
          </div>
        )}
      </div>

      {movs.length === 0 ? (
        <div className="empty-state" onClick={() => setAdding(true)}>
          <div className="empty-plus">＋</div>
          <p className="muted">sem movimentações por aqui. toque no + para adicionar.</p>
        </div>
      ) : (
        <div className="mov-list">
          {movs.map((mv) => (
            <div key={mv.id} className="mov-row">
              <TypeIcon type={mv.type} />
              <div className="mov-info" onClick={() => setEditing(mv)}>
                <div className="mov-desc">
                  {mv.description || TYPE_META[mv.type].label}
                  {mv.type === 'investimento' && mv.boxId && (
                    <span className="muted"> · {state.boxes.find((b) => b.id === mv.boxId)?.name}</span>
                  )}
                  {mv.type === 'cartao' && mv.cardId && (
                    <span className="muted"> · {state.cards.find((c) => c.id === mv.cardId)?.name}</span>
                  )}
                </div>
                {mv.tagIds.length > 0 && (
                  <div className="mov-tags">
                    {mv.tagIds.map((id) => {
                      const tg = state.tags.find((t) => t.id === id)
                      return tg ? (
                        <span key={id} className="mov-tag" style={{ background: tg.color }}>
                          {tg.name}
                        </span>
                      ) : null
                    })}
                  </div>
                )}
              </div>
              <span
                className="mov-amt"
                style={{ color: TYPE_META[mv.type].color }}
              >
                {mv.type === 'investimento' && mv.direction === 'resgate' ? '+' : ''}
                {fmtBRL(mv.amount)}
              </span>
              <button
                className={`done-check${mv.done ? ' done' : ''}`}
                title={mv.done ? 'pago/recebido' : 'marcar como pago/recebido'}
                onClick={() => dispatch({ type: 'toggleDone', id: mv.id })}
              >
                ✓
              </button>
              <button className="del-btn" title="excluir" onClick={() => setDeleting(mv)}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {adding && <AddMovModal initialDate={date} onClose={() => setAdding(false)} onSaved={onToast} />}
      {editing && <AddMovModal edit={editing} onClose={() => setEditing(null)} onSaved={onToast} />}
      {deleting && (
        <ConfirmDialog
          title={
            deleting.seriesId
              ? `excluir "${deleting.description || TYPE_META[deleting.type].label}"? (faz parte de uma série)`
              : `excluir "${deleting.description || TYPE_META[deleting.type].label}"?`
          }
          options={
            deleting.seriesId
              ? [
                  {
                    label: 'excluir só esta',
                    danger: true,
                    onClick: () => {
                      dispatch({ type: 'deleteMov', id: deleting.id })
                      onToast('movimentação excluída')
                    },
                  },
                  {
                    label: 'excluir esta e as futuras',
                    danger: true,
                    onClick: () => {
                      dispatch({ type: 'deleteSeries', seriesId: deleting.seriesId!, fromDate: deleting.date })
                      onToast('série excluída desta data em diante')
                    },
                  },
                  {
                    label: 'excluir a série inteira',
                    danger: true,
                    onClick: () => {
                      dispatch({ type: 'deleteSeries', seriesId: deleting.seriesId! })
                      onToast('série excluída')
                    },
                  },
                ]
              : [
                  {
                    label: 'excluir',
                    danger: true,
                    onClick: () => {
                      dispatch({ type: 'deleteMov', id: deleting.id })
                      onToast('movimentação excluída')
                    },
                  },
                ]
          }
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
