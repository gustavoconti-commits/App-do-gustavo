import { useState, type FormEvent } from 'react'
import { entrarComSenha } from '../services/auth'

export function LoginScreen() {
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      await entrarComSenha(senha)
    } catch {
      setErro('Senha incorreta. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6">
      <h1 className="text-2xl font-extrabold">Casal em Forma</h1>
      <form onSubmit={aoEnviar} className="mt-8 w-full max-w-xs">
        <label htmlFor="senha" className="text-sm text-texto-fraco">
          Senha
        </label>
        <input
          id="senha"
          type="password"
          autoComplete="current-password"
          value={senha}
          onChange={(evento) => setSenha(evento.target.value)}
          className="mt-2 h-11 w-full rounded-control border border-borda bg-superficie px-3 text-base text-texto outline-none focus:border-gustavo"
        />
        {erro && <p className="mt-2 text-sm text-julia">{erro}</p>}
        <button
          type="submit"
          disabled={enviando || senha.length === 0}
          className="mt-4 h-11 w-full rounded-control bg-sucesso text-base font-medium text-fundo disabled:opacity-50"
        >
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
