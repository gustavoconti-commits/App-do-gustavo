-- Casal em Forma — schema inicial
-- Ver seção 5 do PROMPT MESTRE v3.

create extension if not exists "pgcrypto";

create table profiles (
  id        uuid primary key default gen_random_uuid(),
  nome      text not null,
  cor_hex   text not null,
  altura_cm int,
  criado_em timestamptz not null default now()
);

create table settings (
  id                          int primary key default 1,
  data_inicio                 date not null default '2026-08-01',

  -- pontos de hábito
  pontos_por_habito           int  not null default 1,
  bonus_dia_perfeito          int  not null default 1,
  bonus_semana_perfeita       int  not null default 5,
  limite_habitos_ativos       int  not null default 5,   -- teto por pessoa

  -- bônus de peso
  faixa_parcial               numeric(4,3) not null default 0.70,
  faixa_completa               numeric(4,3) not null default 0.90,
  bonus_peso_parcial          int  not null default 25,
  bonus_peso_completo         int  not null default 60,
  bonus_streak_2              int  not null default 40,
  bonus_streak_3mais          int  not null default 80,
  tolerancia_manutencao_kg    numeric(4,2) not null default 1.00,
  min_pesagens_mes            int  not null default 3,
  meta_mensal_maxima_pct      numeric(4,3) not null default 0.040,  -- teto de segurança: 4% do peso/mês

  -- economia de pontos
  valor_ponto_cofrinho        numeric(6,2) not null default 1.00,
  teto_cofrinho_mensal_reais  numeric(8,2) not null default 0,      -- 0 = sem teto
  pedagio_transferencia       numeric(4,2) not null default 0.50,
  custo_tier_pequena          int  not null default 30,   -- sem comida
  custo_tier_media            int  not null default 80,   -- sem comida
  custo_escapada_pequena      int  not null default 50,   -- açaí, sorvete, cerveja
  custo_escapada_grande       int  not null default 140,  -- rodízio, churrascaria
  custo_tier_casal            int  not null default 120,  -- por pessoa

  constraint linha_unica check (id = 1)
);

-- Meta macro do ano calendário. Uma por pessoa por ano.
create table annual_goals (
  id                  uuid primary key default gen_random_uuid(),
  profile_id          uuid not null references profiles(id) on delete cascade,
  ano                 int  not null,                       -- 2026
  data_criacao        date not null default current_date,
  peso_base_kg        numeric(5,2) not null,               -- peso no momento da criação
  kg_a_perder         numeric(5,2) not null,               -- o que o usuário digita
  peso_alvo_kg        numeric(5,2) not null,               -- peso_base - kg_a_perder
  criado_em           timestamptz not null default now(),
  unique (profile_id, ano)
);

create table habits (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references profiles(id) on delete cascade,
  nome         text not null,
  dias_semana  int[] not null default '{1,2,3,4,5,6,7}',  -- 1=segunda … 7=domingo
  pontos       int  not null default 1,
  ordem        int  not null default 0,
  arquivado_em timestamptz,
  criado_em    timestamptz not null default now()
);

-- Teto de hábitos ativos por pessoa. Arquivados não contam.
create or replace function checar_limite_habitos() returns trigger as $$
declare
  ativos int;
  teto   int;
begin
  select limite_habitos_ativos into teto from settings where id = 1;
  select count(*) into ativos
    from habits
   where profile_id = new.profile_id
     and arquivado_em is null
     and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);
  if ativos >= teto then
    raise exception 'Limite de % hábitos ativos atingido. Arquive um antes de criar outro.', teto;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_limite_habitos
  before insert or update on habits
  for each row when (new.arquivado_em is null)
  execute function checar_limite_habitos();

create table habit_logs (
  id         uuid primary key default gen_random_uuid(),
  habit_id   uuid not null references habits(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  data       date not null,
  criado_em  timestamptz not null default now(),
  unique (habit_id, data)
);
-- Ausência de linha = não feito. Desmarcar = DELETE. O estorno é automático.

create table weigh_ins (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  data       date not null,
  peso_kg    numeric(5,2) not null check (peso_kg > 0 and peso_kg < 400),
  observacao text,
  unique (profile_id, data)
);

create table monthly_closings (
  id                  uuid primary key default gen_random_uuid(),
  profile_id          uuid not null references profiles(id) on delete cascade,
  ano_mes             date not null,          -- sempre dia 1
  modo                text not null check (modo in ('emagrecimento','manutencao')),
  peso_inicial_kg     numeric(5,2),
  peso_final_kg       numeric(5,2),
  meses_restantes     int,                    -- usado no cálculo da meta
  meta_kg             numeric(5,2),
  meta_limitada       boolean not null default false,  -- true se o teto de 4% cortou
  perda_kg            numeric(5,2),
  percentual_atingido numeric(6,4),
  qtd_pesagens        int not null,
  bonus_base          int not null default 0,
  bonus_streak        int not null default 0,
  bonus_total         int not null default 0,
  streak_meses        int not null default 0,
  status              text not null default 'previa'
                      check (status in ('previa','fechado','insuficiente','sem_meta')),
  fechado_em          timestamptz,
  unique (profile_id, ano_mes)
);

create table ledger (
  id                     uuid primary key default gen_random_uuid(),
  profile_id             uuid not null references profiles(id) on delete cascade,
  data                   date not null default current_date,
  tipo                   text not null check (tipo in (
                           'bonus_peso','resgate',
                           'transferencia_envio','transferencia_recebimento',
                           'ajuste')),
  pontos                 int not null,           -- positivo credita, negativo debita
  conta_para_total_ganho boolean not null default false,
  referencia_id          uuid,
  descricao              text not null,
  criado_em              timestamptz not null default now()
);

create table redemptions (
  id            uuid primary key default gen_random_uuid(),
  escopo        text not null check (escopo in ('individual','casal')),
  categoria     text not null check (categoria in (
                  'pequena','media','escapada_pequena','escapada_grande','casal')),
  profile_id    uuid references profiles(id),   -- null quando escopo='casal'
  pontos_gastos int  not null,                  -- por pessoa
  descricao     text not null,                  -- "Rodízio de pizza"
  data          date not null default current_date,
  criado_em     timestamptz not null default now()
);

create table transfers (
  id               uuid primary key default gen_random_uuid(),
  de_profile_id    uuid not null references profiles(id),
  para_profile_id  uuid not null references profiles(id),
  pontos_enviados  int not null check (pontos_enviados > 0),
  pontos_recebidos int not null,
  data             date not null default current_date,
  criado_em        timestamptz not null default now(),
  check (de_profile_id <> para_profile_id)
);

create table piggy_withdrawals (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  data        date not null default current_date,
  valor_reais numeric(8,2) not null check (valor_reais > 0),
  descricao   text,
  criado_em   timestamptz not null default now()
);

create index on habit_logs (profile_id, data);
create index on weigh_ins  (profile_id, data);
create index on ledger     (profile_id, data);

-- 5.1 Segurança (RLS)
-- Conta única compartilhada: sem login, ninguém lê nada. Logado, edita tudo —
-- inclusive os dados do outro.

alter table profiles           enable row level security;
alter table settings           enable row level security;
alter table annual_goals       enable row level security;
alter table habits             enable row level security;
alter table habit_logs         enable row level security;
alter table weigh_ins          enable row level security;
alter table monthly_closings   enable row level security;
alter table ledger             enable row level security;
alter table redemptions        enable row level security;
alter table transfers          enable row level security;
alter table piggy_withdrawals  enable row level security;

create policy "acesso_total_autenticado" on profiles
  for all to authenticated using (true) with check (true);
create policy "acesso_total_autenticado" on settings
  for all to authenticated using (true) with check (true);
create policy "acesso_total_autenticado" on annual_goals
  for all to authenticated using (true) with check (true);
create policy "acesso_total_autenticado" on habits
  for all to authenticated using (true) with check (true);
create policy "acesso_total_autenticado" on habit_logs
  for all to authenticated using (true) with check (true);
create policy "acesso_total_autenticado" on weigh_ins
  for all to authenticated using (true) with check (true);
create policy "acesso_total_autenticado" on monthly_closings
  for all to authenticated using (true) with check (true);
create policy "acesso_total_autenticado" on ledger
  for all to authenticated using (true) with check (true);
create policy "acesso_total_autenticado" on redemptions
  for all to authenticated using (true) with check (true);
create policy "acesso_total_autenticado" on transfers
  for all to authenticated using (true) with check (true);
create policy "acesso_total_autenticado" on piggy_withdrawals
  for all to authenticated using (true) with check (true);
