import React, { useEffect, useRef, useState } from 'react'
import { MovType, TYPE_META } from '../types'
import { digitsToAmount, fmtNum } from '../format'

export function TypeIcon({ type, size = 22, faded = false, dashed = false }: { type: MovType; size?: number; faded?: boolean; dashed?: boolean }) {
  const meta = TYPE_META[type]
  return (
    <span
      className="type-icon"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.52,
        background: faded ? '#d6d6d6' : meta.color,
        border: dashed ? '2px dashed rgba(255,255,255,.8)' : 'none',
      }}
      aria-label={meta.label}
    >
      {meta.letter.toUpperCase()}
    </span>
  )
}

export function Modal({ children, onClose, wide = false }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal-sheet${wide ? ' wide' : ''}`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

// Campo de dinheiro estilo caixa registradora: digita dígitos, cresce dos centavos.
export function MoneyInput({
  value,
  onChange,
  autoFocus = false,
  big = false,
  placeholderZero = true,
}: {
  value: number
  onChange: (v: number) => void
  autoFocus?: boolean
  big?: boolean
  placeholderZero?: boolean
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (autoFocus && ref.current) ref.current.focus()
  }, [autoFocus])
  const shown = value === 0 && placeholderZero ? '' : fmtNum(value)
  return (
    <div className={`money-input${big ? ' big' : ''}`}>
      <span className="money-prefix">R$</span>
      <input
        ref={ref}
        inputMode="numeric"
        placeholder="0,00"
        value={shown}
        onChange={(e) => onChange(digitsToAmount(e.target.value))}
        aria-label="valor"
      />
    </div>
  )
}

export function Toast({ msg }: { msg: string }) {
  return <div className="toast">{msg}</div>
}

export function useToast(): [string | null, (m: string) => void] {
  const [msg, setMsg] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const show = (m: string) => {
    setMsg(m)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setMsg(null), 2200)
  }
  useEffect(() => () => window.clearTimeout(timer.current), [])
  return [msg, show]
}

export const TAG_COLORS = ['#e8e28a', '#b7a8e8', '#8fd68a', '#d8c8a8', '#a8cdf0', '#f0b3a8', '#f0d0e8', '#c0e8e0', '#f5c869', '#c9c9c9']
export const ACCOUNT_COLORS = ['#111111', '#0f6cbd', '#1e7d3f', '#b23310', '#6a1fd0', '#b0135b', '#8a6d3b', '#4a4a4a']

export function ColorPicker({ colors, value, onChange }: { colors: string[]; value: string; onChange: (c: string) => void }) {
  return (
    <div className="color-picker">
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          className={`color-dot${value === c ? ' sel' : ''}`}
          style={{ background: c }}
          onClick={() => onChange(c)}
          aria-label={`cor ${c}`}
        />
      ))}
    </div>
  )
}

export function ProgressBar({ pct, color = '#1e7d3f' }: { pct: number; color?: string }) {
  const clamped = Math.max(0, Math.min(100, pct))
  return (
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${clamped}%`, background: color }} />
    </div>
  )
}

export function ConfirmDialog({
  title,
  options,
  onClose,
}: {
  title: string
  options: { label: string; danger?: boolean; onClick: () => void }[]
  onClose: () => void
}) {
  return (
    <Modal onClose={onClose}>
      <div className="confirm">
        <h3>{title}</h3>
        {options.map((o, i) => (
          <button
            key={i}
            className={`btn block${o.danger ? ' danger' : ''}`}
            onClick={() => {
              o.onClick()
              onClose()
            }}
          >
            {o.label}
          </button>
        ))}
        <button className="btn block ghost" onClick={onClose}>
          cancelar
        </button>
      </div>
    </Modal>
  )
}
