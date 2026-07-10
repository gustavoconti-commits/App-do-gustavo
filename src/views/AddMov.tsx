import React, { useMemo, useState } from 'react'
import { Mov, MovType, MOV_TYPES, TYPE_META } from '../types'
import { mkId, useStore } from '../store'
import { buildSeries, RepeatSpec } from '../engine'
import { Modal, MoneyInput, TypeIcon } from '../components/ui'
import { formatDateBR, todayISO } from '../dates'
import { fmtBRL } from '../format'

interface Props {
  initialDate?: string
  edit?: Mov // edição de uma movimentação existente
  onClose: () => void
  onSaved: (msg: string) => void
}

const REPEAT_PRESETS: { label: string; months: number }[] = [
  { label: '3 meses', months: 3 },
  { label: '6 meses', months: 6 },
  { label: '1 ano', months: 12 },
  { label: '2 anos', months: 24 },
  { label: '5 anos', months: 60 },
  { label: '10 anos', months: 120 },
  { label: '20 anos', months: 240 },
  { label: '30 anos', months: 360 },
]

export function AddMovModal({ initialDate, edit, onClose, onSaved }: Props) {
  const { state, dispatch } = useStore()
  const [type, setType] = useState<MovType>(edit?.type ?? 'saida')
  const [amount, setAmount] = useState(edit?.amount ?? 0)
  const [description, setDescription] = useState(edit?.description ?? '')
  const [date, setDate] = useState(edit?.date ?? initialDate ?? todayISO())
  const [accountId, setAccountId] = useState(edit?.accountId ?? state.accounts.find((a) => !a.archived)?.id ?? '')
  const [cardId, setCardId] = useState(edit?.cardId ?? state.cards.find((c) => !c.archived)?.id ?? '')
  const [boxId, setBoxId] = useState(edit?.boxId ?? state.boxes.find((b) => !b.archived)?.id ?? '')
  const [direction, setDirection] = useState<'aporte' | 'resgate'>(edit?.direction ?? 'aporte')
  const [tagIds, setTagIds] = useState<string[]>(edit?.tagIds ?? [])
  const [repeatKind, setRepeatKind] = useState<RepeatSpec['kind']>('none')
  const [installments, setInstallments] = useState(2)
  const [fixoMonths, setFixoMonths] = useState(12)
  const [showTypePick, setShowTypePick] = useState(false)
  const [showTags, setShowTags] = useState(false)
  const [showRepeat, setShowRepeat] = useState(false)
  const meta = TYPE_META[type]

  const visibleTags = state.tags
  const dailyTags = useMemo(() => visibleTags.filter((t) => t.isDaily), [visibleTags])

  function save() {
    if (amount <= 0) return
    if (type === 'investimento' && !boxId) return
    const base = {
      type,
      description: description.trim(),
      amount,
      date,
      accountId: type === 'cartao' ? undefined : accountId || undefined,
      cardId: type === 'cartao' ? cardId || undefined : undefined,
      boxId: type === 'investimento' ? boxId : undefined,
      direction: type === 'investimento' ? direction : undefined,
      tagIds,
      done: edit?.done,
      createdAt: edit?.createdAt ?? Date.now(),
    }
    if (edit) {
      dispatch({ type: 'updateMov', mov: { ...edit, ...base } })
      onSaved('movimentação atualizada!')
    } else {
      const repeat: RepeatSpec =
        repeatKind === 'parcelado'
          ? { kind: 'parcelado', installments }
          : repeatKind === 'fixo'
            ? { kind: 'fixo', months: fixoMonths }
            : { kind: 'none' }
      dispatch({ type: 'addMovs', movs: buildSeries(base, repeat, mkId) })
      onSaved('movimentação adicionada!')
    }
    onClose()
  }

  const repeatLabel =
    repeatKind === 'none'
      ? 'não repete'
      : repeatKind === 'parcelado'
        ? `parcelado em ${installments}x`
        : `repete por ${fixoMonths} meses`

  return (
    <Modal onClose={onClose}>
      <div className="addmov">
        <MoneyInput value={amount} onChange={setAmount} autoFocus={!edit} big />

        <button className="form-row" onClick={() => setShowTypePick((v) => !v)}>
          <TypeIcon type={type} />
          <span className="grow bold">{meta.label}</span>
          <span className="chev">▾</span>
        </button>
        {showTypePick && (
          <div className="type-pick">
            {MOV_TYPES.map((t) => (
              <button
                key={t}
                className={`type-opt${t === type ? ' sel' : ''}`}
                onClick={() => {
                  setType(t)
                  setShowTypePick(false)
                }}
              >
                <TypeIcon type={t} size={20} />
                <span>{TYPE_META[t].label}</span>
              </button>
            ))}
          </div>
        )}

        <label className="form-row">
          <span className="row-ico">✏️</span>
          <input
            className="grow"
            placeholder="descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        {type !== 'cartao' && state.accounts.filter((a) => !a.archived).length > 1 && (
          <label className="form-row">
            <span className="row-ico">🏦</span>
            <select className="grow" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {state.accounts
                .filter((a) => !a.archived)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
            </select>
          </label>
        )}

        {type === 'cartao' && (
          <label className="form-row">
            <span className="row-ico">💳</span>
            {state.cards.filter((c) => !c.archived).length > 0 ? (
              <select className="grow" value={cardId} onChange={(e) => setCardId(e.target.value)}>
                {state.cards
                  .filter((c) => !c.archived)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            ) : (
              <span className="grow muted">sem cartão cadastrado (menu → cartões)</span>
            )}
          </label>
        )}

        {type === 'investimento' && (
          <>
            <label className="form-row">
              <span className="row-ico">📦</span>
              {state.boxes.filter((b) => !b.archived).length > 0 ? (
                <select className="grow" value={boxId} onChange={(e) => setBoxId(e.target.value)}>
                  <option value="">escolha uma caixinha…</option>
                  {state.boxes
                    .filter((b) => !b.archived)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                </select>
              ) : (
                <span className="grow muted">crie uma caixinha na aba investimentos</span>
              )}
            </label>
            <div className="form-row seg-row">
              <button className={`seg${direction === 'aporte' ? ' sel' : ''}`} onClick={() => setDirection('aporte')}>
                aporte (guardar)
              </button>
              <button className={`seg${direction === 'resgate' ? ' sel' : ''}`} onClick={() => setDirection('resgate')}>
                resgate (sacar)
              </button>
            </div>
          </>
        )}

        <label className="form-row">
          <span className="row-ico">📅</span>
          <span className="grow bold">data</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="data" />
        </label>

        {!edit && (
          <>
            <button className="form-row" onClick={() => setShowRepeat((v) => !v)}>
              <span className="row-ico">🔁</span>
              <span className="grow bold">{repeatLabel}</span>
              <span className="chev">▾</span>
            </button>
            {showRepeat && (
              <div className="repeat-pick">
                <button className={`type-opt${repeatKind === 'none' ? ' sel' : ''}`} onClick={() => setRepeatKind('none')}>
                  não repete
                </button>
                <button
                  className={`type-opt${repeatKind === 'parcelado' ? ' sel' : ''}`}
                  onClick={() => setRepeatKind('parcelado')}
                >
                  parcelado
                </button>
                {repeatKind === 'parcelado' && (
                  <div className="repeat-detail">
                    <span>valor da parcela × </span>
                    <input
                      type="number"
                      min={2}
                      max={480}
                      value={installments}
                      onChange={(e) => setInstallments(Math.max(2, Math.min(480, Number(e.target.value) || 2)))}
                    />
                    <span className="muted"> = {fmtBRL(amount * installments)} no total</span>
                  </div>
                )}
                <button className={`type-opt${repeatKind === 'fixo' ? ' sel' : ''}`} onClick={() => setRepeatKind('fixo')}>
                  fixo mensal
                </button>
                {repeatKind === 'fixo' && (
                  <div className="repeat-detail wrap">
                    {REPEAT_PRESETS.map((p) => (
                      <button
                        key={p.months}
                        className={`chip${fixoMonths === p.months ? ' sel' : ''}`}
                        onClick={() => setFixoMonths(p.months)}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <button className="form-row" onClick={() => setShowTags((v) => !v)}>
          <span className="row-ico">🏷️</span>
          <span className="grow bold">
            {tagIds.length === 0 ? 'tags' : state.tags.filter((t) => tagIds.includes(t.id)).map((t) => t.name).join(', ')}
          </span>
          <span className="chev">▾</span>
        </button>
        {showTags && (
          <div className="tagsel">
            {visibleTags.length === 0 && <div className="muted pad8">sem tags — crie na aba tags</div>}
            {visibleTags.map((t) => (
              <label key={t.id} className="tagsel-row">
                <span className="tag-swatch" style={{ background: t.color }} />
                <span className="grow">
                  {t.isDaily ? 'DIÁRIO | ' : ''}
                  {t.name}
                  {t.monthlyBudget ? ` (${fmtBRL(t.monthlyBudget)})` : ''}
                </span>
                <input
                  type="checkbox"
                  checked={tagIds.includes(t.id)}
                  onChange={(e) =>
                    setTagIds((ids) => (e.target.checked ? [...ids, t.id] : ids.filter((id) => id !== t.id)))
                  }
                />
              </label>
            ))}
          </div>
        )}

        <button
          className="btn block submit"
          style={{ background: meta.color }}
          disabled={amount <= 0 || (type === 'investimento' && !boxId)}
          onClick={save}
        >
          {edit ? 'salvar alterações' : meta.verb}
        </button>
        <button className="btn block ghost" onClick={onClose}>
          cancelar
        </button>
      </div>
    </Modal>
  )
}
