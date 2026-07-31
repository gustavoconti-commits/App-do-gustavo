import { linhaDeReferencia } from '../domain/metas'
import type { AnnualGoal, Profile, WeighIn } from '../types'

export type PessoaMetaAno = {
  perfil: Profile
  meta: AnnualGoal | null
  ultimaPesagem: WeighIn | undefined
}

/** Progresso da meta do ano por pessoa: perdido/total, barra e a posição
 *  em relação à linha de referência linear (seção 9.2, item 5). */
export function ProgressoMetaAno({ pessoas, hoje }: { pessoas: PessoaMetaAno[]; hoje: string }) {
  const ano = Number(hoje.slice(0, 4))

  return (
    <div className="mt-6">
      <h2 className="text-sm text-texto-fraco">Meta do ano</h2>
      <div className="mt-2 space-y-3 rounded-card border border-borda bg-superficie p-3">
        {pessoas.map(({ perfil, meta, ultimaPesagem }) => {
          if (!meta || meta.kg_a_perder <= 0) {
            return (
              <div key={perfil.id}>
                <p className="text-sm" style={{ color: perfil.cor_hex }}>
                  {perfil.nome}
                </p>
                <p className="mt-1 text-sm text-texto-fraco">
                  {meta ? 'Meta de manutenção — sem kg a perder.' : `Defina a meta de ${ano} na aba ${perfil.nome}.`}
                </p>
              </div>
            )
          }

          const pesoAtual = ultimaPesagem?.peso_kg ?? meta.peso_base_kg
          const perdido = meta.peso_base_kg - pesoAtual
          const fracao = Math.min(1, Math.max(0, perdido / meta.kg_a_perder))
          const linhaHoje = linhaDeReferencia(meta.peso_base_kg, meta.peso_alvo_kg, hoje, ano)
          const abaixoDaLinha = pesoAtual <= linhaHoje

          return (
            <div key={perfil.id}>
              <div className="flex items-baseline justify-between">
                <p className="text-sm" style={{ color: perfil.cor_hex }}>
                  {perfil.nome}
                </p>
                <p className="num text-xs text-texto-fraco">
                  {perdido.toFixed(1)} / {meta.kg_a_perder.toFixed(1)} kg
                </p>
              </div>
              <div className="mt-1 h-2 rounded-full bg-borda">
                <div
                  className="h-2 rounded-full"
                  style={{ width: `${fracao * 100}%`, backgroundColor: perfil.cor_hex }}
                />
              </div>
              <p className={`mt-1 text-xs ${abaixoDaLinha ? 'text-sucesso' : 'text-texto-fraco'}`}>
                {abaixoDaLinha ? 'Abaixo da linha de referência' : 'Acima da linha de referência'}
                <span className="num"> · linha hoje {linhaHoje.toFixed(1)} kg</span>
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
