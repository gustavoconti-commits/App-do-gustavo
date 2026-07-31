import type { PessoaPontos } from '../hooks/usePontosDoCasal'
import type { Settings } from '../types'

type Faixa = { rotulo: string; custo: number }

function faixasOrdenadas(settings: Settings): Faixa[] {
  return [
    { rotulo: 'Recompensa pequena', custo: settings.custo_tier_pequena },
    { rotulo: 'Escapada pequena', custo: settings.custo_escapada_pequena },
    { rotulo: 'Recompensa média', custo: settings.custo_tier_media },
    { rotulo: 'Recompensa de casal', custo: settings.custo_tier_casal },
    { rotulo: 'Escapada grande', custo: settings.custo_escapada_grande },
  ].sort((a, b) => a.custo - b.custo)
}

/** Barra até a faixa seguinte de recompensa, por pessoa (seção 9.4, item 3). */
export function ProgressoProximaRecompensa({
  pessoas,
  settings,
}: {
  pessoas: PessoaPontos[]
  settings: Settings
}) {
  const faixas = faixasOrdenadas(settings)

  return (
    <div className="mt-6">
      <h2 className="text-sm text-texto-fraco">Próxima recompensa</h2>
      <div className="mt-2 space-y-3 rounded-card border border-borda bg-superficie p-3">
        {pessoas.map((pessoa) => {
          const proxima = faixas.find((f) => f.custo > pessoa.saldo) ?? null
          const alvo = proxima ?? faixas[faixas.length - 1]
          const fracao = Math.min(1, Math.max(0, pessoa.saldo / alvo.custo))
          return (
            <div key={pessoa.perfil.id}>
              <div className="flex items-baseline justify-between">
                <p className="text-sm" style={{ color: pessoa.perfil.cor_hex }}>
                  {pessoa.perfil.nome}
                </p>
                <p className="num text-xs text-texto-fraco">
                  {proxima
                    ? `Faltam ${proxima.custo - pessoa.saldo} para ${proxima.rotulo.toLowerCase()}`
                    : 'Todas as faixas ao alcance'}
                </p>
              </div>
              <div className="mt-1 h-2 rounded-full bg-borda">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${fracao * 100}%`,
                    backgroundColor: pessoa.perfil.cor_hex,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
