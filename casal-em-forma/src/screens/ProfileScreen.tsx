import { useState } from 'react'
import { usePerfis } from '../hooks/usePerfis'
import { useHabitosDoDia } from '../hooks/useHabitosDoDia'
import { CaixaMarcacao } from '../components/CaixaMarcacao'
import { GerenciarHabitosSheet } from '../components/GerenciarHabitosSheet'
import { hojeISO, formatarDataExtensa } from '../utils/data'

export function ProfileScreen({ nome }: { nome: 'Gustavo' | 'Júlia' }) {
  const { porNome, carregando: carregandoPerfis } = usePerfis()
  const perfil = porNome(nome)
  const dataISO = hojeISO()
  const { habitos, marcados, carregando, alternar, recarregar } = useHabitosDoDia(
    perfil?.id,
    dataISO,
  )
  const [gerenciarAberto, setGerenciarAberto] = useState(false)

  if (carregandoPerfis) {
    return <div className="px-4 pb-24 pt-6" />
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
        <h2 className="text-sm text-texto-fraco">Hábitos de hoje</h2>
        <button
          type="button"
          onClick={() => setGerenciarAberto(true)}
          className="text-sm text-texto-fraco underline underline-offset-2"
        >
          Gerenciar hábitos
        </button>
      </div>

      <div className="mt-2 divide-y divide-borda rounded-card border border-borda bg-superficie">
        {!carregando && habitos.length === 0 && (
          <p className="px-4 py-6 text-sm text-texto-fraco">
            Nenhum hábito programado para hoje. Adicione um em "Gerenciar hábitos".
          </p>
        )}
        {habitos.map((habito) => (
          <div key={habito.id} className="flex items-center justify-between px-4 py-2">
            <span className="text-base">{habito.nome}</span>
            <CaixaMarcacao
              marcada={marcados.has(habito.id)}
              aoAlternar={() => alternar(habito)}
            />
          </div>
        ))}
      </div>

      <GerenciarHabitosSheet
        profileId={perfil?.id}
        aberto={gerenciarAberto}
        aoFechar={() => setGerenciarAberto(false)}
        aoMudar={recarregar}
      />
    </div>
  )
}
