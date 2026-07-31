import { useState } from 'react'
import { BottomSheet } from './BottomSheet'
import { formatarReais } from '../utils/formato'
import type { PessoaPontos } from '../hooks/usePontosDoCasal'

export function SecaoCofrinho({
  pessoas,
  aoSacar,
}: {
  pessoas: PessoaPontos[]
  aoSacar: (pessoa: PessoaPontos, valorReais: number, descricao: string) => Promise<void>
}) {
  const [aberto, setAberto] = useState(false)
  const [pessoaId, setPessoaId] = useState(pessoas[0]?.perfil.id ?? '')
  const [valorStr, setValorStr] = useState('')
  const [descricao, setDescricao] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const somaCasal = pessoas.reduce((soma, p) => soma + p.cofrinho, 0)
  const pessoa = pessoas.find((p) => p.perfil.id === pessoaId) ?? pessoas[0]
  const valor = Number(valorStr.replace(',', '.'))

  async function confirmar() {
    if (!pessoa || !valor || valor <= 0) return
    if (valor > pessoa.cofrinho) {
      setErro(
        `O cofrinho de ${pessoa.perfil.nome} tem ${formatarReais(pessoa.cofrinho)}.`,
      )
      return
    }
    setSalvando(true)
    setErro(null)
    try {
      await aoSacar(pessoa, valor, descricao.trim())
      setAberto(false)
      setValorStr('')
      setDescricao('')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível registrar o saque.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="mt-6">
      <h2 className="text-sm text-texto-fraco">Cofrinho</h2>
      <div className="mt-2 rounded-card border border-borda bg-superficie p-3">
        <div className="grid grid-cols-3 gap-2">
          {pessoas.map((p) => (
            <div key={p.perfil.id}>
              <p className="text-xs text-texto-fraco">{p.perfil.nome}</p>
              <p className="num text-base">{formatarReais(p.cofrinho)}</p>
            </div>
          ))}
          <div>
            <p className="text-xs text-texto-fraco">Casal</p>
            <p className="num text-base">{formatarReais(somaCasal)}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setAberto(true)
            setErro(null)
          }}
          className="mt-3 h-11 w-full rounded-control border border-borda text-base font-medium"
        >
          Registrar saque
        </button>
      </div>

      <BottomSheet aberto={aberto} titulo="Registrar saque" aoFechar={() => setAberto(false)}>
        <div className="inline-flex rounded-control border border-borda p-0.5">
          {pessoas.map((p) => (
            <button
              key={p.perfil.id}
              type="button"
              onClick={() => setPessoaId(p.perfil.id)}
              className={`min-h-[44px] rounded-[6px] px-3 text-sm ${
                p.perfil.id === pessoa?.perfil.id ? 'bg-fundo text-texto' : 'text-texto-fraco'
              }`}
            >
              {p.perfil.nome}
            </button>
          ))}
        </div>

        {pessoa && (
          <p className="num mt-2 text-sm text-texto-fraco">
            Disponível: {formatarReais(pessoa.cofrinho)}
          </p>
        )}

        <input
          inputMode="decimal"
          placeholder="Valor (R$)"
          value={valorStr}
          onChange={(evento) => setValorStr(evento.target.value)}
          className="num mt-3 h-11 w-full rounded-control border border-borda bg-fundo px-3 text-base"
        />
        <input
          value={descricao}
          onChange={(evento) => setDescricao(evento.target.value)}
          placeholder="Descrição (opcional)"
          className="mt-2 h-11 w-full rounded-control border border-borda bg-fundo px-3 text-base"
        />
        {erro && <p className="mt-2 text-sm text-julia">{erro}</p>}
        <button
          type="button"
          disabled={salvando || !valor || valor <= 0}
          onClick={confirmar}
          className="mt-3 h-11 w-full rounded-control bg-sucesso text-base font-medium text-fundo disabled:opacity-50"
        >
          Registrar saque
        </button>
      </BottomSheet>
    </div>
  )
}
