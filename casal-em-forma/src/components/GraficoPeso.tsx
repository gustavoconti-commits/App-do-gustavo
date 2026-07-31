import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatarDataCurta } from '../utils/data'
import type { WeighIn } from '../types'

export function GraficoPeso({ pesagens, corHex }: { pesagens: WeighIn[]; corHex: string }) {
  if (pesagens.length === 0) {
    return (
      <p className="px-2 py-8 text-center text-sm text-texto-fraco">
        Nenhuma pesagem ainda. Registre a primeira para começar o gráfico.
      </p>
    )
  }

  const dados = pesagens.map((p) => ({ data: p.data, peso: p.peso_kg }))

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dados} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
          <CartesianGrid stroke="#24272E" vertical={false} />
          <XAxis
            dataKey="data"
            tickFormatter={formatarDataCurta}
            stroke="#8A9099"
            fontSize={11}
            tickLine={false}
          />
          <YAxis
            domain={['dataMin - 1', 'dataMax + 1']}
            stroke="#8A9099"
            fontSize={11}
            tickLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={{
              background: '#16181D',
              border: '1px solid #24272E',
              borderRadius: 8,
              fontSize: 13,
            }}
            labelFormatter={(valor) => formatarDataCurta(String(valor))}
            formatter={(valor: number) => [`${valor} kg`, 'Peso']}
          />
          <Line
            type="monotone"
            dataKey="peso"
            stroke={corHex}
            strokeWidth={2}
            dot={{ r: 3, fill: corHex }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
