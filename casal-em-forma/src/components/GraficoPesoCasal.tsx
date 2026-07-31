import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { linhaDeReferencia } from '../domain/metas'
import { formatarDataCurta, diasAtrasISO } from '../utils/data'
import type { AnnualGoal, WeighIn } from '../types'

export type SeriePeso = {
  nome: string
  corHex: string
  pesagens: WeighIn[]
  meta: AnnualGoal | null
}

type Filtro = '30d' | '90d' | 'ano'

const FILTROS: { id: Filtro; rotulo: string }[] = [
  { id: '30d', rotulo: '30d' },
  { id: '90d', rotulo: '90d' },
  { id: 'ano', rotulo: 'Ano' },
]

/** Evolução de peso do casal: duas linhas de pesagem + duas linhas tracejadas
 *  de meta (linha de referência linear da seção 8.2), filtro 30d/90d/ano. */
export function GraficoPesoCasal({ series, hoje }: { series: SeriePeso[]; hoje: string }) {
  const [filtro, setFiltro] = useState<Filtro>('90d')

  const ano = Number(hoje.slice(0, 4))
  const inicio =
    filtro === '30d'
      ? diasAtrasISO(hoje, 30)
      : filtro === '90d'
        ? diasAtrasISO(hoje, 90)
        : `${ano}-01-01`

  const datas = new Set<string>([inicio, hoje])
  for (const serie of series) {
    for (const p of serie.pesagens) {
      if (p.data >= inicio && p.data <= hoje) datas.add(p.data)
    }
  }

  const dados = [...datas].sort().map((data) => {
    const linha: Record<string, number | string | null> = { data }
    series.forEach((serie, i) => {
      const pesagem = serie.pesagens.find((p) => p.data === data)
      linha[`peso${i}`] = pesagem ? pesagem.peso_kg : null
      linha[`meta${i}`] = serie.meta
        ? Number(
            linhaDeReferencia(serie.meta.peso_base_kg, serie.meta.peso_alvo_kg, data, ano).toFixed(
              2,
            ),
          )
        : null
    })
    return linha
  })

  const temPesagem = series.some((s) => s.pesagens.some((p) => p.data >= inicio && p.data <= hoje))

  return (
    <div className="mt-2 rounded-card border border-borda bg-superficie p-3">
      <div className="flex justify-end">
        <div className="inline-flex rounded-control border border-borda p-0.5">
          {FILTROS.map((opcao) => (
            <button
              key={opcao.id}
              type="button"
              onClick={() => setFiltro(opcao.id)}
              className={`min-h-[36px] rounded-[6px] px-3 text-sm ${
                filtro === opcao.id ? 'bg-fundo text-texto' : 'text-texto-fraco'
              }`}
            >
              {opcao.rotulo}
            </button>
          ))}
        </div>
      </div>

      {!temPesagem ? (
        <p className="px-2 py-8 text-center text-sm text-texto-fraco">
          Nenhuma pesagem no período. Registre pesagens para começar o gráfico.
        </p>
      ) : (
        <div className="mt-2 h-56 w-full">
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
                formatter={(valor: number, nome: string) => [`${valor} kg`, nome]}
              />
              {series.map((serie, i) => (
                <Line
                  key={`meta${i}`}
                  type="monotone"
                  dataKey={`meta${i}`}
                  name={`Meta ${serie.nome}`}
                  stroke="#8A9099"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  dot={false}
                  connectNulls
                />
              ))}
              {series.map((serie, i) => (
                <Line
                  key={`peso${i}`}
                  type="monotone"
                  dataKey={`peso${i}`}
                  name={serie.nome}
                  stroke={serie.corHex}
                  strokeWidth={2}
                  dot={{ r: 3, fill: serie.corHex }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
