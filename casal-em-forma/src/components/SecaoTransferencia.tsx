import { useState } from 'react'
import { BottomSheet } from './BottomSheet'
import {
  calcularTransferencia,
  SaldoInsuficienteError,
  type ResultadoTransferencia,
} from '../domain/pontos'
import type { PessoaPontos } from '../hooks/usePontosDoCasal'
import type { Settings } from '../types'

// "Sai 20 do Gustavo · Chega 10 na Júlia" — voz da seção 6.4 do documento.
function artigoDe(nome: string): string {
  return nome.endsWith('a') ? 'da' : 'do'
}

function artigoEm(nome: string): string {
  return nome.endsWith('a') ? 'na' : 'no'
}

export function SecaoTransferencia({
  pessoas,
  settings,
  aoTransferir,
}: {
  pessoas: PessoaPontos[]
  settings: Settings
  aoTransferir: (
    de: PessoaPontos,
    para: PessoaPontos,
    resultado: ResultadoTransferencia,
  ) => Promise<void>
}) {
  const [aberto, setAberto] = useState(false)
  const [remetenteId, setRemetenteId] = useState(pessoas[0]?.perfil.id ?? '')
  const [pontosStr, setPontosStr] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const remetente = pessoas.find((p) => p.perfil.id === remetenteId) ?? pessoas[0]
  const destinatario = pessoas.find((p) => p.perfil.id !== remetente?.perfil.id)

  const pontos = Number(pontosStr)
  let previa: ResultadoTransferencia | null = null
  let erroCalculo: string | null = null
  if (remetente && Number.isInteger(pontos) && pontos > 0) {
    try {
      previa = calcularTransferencia(remetente.saldo, pontos, settings.pedagio_transferencia)
    } catch (e) {
      erroCalculo =
        e instanceof SaldoInsuficienteError
          ? `Saldo insuficiente. ${remetente.perfil.nome} tem ${remetente.saldo} pontos.`
          : 'Quantidade inválida.'
    }
  }

  async function confirmar() {
    if (!remetente || !destinatario || !previa) return
    setSalvando(true)
    setErro(null)
    try {
      await aoTransferir(remetente, destinatario, previa)
      setAberto(false)
      setPontosStr('')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível transferir.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="mt-6">
      <h2 className="text-sm text-texto-fraco">Transferência</h2>
      <div className="mt-2 rounded-card border border-borda bg-superficie p-3">
        <p className="text-sm text-texto-fraco">
          Pedágio de {Math.round(settings.pedagio_transferencia * 100)}%: quem envia perde o valor
          cheio, quem recebe leva o restante, arredondando para baixo.
        </p>
        <button
          type="button"
          onClick={() => {
            setAberto(true)
            setErro(null)
          }}
          className="mt-3 h-11 w-full rounded-control border border-borda text-base font-medium"
        >
          Transferir pontos
        </button>
      </div>

      <BottomSheet aberto={aberto} titulo="Transferir pontos" aoFechar={() => setAberto(false)}>
        <div className="inline-flex rounded-control border border-borda p-0.5">
          {pessoas.map((pessoa) => {
            const outra = pessoas.find((p) => p.perfil.id !== pessoa.perfil.id)
            const ativa = pessoa.perfil.id === remetente?.perfil.id
            return (
              <button
                key={pessoa.perfil.id}
                type="button"
                onClick={() => setRemetenteId(pessoa.perfil.id)}
                className={`min-h-[44px] rounded-[6px] px-3 text-sm ${
                  ativa ? 'bg-fundo text-texto' : 'text-texto-fraco'
                }`}
              >
                {pessoa.perfil.nome} → {outra?.perfil.nome}
              </button>
            )
          })}
        </div>

        <input
          inputMode="numeric"
          placeholder="Pontos a enviar"
          value={pontosStr}
          onChange={(evento) => setPontosStr(evento.target.value)}
          className="num mt-3 h-11 w-full rounded-control border border-borda bg-fundo px-3 text-base"
        />

        {remetente && (
          <p className="num mt-2 text-sm text-texto-fraco">
            Saldo de {remetente.perfil.nome}: {remetente.saldo} pontos
          </p>
        )}

        {previa && remetente && destinatario && (
          <p className="mt-2 text-sm">
            Sai <span className="num">{previa.pontosEnviados}</span>{' '}
            {artigoDe(remetente.perfil.nome)} {remetente.perfil.nome} · Chega{' '}
            <span className="num">{previa.pontosRecebidos}</span>{' '}
            {artigoEm(destinatario.perfil.nome)} {destinatario.perfil.nome}
          </p>
        )}
        {erroCalculo && <p className="mt-2 text-sm text-julia">{erroCalculo}</p>}
        {erro && <p className="mt-2 text-sm text-julia">{erro}</p>}

        <button
          type="button"
          disabled={salvando || !previa}
          onClick={confirmar}
          className="mt-3 h-11 w-full rounded-control bg-sucesso text-base font-medium text-fundo disabled:opacity-50"
        >
          Transferir pontos
        </button>
      </BottomSheet>
    </div>
  )
}
