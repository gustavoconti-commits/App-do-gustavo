import React, { useState } from 'react'
import { PinConfig, verifyPin } from '../security'
import { ApiceSymbol, Wordmark } from '../components/Brand'

export function LockScreen({ pin, onUnlock }: { pin: PinConfig; onUnlock: () => void }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const [checking, setChecking] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!value || checking) return
    setChecking(true)
    const ok = await verifyPin(value, pin)
    setChecking(false)
    if (ok) {
      onUnlock()
    } else {
      setError(true)
      setValue('')
      setTimeout(() => setError(false), 900)
    }
  }

  return (
    <div className="lock-screen">
      <div className="lock-card">
        <ApiceSymbol width={64} />
        <Wordmark size={28} />
        <p className="lock-sub">controle financeiro</p>
        <form onSubmit={submit} className={`lock-form${error ? ' shake' : ''}`}>
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            placeholder="senha"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-label="senha de acesso"
          />
          <button className="btn gold" type="submit" disabled={!value || checking}>
            entrar
          </button>
        </form>
        {error && <p className="lock-error">senha incorreta</p>}
        <p className="lock-hint">os dados ficam guardados só neste aparelho, protegidos por esta senha.</p>
      </div>
    </div>
  )
}
