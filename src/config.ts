// Configuração do backend (Supabase). A chave "publishable" é feita para
// viver no cliente — a segurança real vem das regras de Row Level Security
// no servidor (ver supabase/schema.sql).
export const SUPABASE_URL = 'https://livbftcocmzczcvnqply.supabase.co'
export const SUPABASE_KEY = 'sb_publishable_0k03OC-4VbtWH0Hcv_cAnA_XdQ9_zqa'

// URL pública do app, usada nos links de confirmação/recuperação de senha.
export const SITE_URL = 'https://gustavoconti-commits.github.io/App-do-gustavo/'

// Link de pagamento da Stripe (Payment Link) para o acesso vitalício.
// Preencher depois de criar o produto/preço no painel da Stripe.
export const STRIPE_PAYMENT_LINK = ''

export const PRICE_OLD = 197
export const PRICE_CURRENT = 97
