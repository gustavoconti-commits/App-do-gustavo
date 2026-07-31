import type { Profile } from '../types'

export type LinhaComparativa = {
  perfil: Profile
  pesoInicialKg: number | null
  pesoAtualKg: number | null
  pontosDoMes: number
}

/** Tabela comparativa (seção 9.2, item 8): rolagem horizontal com a coluna
 *  de nome fixa, no mesmo padrão da GradeSemana. */
export function TabelaComparativa({ linhas }: { linhas: LinhaComparativa[] }) {
  return (
    <div className="mt-6">
      <h2 className="text-sm text-texto-fraco">Comparativo</h2>
      <div className="mt-2 overflow-x-auto rounded-card border border-borda bg-superficie">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-superficie px-3 py-2 text-left text-xs font-normal text-texto-fraco">
                Pessoa
              </th>
              {['Peso inicial', 'Atual', 'Variação kg', 'Variação %', 'Pontos do mês'].map(
                (titulo) => (
                  <th
                    key={titulo}
                    className="px-3 py-2 text-right text-xs font-normal text-texto-fraco"
                  >
                    {titulo}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {linhas.map(({ perfil, pesoInicialKg, pesoAtualKg, pontosDoMes }) => {
              const variacao =
                pesoInicialKg !== null && pesoAtualKg !== null ? pesoAtualKg - pesoInicialKg : null
              const variacaoPct =
                variacao !== null && pesoInicialKg ? (variacao / pesoInicialKg) * 100 : null
              return (
                <tr key={perfil.id} className="border-t border-borda">
                  <td
                    className="sticky left-0 z-10 bg-superficie px-3 py-2 text-left"
                    style={{ color: perfil.cor_hex }}
                  >
                    {perfil.nome}
                  </td>
                  <td className="num px-3 py-2 text-right">
                    {pesoInicialKg !== null ? `${pesoInicialKg.toFixed(1)} kg` : '—'}
                  </td>
                  <td className="num px-3 py-2 text-right">
                    {pesoAtualKg !== null ? `${pesoAtualKg.toFixed(1)} kg` : '—'}
                  </td>
                  <td className="num px-3 py-2 text-right">
                    {variacao !== null
                      ? `${variacao > 0 ? '+' : ''}${variacao.toFixed(1)} kg`
                      : '—'}
                  </td>
                  <td className="num px-3 py-2 text-right">
                    {variacaoPct !== null
                      ? `${variacaoPct > 0 ? '+' : ''}${variacaoPct.toFixed(1)}%`
                      : '—'}
                  </td>
                  <td className="num px-3 py-2 text-right">{pontosDoMes}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
