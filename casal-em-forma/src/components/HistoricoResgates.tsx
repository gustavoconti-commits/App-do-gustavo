import { NOME_CATEGORIA_RESGATE } from '../domain/escapadas'
import { formatarDataCurta } from '../utils/data'
import type { Redemption } from '../types'

export function HistoricoResgates({
  resgates,
  nomePorPerfil,
}: {
  resgates: Redemption[]
  nomePorPerfil: (profileId: string | null) => string
}) {
  return (
    <div className="mt-6">
      <h2 className="text-sm text-texto-fraco">Histórico de resgates</h2>
      {resgates.length === 0 ? (
        <p className="mt-2 rounded-card border border-borda bg-superficie p-3 text-sm text-texto-fraco">
          Nenhum resgate ainda. O primeiro aparece aqui.
        </p>
      ) : (
        <div className="mt-2 divide-y divide-borda rounded-card border border-borda bg-superficie">
          {resgates.map((resgate) => (
            <div key={resgate.id} className="flex items-center justify-between gap-2 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm">{resgate.descricao}</p>
                <p className="num text-xs text-texto-fraco">
                  {formatarDataCurta(resgate.data)} · {nomePorPerfil(resgate.profile_id)} ·{' '}
                  {NOME_CATEGORIA_RESGATE[resgate.categoria]}
                </p>
              </div>
              <p className="num shrink-0 text-sm">
                -{resgate.pontos_gastos}
                {resgate.escopo === 'casal' && (
                  <span className="text-xs text-texto-fraco"> cada</span>
                )}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
