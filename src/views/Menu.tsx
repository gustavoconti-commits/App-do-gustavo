import React, { useRef, useState } from 'react'
import { exportJSON, mkId, parseImport, useStore } from '../store'
import { Account, Card } from '../types'
import { ACCOUNT_COLORS, ColorPicker, ConfirmDialog, Modal, MoneyInput } from '../components/ui'
import { balanceAt, initialBalanceTotal } from '../engine'
import { hashPin, lockSession, mkSalt, verifyPin } from '../security'
import { todayISO } from '../dates'
import { fmtBRL } from '../format'

export function MenuView({ onToast }: { onToast: (msg: string) => void }) {
  const { state, dispatch } = useStore()
  const [editAccount, setEditAccount] = useState<Account | null>(null)
  const [newAccount, setNewAccount] = useState(false)
  const [editCard, setEditCard] = useState<Card | null>(null)
  const [newCard, setNewCard] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [pinModal, setPinModal] = useState<'create' | 'change' | 'remove' | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const today = todayISO()
  const saldoHoje = balanceAt(state, today)

  function download() {
    const blob = new Blob([exportJSON(state)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `grana-backup-${today}.json`
    a.click()
    URL.revokeObjectURL(url)
    onToast('backup exportado!')
  }

  function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      const parsed = parseImport(String(reader.result))
      if (parsed) {
        dispatch({ type: 'importState', state: parsed })
        onToast('backup importado!')
      } else {
        onToast('arquivo inválido')
      }
    }
    reader.readAsText(f)
    e.target.value = ''
  }

  return (
    <div className="view">
      <header className="topbar">
        <span style={{ width: 40 }} />
        <div className="month-nav">
          <span className="month-label static">menu</span>
        </div>
        <span style={{ width: 40 }} />
      </header>

      <div className="menu">
        <h4 className="section-title">contas bancárias</h4>
        <p className="hint">
          o saldo do app = saldo inicial das contas + todas as movimentações. confira com o banco: hoje o app calcula{' '}
          <strong className={saldoHoje < 0 ? 'neg' : ''}>{fmtBRL(saldoHoje)}</strong>.
        </p>
        <div className="tot-list">
          {state.accounts
            .filter((a) => !a.archived)
            .map((a) => (
              <button key={a.id} className="tot-row clickable" onClick={() => setEditAccount(a)}>
                <span className="tag-swatch big" style={{ background: a.color }} />
                <span className="grow left">{a.name}</span>
                <span className="muted small">inicial {fmtBRL(a.initialBalance)}</span>
              </button>
            ))}
          <button className="tot-row clickable add" onClick={() => setNewAccount(true)}>
            ＋ nova conta
          </button>
        </div>

        <h4 className="section-title">cartões de crédito</h4>
        <p className="hint">
          gastos com cartão não mexem no saldo em conta — quando a fatura vencer, lance o pagamento como <em>saída</em>.
        </p>
        <div className="tot-list">
          {state.cards
            .filter((c) => !c.archived)
            .map((c) => (
              <button key={c.id} className="tot-row clickable" onClick={() => setEditCard(c)}>
                <span className="tag-swatch big" style={{ background: c.color }} />
                <span className="grow left">{c.name}</span>
              </button>
            ))}
          <button className="tot-row clickable add" onClick={() => setNewCard(true)}>
            ＋ novo cartão
          </button>
        </div>

        <h4 className="section-title">meta de economia</h4>
        <label className="form-row boxed">
          <span className="grow">economizar pelo menos (% das entradas)</span>
          <input
            type="number"
            min={0}
            max={100}
            value={state.settings.savingsGoalPct}
            onChange={(e) =>
              dispatch({ type: 'setSettings', settings: { savingsGoalPct: Math.max(0, Math.min(100, Number(e.target.value) || 0)) } })
            }
            style={{ width: 64, textAlign: 'right' }}
          />
          <span>%</span>
        </label>

        <h4 className="section-title">senha de acesso</h4>
        <p className="hint">
          {state.settings.pin
            ? 'o app pede a senha ao abrir neste aparelho.'
            : 'defina uma senha para que só você abra o app neste aparelho.'}
        </p>
        <div className="menu-actions">
          {state.settings.pin ? (
            <>
              <button className="btn" onClick={() => setPinModal('change')}>
                🔒 alterar senha
              </button>
              <button
                className="btn"
                onClick={() => {
                  lockSession()
                  window.location.reload()
                }}
              >
                bloquear agora
              </button>
              <button className="btn danger" onClick={() => setPinModal('remove')}>
                remover senha
              </button>
            </>
          ) : (
            <button className="btn" onClick={() => setPinModal('create')}>
              🔒 criar senha
            </button>
          )}
        </div>

        <h4 className="section-title">backup dos dados</h4>
        <p className="hint">
          os dados ficam salvos neste navegador/aparelho. para levar para outro aparelho (ou guardar por segurança),
          exporte o arquivo e importe lá.
        </p>
        <div className="menu-actions">
          <button className="btn" onClick={download}>
            ⬇️ exportar backup
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            ⬆️ importar backup
          </button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={onImportFile} />
        </div>

        <h4 className="section-title">zona de perigo</h4>
        <button className="btn danger" onClick={() => setConfirmReset(true)}>
          apagar todos os dados
        </button>
      </div>

      {(newAccount || editAccount) && (
        <AccountForm
          account={editAccount ?? undefined}
          onClose={() => {
            setNewAccount(false)
            setEditAccount(null)
          }}
          onSave={(a) => {
            dispatch({ type: 'upsertAccount', account: a })
            onToast('conta salva!')
          }}
          onDelete={
            editAccount && state.accounts.length > 1
              ? () => {
                  dispatch({ type: 'deleteAccount', id: editAccount.id })
                  onToast('conta excluída')
                }
              : undefined
          }
        />
      )}
      {(newCard || editCard) && (
        <CardForm
          card={editCard ?? undefined}
          onClose={() => {
            setNewCard(false)
            setEditCard(null)
          }}
          onSave={(c) => {
            dispatch({ type: 'upsertCard', card: c })
            onToast('cartão salvo!')
          }}
          onDelete={
            editCard
              ? () => {
                  dispatch({ type: 'deleteCard', id: editCard.id })
                  onToast('cartão excluído')
                }
              : undefined
          }
        />
      )}
      {pinModal && (
        <PinForm
          mode={pinModal}
          currentPin={state.settings.pin}
          onClose={() => setPinModal(null)}
          onSet={(pin) => {
            dispatch({ type: 'setSettings', settings: { pin } })
            onToast(pin ? 'senha salva!' : 'senha removida')
          }}
        />
      )}
      {confirmReset && (
        <ConfirmDialog
          title="apagar TODOS os dados do app? essa ação não tem volta (exporte um backup antes)."
          options={[
            {
              label: 'apagar tudo',
              danger: true,
              onClick: () => {
                dispatch({ type: 'reset' })
                onToast('dados apagados')
              },
            },
          ]}
          onClose={() => setConfirmReset(false)}
        />
      )}
    </div>
  )
}

function PinForm({
  mode,
  currentPin,
  onClose,
  onSet,
}: {
  mode: 'create' | 'change' | 'remove'
  currentPin?: { salt: string; hash: string }
  onClose: () => void
  onSet: (pin: { salt: string; hash: string } | undefined) => void
}) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      if (currentPin && !(await verifyPin(current, currentPin))) {
        setError('senha atual incorreta')
        return
      }
      if (mode === 'remove') {
        onSet(undefined)
        onClose()
        return
      }
      if (next.length < 4) {
        setError('a senha precisa de pelo menos 4 caracteres')
        return
      }
      if (next !== confirm) {
        setError('as senhas não conferem')
        return
      }
      const salt = mkSalt()
      onSet({ salt, hash: await hashPin(next, salt) })
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <form className="addmov" onSubmit={submit}>
        <h3 className="modal-title">
          {mode === 'create' ? 'criar senha' : mode === 'change' ? 'alterar senha' : 'remover senha'}
        </h3>
        {currentPin && (
          <label className="form-row">
            <span className="grow bold">senha atual</span>
            <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoFocus />
          </label>
        )}
        {mode !== 'remove' && (
          <>
            <label className="form-row">
              <span className="grow bold">nova senha</span>
              <input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoFocus={!currentPin} />
            </label>
            <label className="form-row">
              <span className="grow bold">repetir senha</span>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </label>
          </>
        )}
        {error && <p className="lock-error">{error}</p>}
        <button className="btn block submit" style={{ background: mode === 'remove' ? '#A3402D' : '#0B3A2A' }} type="submit" disabled={busy}>
          {mode === 'remove' ? 'remover senha' : 'salvar senha'}
        </button>
        <button className="btn block ghost" type="button" onClick={onClose}>
          cancelar
        </button>
      </form>
    </Modal>
  )
}

function AccountForm({
  account,
  onClose,
  onSave,
  onDelete,
}: {
  account?: Account
  onClose: () => void
  onSave: (a: Account) => void
  onDelete?: () => void
}) {
  const [name, setName] = useState(account?.name ?? '')
  const [color, setColor] = useState(account?.color ?? ACCOUNT_COLORS[1])
  const [initial, setInitial] = useState(account?.initialBalance ?? 0)
  const [negative, setNegative] = useState((account?.initialBalance ?? 0) < 0)
  return (
    <Modal onClose={onClose}>
      <div className="addmov">
        <h3 className="modal-title">{account ? 'editar conta' : 'nova conta'}</h3>
        <label className="form-row">
          <span className="row-ico">🏦</span>
          <input className="grow" placeholder="nome (ex: Nubank)" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </label>
        <div className="form-row">
          <ColorPicker colors={ACCOUNT_COLORS} value={color} onChange={setColor} />
        </div>
        <label className="form-row">
          <span className="grow bold">saldo inicial</span>
          <MoneyInput value={Math.abs(initial)} onChange={(v) => setInitial(negative ? -v : v)} />
        </label>
        <label className="form-row">
          <span className="grow">conta está negativa?</span>
          <input
            type="checkbox"
            checked={negative}
            onChange={(e) => {
              setNegative(e.target.checked)
              setInitial((v) => (e.target.checked ? -Math.abs(v) : Math.abs(v)))
            }}
          />
        </label>
        <button
          className="btn block submit"
          style={{ background: '#111' }}
          disabled={!name.trim()}
          onClick={() => {
            onSave({ id: account?.id ?? mkId(), name: name.trim(), color, initialBalance: initial })
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
            excluir conta
          </button>
        )}
        <button className="btn block ghost" onClick={onClose}>
          cancelar
        </button>
      </div>
    </Modal>
  )
}

function CardForm({
  card,
  onClose,
  onSave,
  onDelete,
}: {
  card?: Card
  onClose: () => void
  onSave: (c: Card) => void
  onDelete?: () => void
}) {
  const [name, setName] = useState(card?.name ?? '')
  const [color, setColor] = useState(card?.color ?? ACCOUNT_COLORS[4])
  return (
    <Modal onClose={onClose}>
      <div className="addmov">
        <h3 className="modal-title">{card ? 'editar cartão' : 'novo cartão'}</h3>
        <label className="form-row">
          <span className="row-ico">💳</span>
          <input className="grow" placeholder="nome (ex: Nubank crédito)" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </label>
        <div className="form-row">
          <ColorPicker colors={ACCOUNT_COLORS} value={color} onChange={setColor} />
        </div>
        <button
          className="btn block submit"
          style={{ background: '#6a1fd0' }}
          disabled={!name.trim()}
          onClick={() => {
            onSave({ id: card?.id ?? mkId(), name: name.trim(), color })
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
            excluir cartão
          </button>
        )}
        <button className="btn block ghost" onClick={onClose}>
          cancelar
        </button>
      </div>
    </Modal>
  )
}
