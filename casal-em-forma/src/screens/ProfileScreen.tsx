import { useState } from 'react'
import { usePerfis } from '../hooks/usePerfis'
import { useHabitosDoDia } from '../hooks/useHabitosDoDia'
import { useHabitosDaSemana } from '../hooks/useHabitosDaSemana'
import { useModoVisualizacao } from '../hooks/useModoVisualizacao'
import { CaixaMarcacao } from '../components/CaixaMarcacao'
import { GradeSemana } from '../components/GradeSemana'
import { AlternadorModo } from '../components/AlternadorModo'
import { GerenciarHabitosSheet } from '../components/GerenciarHabitosSheet'
import { SecaoPesagens } from '../components/SecaoPesagens'
import {
  hojeISO,
  formatarDataExtensa,
  inicioDaSemanaISO,
  semanaAnteriorISO,
  semanaSeguinteISO,
  formatarIntervaloSemana,
} from '../utils/data'

export function ProfileScreen({ nome }: { nome: 'Gustavo' | 'Júlia' }) {
  const { porNome, carregando: carregandoPerfis } = usePerfis()
  const perfil = porNome(nome)
  const dataISO = hojeISO()
  const { modo, setModo } = useModoVisualizacao()
  const [inicioSemana, setInicioSemana] = useState(() => inicioDaSemanaISO(dataISO))
  const [gerenciarAberto, setGerenciarAberto] = useState(false)

  const modoHoje = useHabitosDoDia(perfil?.id, dataISO)
  const modoSemana = useHabitosDaSemana(perfil?.id, inicioSemana)

  if (carregandoPerfis) {
    return <div className="px-4 pb-24 pt-6" />
  }

  function aoMudarModoOuArquivo() {
    modoHoje.recarregar()
    modoSemana.recarregar()
  }

  return (
    <div className="px-4 pb-24 pt-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">{nome}</h1>
          <p className="mt-1 text-sm capitalize text-texto-fraco">
            {formatarDataExtensa(dataISO)}
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <AlternadorModo modo={modo} aoMudar={setModo} />
        <button
          type="button"
          onClick={() => setGerenciarAberto(true)}
          className="text-sm text-texto-fraco underline underline-offset-2"
        >
          Gerenciar hábitos
        </button>
      </div>

      {modo === 'hoje' ? (
        <div className="mt-4 divide-y divide-borda rounded-card border border-borda bg-superficie">
          {!modoHoje.carregando && modoHoje.habitos.length === 0 && (
            <p className="px-4 py-6 text-sm text-texto-fraco">
              Nenhum hábito programado para hoje. Adicione um em "Gerenciar hábitos".
            </p>
          )}
          {modoHoje.habitos.map((habito) => (
            <div key={habito.id} className="flex items-center justify-between px-4 py-2">
              <span className="text-base">{habito.nome}</span>
              <CaixaMarcacao
                marcada={modoHoje.marcados.has(habito.id)}
                aoAlternar={() => modoHoje.alternar(habito)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setInicioSemana(semanaAnteriorISO(inicioSemana))}
              className="flex h-11 w-11 items-center justify-center text-texto-fraco"
              aria-label="Semana anterior"
            >
              ‹
            </button>
            <span className="num text-sm text-texto-fraco">
              {formatarIntervaloSemana(inicioSemana)}
            </span>
            <button
              type="button"
              onClick={() => setInicioSemana(semanaSeguinteISO(inicioSemana))}
              className="flex h-11 w-11 items-center justify-center text-texto-fraco"
              aria-label="Próxima semana"
            >
              ›
            </button>
          </div>
          <div className="mt-2 rounded-card border border-borda bg-superficie p-2">
            {!modoSemana.carregando && modoSemana.habitos.length === 0 && (
              <p className="px-2 py-6 text-sm text-texto-fraco">
                Nenhum hábito ativo nesta semana.
              </p>
            )}
            {modoSemana.habitos.length > 0 && (
              <GradeSemana
                dias={modoSemana.dias}
                habitos={modoSemana.habitos}
                marcado={modoSemana.marcado}
                aoAlternar={modoSemana.alternar}
              />
            )}
          </div>
        </div>
      )}

      <SecaoPesagens profileId={perfil?.id} corHex={perfil?.cor_hex ?? '#8A9099'} />

      <GerenciarHabitosSheet
        profileId={perfil?.id}
        aberto={gerenciarAberto}
        aoFechar={() => setGerenciarAberto(false)}
        aoMudar={aoMudarModoOuArquivo}
      />
    </div>
  )
}
