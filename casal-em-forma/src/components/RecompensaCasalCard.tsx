import { useState } from 'react'
import { BottomSheet } from './BottomSheet'
import { CaixaMarcacao } from './CaixaMarcacao'
import { estadoRecompensaCasal, type ResgateParaEscapadas } from '../domain/escapadas'
import type { PessoaPontos } from '../hooks/usePontosDoCasal'
import type { Settings } from '../types'

export function RecompensaCasalCard({
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
  aoResgatar: (envolveComida: boolean, descricao: string) => Promise<void>
}) {
  const [envolveComida, setEnvolveComida] = useState(false)
  const [sheetAberto, setSheetAberto] = useState(false)
  const [descricao, setDescricao] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const custo = settings.custo_tier_casal
  const estado = estadoRecompensaCasal({
    pessoas: pessoas.map((p) => ({
      profileId: p.perfil.id,
      nome: p.perfil.nome,
      saldo: p.saldo,
    })),
    envolveComida,
    custoPorPessoa: custo,
    resgates,
    hojeISO: hoje,
  })

  async function confirmar() {
    if (descricao.trim().length === 0) return
    setSalvando(true)
    setErro(null)
    try {
      await aoResgatar(envolveComida, descricao.trim())
      setSheetAberto(false)
      setDescricao('')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível resgatar.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="mt-6">
      <h2 className="text-sm text-texto-fraco">Recompensa de casal</h2>
      <div className="mt-2 rounded-card border border-borda bg-superficie p-3">
        <p className="num text-base">
          {custo} pts <span className="text-texto-fraco">de cada um</span>
        </p>

        <div className="mt-2 flex items-center gap-1">
          <CaixaMarcacao
            marcada={envolveComida}
            aoAlternar={() => setEnvolveComida((atual) => !atual)}
          />
          <span className="text-sm">Envolve comida</span>
        </div>
        <p className="text-xs text-texto-fraco">
          Se envolver comida, consome a escapada grande dos dois.
        </p>

        {estado.disponivel ? (
          <>
            <p className="mt-2 text-sm text-sucesso">Disponível</p>
            <button
              type="button"
              onClick={() => {
                setSheetAberto(true)
                setErro(null)
              }}
              className="mt-2 h-11 w-full rounded-control bg-sucesso text-base font-medium text-fundo"
            >
              Resgatar
            </button>
          </>
        ) : (
          <div className="mt-2 space-y-1">
            {estado.motivos.map((motivo) => (
              <p key={motivo} className="text-sm text-texto-fraco">
                {motivo}
              </p>
            ))}
          </div>
        )}
      </div>

      <BottomSheet
        aberto={sheetAberto}
        titulo={`Recompensa de casal · ${custo}+${custo} pts`}
        aoFechar={() => setSheetAberto(false)}
      >
        <p className="text-sm text-texto-fraco">
          {envolveComida
            ? 'Envolve comida: consome a escapada grande dos dois neste mês.'
            : 'Sem comida: as escapadas do mês continuam livres.'}
        </p>
        <input
          value={descricao}
          onChange={(evento) => setDescricao(evento.target.value)}
          placeholder='Ex.: "Cinema com jantar"'
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
      </BottomSheet>
    </div>
  )
}
