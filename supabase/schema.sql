-- Esquema do banco para o app GustavoConti · Finanças
-- Cole este arquivo inteiro no painel do Supabase: SQL Editor → New query → Run
--
-- Cria a tabela que guarda os dados de cada usuário e as regras de
-- segurança (RLS) que garantem que cada um só lê/escreve o que é seu.
-- Os dados cadastrais (nome completo, telefone) ficam no próprio usuário
-- do Supabase Auth (user_metadata), sem tabela extra.

create table if not exists public.user_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null,
  saved_at bigint not null,
  updated_at timestamptz not null default now()
);

alter table public.user_state enable row level security;

drop policy if exists "cada usuário lê o próprio estado" on public.user_state;
create policy "cada usuário lê o próprio estado"
  on public.user_state for select
  using (auth.uid() = user_id);

drop policy if exists "cada usuário insere o próprio estado" on public.user_state;
create policy "cada usuário insere o próprio estado"
  on public.user_state for insert
  with check (auth.uid() = user_id);

drop policy if exists "cada usuário atualiza o próprio estado" on public.user_state;
create policy "cada usuário atualiza o próprio estado"
  on public.user_state for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "cada usuário apaga o próprio estado" on public.user_state;
create policy "cada usuário apaga o próprio estado"
  on public.user_state for delete
  using (auth.uid() = user_id);

-- Acesso pago: só quem está nesta lista consegue criar conta.
-- Sem policies de RLS de propósito — só o SQL Editor (owner) e a service role
-- (usada pela Edge Function do webhook da Stripe) enxergam esta tabela.
create table if not exists public.allowed_emails (
  email text primary key,
  added_at timestamptz not null default now(),
  source text not null default 'manual'
);

alter table public.allowed_emails enable row level security;

create or replace function public.check_allowed_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.allowed_emails where lower(email) = lower(new.email)
  ) then
    raise exception 'not_allowed';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_allowed_email on auth.users;
create trigger enforce_allowed_email
  before insert on auth.users
  for each row execute function public.check_allowed_email();

insert into public.allowed_emails (email, source)
values ('ogustavoconti@gmail.com', 'manual')
on conflict (email) do nothing;
