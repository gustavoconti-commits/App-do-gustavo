import React, { useState } from 'react'
import { mkId, useStore } from '../store'
import { Box } from '../types'
import { boxBalance, boxMonthlyNeeded, investedTotal } from '../engine'
import { ColorPicker, ConfirmDialog, Modal, MoneyInput, ProgressBar, TAG_COLORS } from '../components/ui'
import { formatDateBR, monthsUntil, todayISO } from '../dates'
import { fmtBRL } from '../format'
import { AddMovModal } from './AddMov'

export function InvestView({ onToast }: { onToast: (msg: string) => void }) {
  const { state, dispatch } = useStore()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Box | null>(null)
  const [deleting, setDeleting] = useState<Box | null>(null)
  const [adding, setAdding] = useState(false)
  const today = todayISO()
  const total = investedTotal(state)
  const boxes = state.boxes.filter((b) => !b.archived)

  return (
    <div className="view">
      <header className="topbar">
        <span style={{ width: 40 }} />
        <div className="month-nav">
          <span className="month-label static">investimentos</span>
        </div>
        <button className="nav-arrow" onClick={() => setCreating(true)} title="nova caixinha">＋</button>
      </header>

      <div className="invest-total">
        <span className="muted">total investido</span>
        <strong>{fmtBRL(total)}</strong>
        <button className="btn small" onClick={() => setAdding(true)}>
          + aporte / resgate
        </button>
      </div>

      <div className="boxes">
        {boxes.length === 0 && (
          <div className="empty-state" onClick={() => setCreating(true)}>
            <div className="empty-plus">＋</div>
            <p className="muted">
              crie caixinhas para seus objetivos (reserva de emergência, viagem…) e registre aportes com a movimentação
              "investimento".
            </p>
          </div>
        )}
        {boxes.map((box) => {
          const bal = boxBalance(state, box.id)
          const pct = box.target ? (bal / box.target) * 100 : 0
          const monthly = boxMonthlyNeeded(state, box.id, today)
          return (
            <div key={box.id} className="box-card" style={{ borderLeftColor: box.color }}>
              <div className="box-head">
                <strong>{box.name}</strong>
                <button className="edit-link" onClick={() => setEditing(box)}>
                  editar
                </button>
              </div>
              <div className="box-amounts">
                <strong>{fmtBRL(bal)}</strong>
                {box.target ? <span className="muted"> de {fmtBRL(box.target)}</span> : null}
              </div>
              {box.target ? (
                <>
                  <ProgressBar pct={pct} color={box.color} />
                  <div className="box-meta">
                    <span className="muted small">{Math.min(100, Math.floor(pct))}% alcançado</span>
                    {box.deadline && box.deadline > today && (
                      <span className="muted small">
                        até {formatDateBR(box.deadline)} ({monthsUntil(today, box.deadline)} meses)
                      </span>
                    )}
                  </div>
                  {monthly !== null && monthly > 0 && (
                    <div className="box-needed">
                      guardar <strong>{fmtBRL(monthly)}</strong>/mês para bater a meta no prazo
                    </div>
                  )}
                  {box.target > 0 && bal >= box.target && <div className="box-needed done">🎉 meta alcançada!</div>}
                </>
              ) : (
                <span className="muted small">sem meta definida</span>
              )}
            </div>
          )
        })}
      </div>

      {(creating || editing) && (
        <BoxForm
          box={editing ?? undefined}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
          onSave={(box) => {
            dispatch({ type: 'upsertBox', box })
            onToast(editing ? 'caixinha atualizada!' : 'caixinha criada!')
          }}
          onDelete={editing ? () => setDeleting(editing) : undefined}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title={`excluir a caixinha "${deleting.name}"? os aportes registrados nela também serão excluídos.`}
          options={[
            {
              label: 'excluir caixinha e aportes',
              danger: true,
              onClick: () => {
                dispatch({ type: 'deleteBox', id: deleting.id })
                onToast('caixinha excluída')
                setEditing(null)
              },
            },
          ]}
          onClose={() => setDeleting(null)}
        />
      )}
      {adding && <AddMovModal onClose={() => setAdding(false)} onSaved={onToast} />}
    </div>
  )
}

function BoxForm({
  box,
  onClose,
  onSave,
  onDelete,
}: {
  box?: Box
  onClose: () => void
  onSave: (b: Box) => void
  onDelete?: () => void
}) {
  const [name, setName] = useState(box?.name ?? '')
  const [color, setColor] = useState(box?.color ?? TAG_COLORS[4])
  const [target, setTarget] = useState(box?.target ?? 0)
  const [deadline, setDeadline] = useState(box?.deadline ?? '')
  return (
    <Modal onClose={onClose}>
      <div className="addmov">
        <h3 className="modal-title">{box ? 'editar caixinha' : 'nova caixinha'}</h3>
        <label className="form-row">
          <span className="row-ico">📦</span>
          <input
            className="grow"
            placeholder="nome (ex: reserva de emergência)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </label>
        <div className="form-row">
          <ColorPicker colors={TAG_COLORS} value={color} onChange={setColor} />
        </div>
        <label className="form-row">
          <span className="grow bold">meta (opcional)</span>
          <MoneyInput value={target} onChange={setTarget} />
        </label>
        <label className="form-row">
          <span className="grow bold">prazo (opcional)</span>
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </label>
        <button
          className="btn block submit"
          style={{ background: '#0f6cbd' }}
          disabled={!name.trim()}
          onClick={() => {
            onSave({
              id: box?.id ?? mkId(),
              name: name.trim(),
              color,
              target: target > 0 ? target : undefined,
              deadline: deadline || undefined,
            })
            onClose()
          }}
        >
          salvar
        </button>
        {onDelete && (
          <button className="btn block danger" onClick={onDelete}>
            excluir caixinha
          </button>
        )}
        <button className="btn block ghost" onClick={onClose}>
          cancelar
        </button>
      </div>
    </Modal>
  )
}
