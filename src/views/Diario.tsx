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

// Categorias de gasto diário: cada uma tem orçamento mensal e, opcionalmente,
// um mês de início. A soma vira o teto diário do mês.
export function DiarioView({ year, month, onNav, onToast }: Props) {
  const { state, dispatch } = useStore()
  const [editing, setEditing] = useState<Tag | null>(null)
  const [creating, setCreating] = useState(false)
  const t = parseISO(todayISO())
  const ym = `${year}-${String(month).padStart(2, '0')}`

  const dailyTags = useMemo(
    () => state.tags.filter((tg) => tg.isDaily).sort((a, b) => a.name.localeCompare(b.name)),
    [state.tags]
  )

  const budget = dailyBudgetMonthly(state.tags, year, month)
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
        <button className="nav-arrow" onClick={() => setCreating(true)} title="nova categoria de diário">＋</button>
      </header>

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

      <div className="mov-list">
        {dailyTags.length === 0 && (
          <div className="empty-state" onClick={() => setCreating(true)}>
            <div className="empty-plus">＋</div>
            <p className="muted">
              crie categorias de gasto diário (alimentação, transporte…) com um orçamento mensal. a soma dividida
              pelos dias do mês vira a sua diária.
            </p>
          </div>
        )}
        {dailyTags.map((tg) => {
          const active = !tg.startMonth || tg.startMonth <= ym
          const spent = tagSpentInMonth(state, tg.id, year, month)
          const over = tg.monthlyBudget ? spent > tg.monthlyBudget : false
          return (
            <div key={tg.id} className={`mov-row${active ? '' : ' inactive'}`} onClick={() => setEditing(tg)}>
              <span className="tag-swatch big" style={{ background: tg.color }} />
              <div className="mov-info">
                <div className="mov-desc">
                  {tg.name}
                  {tg.monthlyBudget ? <span className="muted"> ({fmtBRL(tg.monthlyBudget)}/mês)</span> : null}
                </div>
                {!active && tg.startMonth && (
                  <div className="muted small">começa em {tg.startMonth.split('-').reverse().join('/')}</div>
                )}
              </div>
              <span className={`mov-amt${over ? ' neg' : ''}`}>{fmtBRL(spent)}</span>
            </div>
          )
        })}
      </div>

      {(creating || editing) && (
        <DailyTagForm
          tag={editing ?? undefined}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
          onSave={(tag) => {
            dispatch({ type: 'upsertTag', tag })
            onToast(editing ? 'categoria atualizada!' : 'categoria criada!')
          }}
          onDelete={
            editing
              ? () => {
                  dispatch({ type: 'deleteTag', id: editing.id })
                  onToast('categoria excluída')
                }
              : undefined
          }
        />
      )}
    </div>
  )
}

function DailyTagForm({
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
  const [budget, setBudget] = useState(tag?.monthlyBudget ?? 0)
  const [startMonth, setStartMonth] = useState(tag?.startMonth ?? '')
  return (
    <Modal onClose={onClose}>
      <div className="addmov">
        <h3 className="modal-title">{tag ? 'editar categoria de diário' : 'nova categoria de diário'}</h3>
        <label className="form-row">
          <span className="row-ico">🏷️</span>
          <input
            className="grow"
            placeholder="nome (ex: ALIMENTAÇÃO)"
            value={name}
            onChange={(e) => setName(e.target.value.toUpperCase())}
            autoFocus
          />
        </label>
        <div className="form-row">
          <ColorPicker colors={TAG_COLORS} value={color} onChange={setColor} />
        </div>
        <label className="form-row">
          <span className="grow bold">orçamento mensal</span>
          <MoneyInput value={budget} onChange={setBudget} />
        </label>
        <label className="form-row">
          <span className="grow bold">começa a valer em</span>
          <input type="month" value={startMonth} onChange={(e) => setStartMonth(e.target.value)} />
        </label>
        {!startMonth && <p className="hint">sem mês de início: vale desde sempre.</p>}
        <button
          className="btn block submit"
          style={{ background: '#B0135B' }}
          disabled={!name.trim() || budget <= 0}
          onClick={() => {
            onSave({
              id: tag?.id ?? mkId(),
              name: name.trim(),
              color,
              isDaily: true,
              monthlyBudget: budget,
              startMonth: startMonth || undefined,
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
            excluir categoria
          </button>
        )}
        <button className="btn block ghost" onClick={onClose}>
          cancelar
        </button>
      </div>
    </Modal>
  )
}
