import { useFechamentoDoMes } from '../hooks/useFechamentoDoMes'

export function SecaoMetaMes({ profileId }: { profileId: string | undefined }) {
  const { fechamento } = useFechamentoDoMes(profileId)

  if (!fechamento || fechamento.status === 'sem_meta') {
    return (
      <div className="mt-6">
        <h2 className="text-sm text-texto-fraco">Meta do mês</h2>
        <p className="mt-2 rounded-card border border-borda bg-superficie p-3 text-sm text-texto-fraco">
          Defina a meta do ano para apurar o bônus.
        </p>
      </div>
    )
  }

  if (fechamento.status === 'insuficiente') {
    return (
      <div className="mt-6">
        <h2 className="text-sm text-texto-fraco">Meta do mês</h2>
        <p className="mt-2 rounded-card border border-borda bg-superficie p-3 text-sm text-texto-fraco">
          Pesagens insuficientes para apurar o bônus.
        </p>
      </div>
    )
  }

  const percentual = fechamento.percentual_atingido ?? 0
  const percentualClamp = Math.min(1.3, Math.max(0, percentual))

  return (
    <div className="mt-6">
      <h2 className="text-sm text-texto-fraco">Meta do mês</h2>
      <div className="mt-2 rounded-card border border-borda bg-superficie p-3">
        {fechamento.modo === 'manutencao' ? (
          <p className="text-sm text-texto-fraco">Modo manutenção</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-texto-fraco">Peso inicial</p>
                <p className="num text-base">{fechamento.peso_inicial_kg} kg</p>
              </div>
              <div>
                <p className="text-xs text-texto-fraco">Meta do mês</p>
                <p className="num text-base">
                  {fechamento.meta_kg?.toFixed(2)} kg
                  {fechamento.meta_limitada && ' (limitada)'}
                </p>
              </div>
              <div>
                <p className="text-xs text-texto-fraco">Perda até agora</p>
                <p className="num text-base">{fechamento.perda_kg?.toFixed(2)} kg</p>
              </div>
              <div>
                <p className="text-xs text-texto-fraco">Atingido</p>
                <p className="num text-base">{(percentual * 100).toFixed(0)}%</p>
              </div>
            </div>

            {fechamento.meta_limitada && (
              <p className="mt-2 text-xs text-texto-fraco">
                Meta ajustada para o limite do mês. No ritmo atual, a meta de 31/12 pode não ser
                alcançada.
              </p>
            )}

            <div className="relative mt-3 h-2 rounded-full bg-borda">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-sucesso"
                style={{ width: `${(percentualClamp / 1.3) * 100}%` }}
              />
              <div
                className="absolute top-0 h-2 w-px bg-texto-fraco"
                style={{ left: `${(0.7 / 1.3) * 100}%` }}
              />
              <div
                className="absolute top-0 h-2 w-px bg-texto-fraco"
                style={{ left: `${(0.9 / 1.3) * 100}%` }}
              />
            </div>
          </>
        )}

        <p className="num mt-3 text-sm text-texto-fraco">
          Prévia do bônus: <span className="text-texto">+{fechamento.bonus_total}</span> · sequência{' '}
          {fechamento.streak_meses} {fechamento.streak_meses === 1 ? 'mês' : 'meses'}
        </p>
      </div>
    </div>
  )
}
