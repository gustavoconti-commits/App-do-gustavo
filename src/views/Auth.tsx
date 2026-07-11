import React, { useState } from 'react'
import { supabase } from '../cloud'
import { SITE_URL } from '../config'
import { ApiceSymbol, Wordmark } from '../components/Brand'

type Mode = 'login' | 'signup' | 'forgot'

function translateError(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login credentials')) return 'e-mail ou senha incorretos'
  if (m.includes('email not confirmed')) return 'confirme seu e-mail antes de entrar (veja sua caixa de entrada)'
  if (m.includes('user already registered')) return 'este e-mail já tem cadastro — use "entrar"'
  if (m.includes('password should be at least')) return 'a senha precisa de pelo menos 6 caracteres'
  if (m.includes('unable to validate email') || m.includes('invalid email')) return 'e-mail inválido'
  if (m.includes('rate limit') || m.includes('too many')) return 'muitas tentativas — aguarde um instante'
  if (m.includes('failed to fetch') || m.includes('network')) return 'sem conexão — verifique sua internet'
  return msg
}

// Cadastro travado pelo gatilho enforce_allowed_email (e-mail não pagou ainda).
// O GoTrue devolve esse bloqueio como erro 500 genérico — a supabase-js trata
// qualquer 500 como "falha de rede" e zera o texto da mensagem (vira "{}"),
// então o único jeito confiável de reconhecer o caso é pelo status HTTP.
function isBlockedSignup(error: { message: string; status?: number }): boolean {
  if (error.status === 500) return true
  const m = error.message.toLowerCase()
  return m.includes('not_allowed') || m.includes('database error saving new user')
}

export function AuthView({ onDemo }: { onDemo: () => void }) {
  const [mode, setMode] = useState<Mode>('login')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [blocked, setBlocked] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setError('')
    setNotice('')
    setBlocked(false)
    setBusy(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) setError(translateError(error.message))
        // sucesso: o App troca de tela sozinho via onAuthStateChange
      } else if (mode === 'signup') {
        if (fullName.trim().length < 3) {
          setError('informe seu nome completo')
          return
        }
        if (password.length < 6) {
          setError('a senha precisa de pelo menos 6 caracteres')
          return
        }
        if (password !== confirm) {
          setError('as senhas não conferem')
          return
        }
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: SITE_URL,
            data: { full_name: fullName.trim(), phone: phone.trim() },
          },
        })
        if (error) {
          if (isBlockedSignup(error)) setBlocked(true)
          else setError(translateError(error.message))
        } else if (!data.session) {
          setNotice('cadastro criado! enviamos um link de confirmação para o seu e-mail — confirme e depois entre.')
          setMode('login')
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: SITE_URL })
        if (error) setError(translateError(error.message))
        else {
          setNotice('se este e-mail tiver cadastro, você vai receber um link para redefinir a senha.')
          setMode('login')
        }
      }
    } catch (err: any) {
      setError(translateError(String(err?.message || err)))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="lock-screen">
      <div className="lock-card">
        <ApiceSymbol width={64} />
        <Wordmark size={28} />
        <p className="lock-sub">controle financeiro</p>

        <div className="auth-tabs">
          <button className={`auth-tab${mode === 'login' ? ' sel' : ''}`} onClick={() => { setMode('login'); setError(''); setNotice('') }}>
            entrar
          </button>
          <button className={`auth-tab${mode === 'signup' ? ' sel' : ''}`} onClick={() => { setMode('signup'); setError(''); setNotice('') }}>
            criar conta
          </button>
        </div>

        <form onSubmit={submit} className="lock-form">
          {mode === 'signup' && (
            <>
              <input
                type="text"
                placeholder="nome completo"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <input
                type="tel"
                placeholder="telefone (com DDD)"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </>
          )}
          <input
            type="email"
            placeholder="e-mail"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {mode !== 'forgot' && (
            <input
              type="password"
              placeholder="senha"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
          {mode === 'signup' && (
            <input
              type="password"
              placeholder="repetir senha"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          )}
          <button className="btn gold" type="submit" disabled={busy}>
            {busy ? 'aguarde…' : mode === 'login' ? 'entrar' : mode === 'signup' ? 'criar conta' : 'enviar link de recuperação'}
          </button>
        </form>

        {blocked && (
          <p className="lock-error">
            <a href="#comprar">Quer acesso vitalício ao App de Controle Financeiro? Clique aqui!</a>
          </p>
        )}
        {!blocked && error && <p className="lock-error">{error}</p>}
        {notice && <p className="lock-notice">{notice}</p>}

        {mode === 'login' && (
          <button className="auth-link" onClick={() => { setMode('forgot'); setError(''); setNotice('') }}>
            esqueci minha senha
          </button>
        )}
        {mode === 'forgot' && (
          <button className="auth-link" onClick={() => setMode('login')}>
            voltar para o login
          </button>
        )}

        <button className="auth-link demo" onClick={onDemo}>
          👀 só quero ver: entrar sem conta (modo demonstração)
        </button>

        <p className="lock-hint">
          seus dados ficam na sua conta, protegidos por senha — entre em qualquer aparelho e eles estarão lá. no modo
          demonstração, os dados ficam só neste aparelho e passam para a sua conta quando você se cadastrar.
        </p>
      </div>
    </div>
  )
}

// Formulário de nova senha após o link de recuperação (usuário já autenticado).
export function NewPasswordForm({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setError('')
    if (password.length < 6) {
      setError('a senha precisa de pelo menos 6 caracteres')
      return
    }
    if (password !== confirm) {
      setError('as senhas não conferem')
      return
    }
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) setError(translateError(error.message))
    else onDone()
  }

  return (
    <div className="lock-screen">
      <div className="lock-card">
        <ApiceSymbol width={64} />
        <Wordmark size={28} />
        <p className="lock-sub">definir nova senha</p>
        <form onSubmit={submit} className="lock-form">
          <input type="password" placeholder="nova senha" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} />
          <input type="password" placeholder="repetir senha" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <button className="btn gold" type="submit" disabled={busy}>
            salvar senha
          </button>
        </form>
        {error && <p className="lock-error">{error}</p>}
      </div>
    </div>
  )
}
