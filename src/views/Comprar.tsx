import React from 'react'
import { ApiceSymbol, Wordmark } from '../components/Brand'
import { PRICE_CURRENT, PRICE_OLD, STRIPE_PAYMENT_LINK } from '../config'
import { fmtBRL } from '../format'

const BENEFICIOS = [
  'saldos, totais e dashboard em um só lugar',
  'diário financeiro com tags e filtros',
  'seus dados sincronizados na nuvem, em qualquer aparelho',
  'acesso vitalício — paga uma vez, usa para sempre',
]

export function ComprarView() {
  return (
    <div className="lock-screen">
      <div className="lock-card comprar-card">
        <ApiceSymbol width={64} />
        <Wordmark size={28} />
        <p className="lock-sub">acesso vitalício</p>

        <h1 className="comprar-title">controle financeiro sem mensalidade</h1>

        <ul className="comprar-lista">
          {BENEFICIOS.map((b) => (
            <li key={b}>✓ {b}</li>
          ))}
        </ul>

        <div className="comprar-preco">
          <span className="comprar-preco-antigo">{fmtBRL(PRICE_OLD)}</span>
          <span className="comprar-preco-atual">{fmtBRL(PRICE_CURRENT)}</span>
        </div>

        {STRIPE_PAYMENT_LINK ? (
          <a className="btn gold block comprar-cta" href={STRIPE_PAYMENT_LINK}>
            quero meu acesso
          </a>
        ) : (
          <p className="lock-notice">pagamento em breve — volte já já</p>
        )}

        <a className="auth-link" href="#">
          voltar
        </a>
      </div>
    </div>
  )
}
