import { useState } from 'react'
import { BottomSheet } from './BottomSheet'
import { SeletorDiasSemana } from './SeletorDiasSemana'
import { useGerenciarHabitos } from '../hooks/useGerenciarHabitos'

const TODOS_OS_DIAS = [1, 2, 3, 4, 5, 6, 7]

export function GerenciarHabitosSheet({
  profileId,
  aberto,
  aoFechar,
  aoMudar,
}: {
  profileId: string | undefined
  aberto: boolean
  aoFechar: () => void
  aoMudar: () => void
}) {
  const { habitos, adicionar, renomear, definirDias, arquivar, erro } =
    useGerenciarHabitos(profileId)
  const [nomeNovo, setNomeNovo] = useState('')
  const [diasNovo, setDiasNovo] = useState<number[]>(TODOS_OS_DIAS)
  const [edicaoId, setEdicaoId] = useState<string | null>(null)

  function alternarDiaNovo(dia: number) {
    setDiasNovo((atual) =>
      atual.includes(dia) ? atual.filter((d) => d !== dia) : [...atual, dia].sort(),
    )
  }

  async function aoSalvarNovo() {
    if (nomeNovo.trim().length === 0 || diasNovo.length === 0) return
    await adicionar(nomeNovo.trim(), diasNovo)
    setNomeNovo('')
    setDiasNovo(TODOS_OS_DIAS)
    aoMudar()
  }

  return (
    <BottomSheet aberto={aberto} titulo="Gerenciar hábitos" aoFechar={aoFechar}>
      <div className="space-y-4">
        {habitos.length >= 5 && (
          <p className="text-sm text-texto-fraco">
            Limite de 5 hábitos ativos atingido. Arquive um antes de criar outro.
          </p>
        )}

        {habitos.map((habito) => (
          <div key={habito.id} className="rounded-card border border-borda p-3">
            {edicaoId === habito.id ? (
              <input
                autoFocus
                defaultValue={habito.nome}
                onBlur={async (evento) => {
                  const novoNome = evento.target.value.trim()
                  if (novoNome && novoNome !== habito.nome) await renomear(habito.id, novoNome)
                  setEdicaoId(null)
                  aoMudar()
                }}
                className="h-11 w-full rounded-control border border-borda bg-fundo px-2 text-base"
              />
            ) : (
              <button
                type="button"
                className="text-left text-base"
                onClick={() => setEdicaoId(habito.id)}
              >
                {habito.nome}
              </button>
            )}
            <div className="mt-2">
              <SeletorDiasSemana
                selecionados={habito.dias_semana}
                aoAlternar={async (dia) => {
                  const novosDias = habito.dias_semana.includes(dia)
                    ? habito.dias_semana.filter((d) => d !== dia)
                    : [...habito.dias_semana, dia].sort()
                  if (novosDias.length === 0) return
                  await definirDias(habito.id, novosDias)
                  aoMudar()
                }}
              />
            </div>
            <button
              type="button"
              onClick={async () => {
                await arquivar(habito.id)
                aoMudar()
              }}
              className="mt-2 text-sm text-julia"
            >
              Arquivar
            </button>
          </div>
        ))}

        {habitos.length < 5 && (
          <div className="rounded-card border border-borda border-dashed p-3">
            <p className="text-sm text-texto-fraco">Novo hábito</p>
            <input
              value={nomeNovo}
              onChange={(evento) => setNomeNovo(evento.target.value)}
              placeholder="Nome do hábito"
              className="mt-2 h-11 w-full rounded-control border border-borda bg-fundo px-3 text-base"
            />
            <div className="mt-2">
              <SeletorDiasSemana selecionados={diasNovo} aoAlternar={alternarDiaNovo} />
            </div>
            {erro && <p className="mt-2 text-sm text-julia">{erro}</p>}
            <button
              type="button"
              onClick={aoSalvarNovo}
              disabled={nomeNovo.trim().length === 0 || diasNovo.length === 0}
              className="mt-3 h-11 w-full rounded-control bg-sucesso text-base font-medium text-fundo disabled:opacity-50"
            >
              Adicionar hábito
            </button>
          </div>
        )}
      </div>
    </BottomSheet>
  )
}
