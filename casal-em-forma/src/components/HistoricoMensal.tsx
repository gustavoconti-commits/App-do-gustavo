import { formatarMesCurto } from '../utils/data'
import type { MonthlyClosing, Profile } from '../types'

export type FechamentoComPerfil = {
  perfil: Profile
  fechamento: MonthlyClosing
}

/** Histórico mensal (seção 9.2, item 9): mês, pessoa, meta, perda,
 *  percentual e bônus pago — só meses já apurados, o corrente fica na prévia. */
export function HistoricoMensal({ itens }: { itens: FechamentoComPerfil[] }) {
  const apurados = itens
    .filter(({ fechamento }) => fechamento.status !== 'previa')
    .sort(
      (a, b) =>
        b.fechamento.ano_mes.localeCompare(a.fechamento.ano_mes) ||
        a.perfil.nome.localeCompare(b.perfil.nome),
    )

  return (
    <div className="mt-6">
      <h2 className="text-sm text-texto-fraco">Histórico mensal</h2>
      {apurados.length === 0 ? (
        <p className="mt-2 rounded-card border border-borda bg-superficie p-3 text-sm text-texto-fraco">
          Nenhum mês fechado ainda. O primeiro fechamento aparece aqui na virada do mês.
        </p>
      ) : (
        <div className="mt-2 divide-y divide-borda rounded-card border border-borda bg-superficie">
          {apurados.map(({ perfil, fechamento }) => (
            <div
              key={fechamento.id}
              className="flex items-center justify-between gap-2 px-3 py-2"
            >
              <div>
                <p className="text-sm">
                  <span className="num">{formatarMesCurto(fechamento.ano_mes)}</span>{' '}
                  <span style={{ color: perfil.cor_hex }}>{perfil.nome}</span>
                </p>
                <p className="num text-xs text-texto-fraco">
                  {fechamento.status === 'insuficiente' && 'Pesagens insuficientes'}
                  {fechamento.status === 'sem_meta' && 'Sem meta cadastrada'}
                  {fechamento.status === 'fechado' &&
                    (fechamento.modo === 'manutencao'
                      ? 'Manutenção'
                      : `meta ${fechamento.meta_kg?.toFixed(2) ?? '—'} kg · perda ${
                          fechamento.perda_kg?.toFixed(2) ?? '—'
                        } kg · ${
                          fechamento.percentual_atingido !== null
                            ? `${(fechamento.percentual_atingido * 100).toFixed(0)}%`
                            : '—'
                        }`)}
                </p>
              </div>
              <p className="num shrink-0 text-sm">+{fechamento.bonus_total}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
