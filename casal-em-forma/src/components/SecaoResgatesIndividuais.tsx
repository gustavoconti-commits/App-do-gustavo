import { useState } from 'react'
import { BottomSheet } from './BottomSheet'
import {
  estadoEscapada,
  textoEstadoEscapada,
  NOME_CATEGORIA_RESGATE,
  type ResgateParaEscapadas,
} from '../domain/escapadas'
import type { PessoaPontos } from '../hooks/usePontosDoCasal'
import type { RedemptionCategoria, Settings } from '../types'

type CategoriaIndividual = Exclude<RedemptionCategoria, 'casal'>

type ItemCatalogo = { categoria: CategoriaIndividual; custo: number }

type ResgatePendente = { pessoa: PessoaPontos; item: ItemCatalogo }

function catalogo(settings: Settings): ItemCatalogo[] {
  return [
    { categoria: 'pequena', custo: settings.custo_tier_pequena },
    { categoria: 'media', custo: settings.custo_tier_media },
    { categoria: 'escapada_pequena', custo: settings.custo_escapada_pequena },
    { categoria: 'escapada_grande', custo: settings.custo_escapada_grande },
  ]
}

export function SecaoResgatesIndividuais({
  pessoas,
  resgates,
  settings,
  hoje,
  aoResgatar,
}: {
  pessoas: PessoaPontos[]
  resgates: ResgateParaEscapadas[]
  settings: Settings
  hoje: string
  aoResgatar: (
    pessoa: PessoaPontos,
    categoria: CategoriaIndividual,
    custo: number,
    descricao: string,
  ) => Promise<void>
}) {
  const [pendente, setPendente] = useState<ResgatePendente | null>(null)
  const [descricao, setDescricao] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  function abrirSheet(pessoa: PessoaPontos, item: ItemCatalogo) {
    setPendente({ pessoa, item })
    setDescricao('')
    setErro(null)
  }

  async function confirmar() {
    if (!pendente || descricao.trim().length === 0) return
    setSalvando(true)
    setErro(null)
    try {
      await aoResgatar(
        pendente.pessoa,
        pendente.item.categoria,
        pendente.item.custo,
        descricao.trim(),
      )
      setPendente(null)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível resgatar.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="mt-6">
      <h2 className="text-sm text-texto-fraco">Resgates individuais</h2>
      <div className="mt-2 space-y-3">
        {pessoas.map((pessoa) => (
          <div
            key={pessoa.perfil.id}
            className="rounded-card border border-borda bg-superficie p-3"
          >
            <p className="text-sm font-semibold" style={{ color: pessoa.perfil.cor_hex }}>
              {pessoa.perfil.nome}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {catalogo(settings).map((item) => {
                const ehEscapada =
                  item.categoria === 'escapada_pequena' || item.categoria === 'escapada_grande'
                const estado = ehEscapada
                  ? estadoEscapada({
                      resgates,
                      profileId: pessoa.perfil.id,
                      categoria: item.categoria as 'escapada_pequena' | 'escapada_grande',
                      custo: item.custo,
                      saldo: pessoa.saldo,
                      hojeISO: hoje,
                    })
                  : pessoa.saldo < item.custo
                    ? ({ estado: 'sem_saldo', faltam: item.custo - pessoa.saldo } as const)
                    : ({ estado: 'disponivel' } as const)
                const texto = ehEscapada
                  ? textoEstadoEscapada(
                      item.categoria as 'escapada_pequena' | 'escapada_grande',
                      estado,
                    )
                  : estado.estado === 'sem_saldo'
                    ? `Faltam ${estado.faltam} pontos`
                    : 'Resgatar'
                const disponivel = estado.estado === 'disponivel'
                return (
                  <div
                    key={item.categoria}
                    className="rounded-control border border-borda p-2"
                  >
                    <p className="text-xs text-texto-fraco">
                      {NOME_CATEGORIA_RESGATE[item.categoria]}
                    </p>
                    <p className="num text-base">{item.custo} pts</p>
                    <button
                      type="button"
                      disabled={!disponivel}
                      onClick={() => abrirSheet(pessoa, item)}
                      className={`mt-2 min-h-[44px] w-full rounded-control px-2 text-xs font-medium ${
                        disponivel
                          ? 'bg-sucesso text-fundo'
                          : 'border border-borda text-texto-fraco'
                      }`}
                    >
                      {texto}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <BottomSheet
        aberto={pendente !== null}
        titulo={
          pendente
            ? `${NOME_CATEGORIA_RESGATE[pendente.item.categoria]} · ${pendente.item.custo} pts`
            : ''
        }
        aoFechar={() => setPendente(null)}
      >
        {pendente && (
          <div>
            <p className="text-sm text-texto-fraco">
              Resgate de {pendente.pessoa.perfil.nome}. Descreva em poucas palavras o que foi.
            </p>
            <input
              value={descricao}
              onChange={(evento) => setDescricao(evento.target.value)}
              placeholder='Ex.: "Rodízio de pizza"'
              className="mt-3 h-11 w-full rounded-control border border-borda bg-fundo px-3 text-base"
            />
            {erro && <p className="mt-2 text-sm text-julia">{erro}</p>}
            <button
              type="button"
              disabled={salvando || descricao.trim().length === 0}
              onClick={confirmar}
              className="mt-3 h-11 w-full rounded-control bg-sucesso text-base font-medium text-fundo disabled:opacity-50"
            >
              Resgatar
            </button>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
