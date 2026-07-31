import { formatarDataCurta } from '../utils/data'
import { formatarReais } from '../utils/formato'
import type { PiggyWithdrawal, Transfer } from '../types'

export function HistoricoTransferenciasSaques({
  transferencias,
  saques,
  nomePorPerfil,
}: {
  transferencias: Transfer[]
  saques: PiggyWithdrawal[]
  nomePorPerfil: (profileId: string | null) => string
}) {
  return (
    <div className="mt-6">
      <h2 className="text-sm text-texto-fraco">Transferências e saques</h2>

      {transferencias.length === 0 && saques.length === 0 ? (
        <p className="mt-2 rounded-card border border-borda bg-superficie p-3 text-sm text-texto-fraco">
          Nenhuma transferência ou saque ainda.
        </p>
      ) : (
        <div className="mt-2 space-y-2">
          {transferencias.length > 0 && (
            <div className="divide-y divide-borda rounded-card border border-borda bg-superficie">
              {transferencias.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-2 px-3 py-2">
                  <div>
                    <p className="text-sm">
                      {nomePorPerfil(t.de_profile_id)} → {nomePorPerfil(t.para_profile_id)}
                    </p>
                    <p className="num text-xs text-texto-fraco">{formatarDataCurta(t.data)}</p>
                  </div>
                  <p className="num shrink-0 text-sm">
                    -{t.pontos_enviados} → +{t.pontos_recebidos}
                  </p>
                </div>
              ))}
            </div>
          )}

          {saques.length > 0 && (
            <div className="divide-y divide-borda rounded-card border border-borda bg-superficie">
              {saques.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-2 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm">
                      Saque · {nomePorPerfil(s.profile_id)}
                      {s.descricao ? ` · ${s.descricao}` : ''}
                    </p>
                    <p className="num text-xs text-texto-fraco">{formatarDataCurta(s.data)}</p>
                  </div>
                  <p className="num shrink-0 text-sm">-{formatarReais(s.valor_reais)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
