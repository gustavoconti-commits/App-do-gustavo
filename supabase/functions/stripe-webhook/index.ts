// Recebe o evento "checkout.session.completed" da Stripe e libera o e-mail
// do comprador na tabela public.allowed_emails, permitindo o cadastro dele.
//
// Deploy: supabase functions deploy stripe-webhook --no-verify-jwt --project-ref <ref>
// (o toggle "Verify JWT" do painel não é suficiente nos projetos migrados para
// as novas JWT signing keys — o gateway continua exigindo apikey mesmo com ele
// desligado; só o deploy via CLI com --no-verify-jwt libera de fato, pois quem
// chama é a Stripe, não um usuário logado).
// Secrets necessários: STRIPE_SECRET_KEY e STRIPE_WEBHOOK_SECRET (SUPABASE_URL
// e SUPABASE_SERVICE_ROLE_KEY já vêm injetados automaticamente).

import Stripe from 'npm:stripe@17'
import { createClient } from 'npm:@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' })
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature ?? '', webhookSecret)
  } catch (err) {
    return new Response(`assinatura inválida: ${(err as Error).message}`, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const email = session.customer_details?.email ?? session.customer_email
    if (email) {
      const { error } = await supabaseAdmin
        .from('allowed_emails')
        .upsert({ email: email.toLowerCase(), source: 'stripe' }, { onConflict: 'email' })
      if (error) console.error('erro ao liberar e-mail', error)
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 })
})
