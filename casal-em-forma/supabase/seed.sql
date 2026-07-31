-- Seed: 2 perfis e a linha única de settings.
-- Rodar uma vez após a migration 0001_init.sql.

insert into settings (id) values (1)
  on conflict (id) do nothing;

insert into profiles (nome, cor_hex, altura_cm) values
  ('Gustavo', '#3B82F6', null),
  ('Júlia',   '#F43F5E', null);
