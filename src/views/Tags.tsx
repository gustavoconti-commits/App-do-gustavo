import React, { useMemo, useState } from 'react'
import { mkId, useStore } from '../store'
import { Tag } from '../types'
import { dailyBudgetMonthly, tagSpentInMonth } from '../engine'
import { ColorPicker, Modal, MoneyInput, TAG_COLORS } from '../components/ui'
import { daysInMonth, formatMonthYear, parseISO, todayISO } from '../dates'
import { fmtBRL } from '../format'

interface Props {
  year: number
  month: number
  onNav: (y: number, m: number) => void
  onToast: (msg: string) => void
}

export function TagsView({ year, month, onNav, onToast }: Props) {
  const { state, dispatch } = useStore()
  const [filter, setFilter] = useState('')
  const [editing, setEditing] = useState<Tag | null>(null)
  const [creating, setCreating] = useState(false)
  const t = parseISO(todayISO())

  const tags = useMemo(
    () =>
      state.tags
        .filter((tg) => tg.name.toLowerCase().includes(filter.toLowerCase()))
        .sort((a, b) => Number(b.isDaily || false) - Number(a.isDaily || false) || a.name.localeCompare(b.name)),
    [state.tags, filter]
  )

  const budget = dailyBudgetMonthly(state.tags)
  const allowance = budget / daysInMonth(year, month)

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
        <button className="nav-arrow" onClick={() => setCreating(true)} title="nova tag">＋</button>
      </header>

      <div className="subbar">
        <input className="search" placeholder="🔍 filtrar tags" value={filter} onChange={(e) => setFilter(e.target.value)} />
      </div>

      {budget > 0 && (
        <div className="day-summary">
          <div className="ds-cell">
            <span className="muted small">orçamento diário do mês</span>
            <strong>{fmtBRL(budget)}</strong>
          </div>
          <div className="ds-cell">
            <span className="muted small">diária ({daysInMonth(year, month)} dias)</span>
            <strong>{fmtBRL(allowance)}</strong>
          </div>
        </div>
      )}

      <div className="mov-list">
        {tags.length === 0 && (
          <div className="empty-state" onClick={() => setCreating(true)}>
            <div className="empty-plus">＋</div>
            <p className="muted">sem tags. toque no + para criar.</p>
          </div>
        )}
        {tags.map((tg) => {
          const spent = tagSpentInMonth(state, tg.id, year, month)
          const over = tg.monthlyBudget ? spent > tg.monthlyBudget : false
          return (
            <div key={tg.id} className="mov-row" onClick={() => setEditing(tg)}>
              <span className="tag-swatch big" style={{ background: tg.color }} />
              <div className="mov-info">
                <div className="mov-desc">
                  {tg.isDaily ? 'DIÁRIO | ' : ''}
                  {tg.name}
                  {tg.monthlyBudget ? <span className="muted"> ({fmtBRL(tg.monthlyBudget)})</span> : null}
                </div>
              </div>
              <span className={`mov-amt${over ? ' neg' : ''}`}>{fmtBRL(spent)}</span>
            </div>
          )
        })}
      </div>

      {(creating || editing) && (
        <TagForm
          tag={editing ?? undefined}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
          onSave={(tag) => {
            dispatch({ type: 'upsertTag', tag })
            onToast(editing ? 'tag atualizada!' : 'tag criada!')
          }}
          onDelete={
            editing
              ? () => {
                  dispatch({ type: 'deleteTag', id: editing.id })
                  onToast('tag excluída')
                }
              : undefined
          }
        />
      )}
    </div>
  )
}

function TagForm({
  tag,
  onClose,
  onSave,
  onDelete,
}: {
  tag?: Tag
  onClose: () => void
  onSave: (t: Tag) => void
  onDelete?: () => void
}) {
  const [name, setName] = useState(tag?.name ?? '')
  const [color, setColor] = useState(tag?.color ?? TAG_COLORS[0])
  const [isDaily, setIsDaily] = useState(tag?.isDaily ?? false)
  const [budget, setBudget] = useState(tag?.monthlyBudget ?? 0)
  return (
    <Modal onClose={onClose}>
      <div className="addmov">
        <h3 className="modal-title">{tag ? 'editar tag' : 'nova tag'}</h3>
        <label className="form-row">
          <span className="row-ico">🏷️</span>
          <input
            className="grow"
            placeholder="nome da tag (ex: ALIMENTAÇÃO)"
            value={name}
            onChange={(e) => setName(e.target.value.toUpperCase())}
            autoFocus
          />
        </label>
        <div className="form-row">
          <ColorPicker colors={TAG_COLORS} value={color} onChange={setColor} />
        </div>
        <label className="form-row">
          <span className="grow bold">tag de gasto diário</span>
          <input type="checkbox" checked={isDaily} onChange={(e) => setIsDaily(e.target.checked)} />
        </label>
        {isDaily && (
          <label className="form-row">
            <span className="grow bold">orçamento mensal</span>
            <MoneyInput value={budget} onChange={setBudget} />
          </label>
        )}
        <button
          className="btn block submit"
          style={{ background: '#111' }}
          disabled={!name.trim()}
          onClick={() => {
            onSave({
              id: tag?.id ?? mkId(),
              name: name.trim(),
              color,
              isDaily,
              monthlyBudget: isDaily && budget > 0 ? budget : undefined,
            })
            onClose()
          }}
        >
          salvar
        </button>
        {onDelete && (
          <button
            className="btn block danger"
            onClick={() => {
              onDelete()
              onClose()
            }}
          >
            excluir tag
          </button>
        )}
        <button className="btn block ghost" onClick={onClose}>
          cancelar
        </button>
      </div>
    </Modal>
  )
}
