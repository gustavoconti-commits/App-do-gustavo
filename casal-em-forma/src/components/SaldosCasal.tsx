import { formatarReais } from '../utils/formato'
import type { PessoaPontos } from '../hooks/usePontosDoCasal'

export function SaldosCasal({ pessoas }: { pessoas: PessoaPontos[] }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      {pessoas.map((pessoa) => (
        <div key={pessoa.perfil.id} className="rounded-card border border-borda bg-superficie p-3">
          <p className="text-sm font-semibold" style={{ color: pessoa.perfil.cor_hex }}>
            {pessoa.perfil.nome}
          </p>
          <p className="num-display num mt-1 text-2xl">{pessoa.saldo}</p>
          <p className="text-xs text-texto-fraco">pontos de saldo</p>
          <div className="mt-2 space-y-0.5 text-xs text-texto-fraco">
            <p>
              Total ganho <span className="num text-texto">{pessoa.totalGanho}</span>
            </p>
            <p>
              Cofrinho <span className="num text-texto">{formatarReais(pessoa.cofrinho)}</span>
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
