import { CaixaMarcacao } from './CaixaMarcacao'
import { iniciaisDia, hojeISO } from '../utils/data'
import { habitoEditavelNaData } from '../hooks/useHabitosDaSemana'
import type { Habit } from '../types'

function truncar(nome: string, max = 12): string {
  return nome.length > max ? `${nome.slice(0, max - 1)}…` : nome
}

export function GradeSemana({
  dias,
  habitos,
  marcado,
  aoAlternar,
}: {
  dias: string[]
  habitos: Habit[]
  marcado: (habitId: string, dataISO: string) => boolean
  aoAlternar: (habito: Habit, dataISO: string) => void
}) {
  const hoje = hojeISO()

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-fundo px-2 py-2 text-left text-xs font-normal text-texto-fraco">
              Hábito
            </th>
            {dias.map((dia) => (
              <th
                key={dia}
                className={`px-1 py-2 text-xs font-normal capitalize ${
                  dia === hoje ? 'text-texto' : 'text-texto-fraco'
                }`}
              >
                {iniciaisDia(dia)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {habitos.map((habito) => (
            <tr key={habito.id} className="border-t border-borda">
              <td
                className="sticky left-0 z-10 bg-fundo px-2 py-2 text-left"
                title={habito.nome}
              >
                {truncar(habito.nome)}
              </td>
              {dias.map((dia) => {
                const editavel = habitoEditavelNaData(habito, dia)
                const futura = dia > hoje
                if (!editavel) {
                  return (
                    <td key={dia} className="px-1 py-2 text-center text-texto-fraco">
                      —
                    </td>
                  )
                }
                return (
                  <td key={dia} className="px-1 py-2 text-center">
                    <div className="flex justify-center">
                      <CaixaMarcacao
                        tamanho="compacta"
                        marcada={marcado(habito.id, dia)}
                        desabilitada={futura}
                        aoAlternar={() => aoAlternar(habito, dia)}
                      />
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
