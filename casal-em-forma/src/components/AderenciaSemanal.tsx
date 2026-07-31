import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { habitosDoDia, type HabitoParaPontos } from '../domain/pontos'
import { ultimosSeteDias, iniciaisDia, formatarDataCurta } from '../utils/data'
import type { Habit, HabitLog } from '../types'

export type PessoaAderencia = {
  nome: string
  corHex: string
  habitos: Habit[]
  logs: HabitLog[]
}

function paraDominio(h: Habit): HabitoParaPontos {
  return { id: h.id, diasSemana: h.dias_semana, criadoEm: h.criado_em, arquivadoEm: h.arquivado_em }
}

function aderenciaNoDia(pessoa: PessoaAderencia, dataISO: string): number {
  const programados = habitosDoDia(pessoa.habitos.map(paraDominio), dataISO)
  if (programados.length === 0) return 0
  const marcados = new Set(pessoa.logs.filter((l) => l.data === dataISO).map((l) => l.habit_id))
  const feitos = programados.filter((h) => marcados.has(h.id)).length
  return Math.round((feitos / programados.length) * 100)
}

/** Aderência de hábitos dos últimos 7 dias — barras agrupadas por pessoa. */
export function AderenciaSemanal({
  pessoas,
  hoje,
}: {
  pessoas: PessoaAderencia[]
  hoje: string
}) {
  const dias = ultimosSeteDias(hoje)
  const dados = dias.map((dia) => {
    const linha: Record<string, number | string> = { dia, rotulo: iniciaisDia(dia) }
    pessoas.forEach((pessoa, i) => {
      linha[`aderencia${i}`] = aderenciaNoDia(pessoa, dia)
    })
    return linha
  })

  return (
    <div className="mt-6">
      <h2 className="text-sm text-texto-fraco">Aderência de hábitos · últimos 7 dias</h2>
      <div className="mt-2 h-44 w-full rounded-card border border-borda bg-superficie p-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dados} margin={{ top: 8, right: 4, bottom: 0, left: -24 }}>
            <CartesianGrid stroke="#24272E" vertical={false} />
            <XAxis dataKey="rotulo" stroke="#8A9099" fontSize={11} tickLine={false} />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 50, 100]}
              stroke="#8A9099"
              fontSize={11}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: '#24272E', opacity: 0.4 }}
              contentStyle={{
                background: '#16181D',
                border: '1px solid #24272E',
                borderRadius: 8,
                fontSize: 13,
              }}
              labelFormatter={(_, itens) => {
                const dia = itens?.[0]?.payload?.dia
                return dia ? formatarDataCurta(String(dia)) : ''
              }}
              formatter={(valor: number, nome: string) => [`${valor}%`, nome]}
            />
            {pessoas.map((pessoa, i) => (
              <Bar
                key={pessoa.nome}
                dataKey={`aderencia${i}`}
                name={pessoa.nome}
                fill={pessoa.corHex}
                radius={[2, 2, 0, 0]}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
