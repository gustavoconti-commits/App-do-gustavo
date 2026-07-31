import type { ReactNode } from 'react'
import type { MonthlyClosing, Profile } from '../types'

export type PessoaBonusMes = {
  perfil: Profile
  fechamento: MonthlyClosing | null
}

/** Bônus de peso do mês corrente — prévia ou valor creditado, com o
 *  percentual atingido (seção 9.2, item 6). */
export function BonusPesoMes({ pessoas }: { pessoas: PessoaBonusMes[] }) {
  return (
    <div className="mt-6">
      <h2 className="text-sm text-texto-fraco">Bônus de peso do mês</h2>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {pessoas.map(({ perfil, fechamento }) => {
          let conteudo: ReactNode
          if (!fechamento || fechamento.status === 'sem_meta') {
            conteudo = (
              <p className="mt-1 text-xs text-texto-fraco">
                Defina a meta do ano para apurar o bônus.
              </p>
            )
          } else if (fechamento.status === 'insuficiente') {
            conteudo = (
              <p className="mt-1 text-xs text-texto-fraco">
                Pesagens insuficientes para apurar o bônus.
              </p>
            )
          } else {
            const percentual = fechamento.percentual_atingido
            conteudo = (
              <>
                <p className="num mt-1 text-xl">+{fechamento.bonus_total}</p>
                <p className="num text-xs text-texto-fraco">
                  {fechamento.status === 'fechado' ? 'creditado' : 'prévia'}
                  {percentual !== null && ` · ${(percentual * 100).toFixed(0)}% da meta`}
                </p>
              </>
            )
          }
          return (
            <div key={perfil.id} className="rounded-card border border-borda bg-superficie p-3">
              <p className="text-sm font-semibold" style={{ color: perfil.cor_hex }}>
                {perfil.nome}
              </p>
              {conteudo}
            </div>
          )
        })}
      </div>
    </div>
  )
}
