-- 0002 — coluna envolve_comida em redemptions (seções 7.1 e 7.2)
--
-- A recompensa de casal pode ou não envolver comida; quando envolve, consome
-- a escapada grande do mês dos dois. Sem esta coluna, a informação se perderia
-- ao recarregar o app e a trava mensal não teria como ser reconstruída a
-- partir do histórico. Para resgates individuais, o valor é derivado da
-- categoria (escapadas envolvem comida por definição).
alter table redemptions
  add column envolve_comida boolean not null default false;
