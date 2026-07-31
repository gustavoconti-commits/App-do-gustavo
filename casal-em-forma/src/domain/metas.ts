// Metas de peso — anual, semestral e mensal (seção 8 do PROMPT MESTRE v3).
// Funções puras: sem React, sem Supabase, sem `new Date()` interno.
import { differenceInCalendarDays } from 'date-fns'

function paraData(dataISO: string): Date {
  return new Date(`${dataISO}T12:00:00`)
}

// --- 8.1 Meta anual ---------------------------------------------------------

export type MetaAnual = {
  pesoBaseKg: number
  kgAPerder: number
  pesoAlvoKg: number
}

export function criarMetaAnual(pesoBaseKg: number, kgAPerder: number): MetaAnual {
  return { pesoBaseKg, kgAPerder, pesoAlvoKg: pesoBaseKg - kgAPerder }
}

// --- 8.2 Desmembramento mensal dinâmico -------------------------------------

/** Meses restantes até dezembro, incluindo o mês corrente (agosto → 5). */
export function mesesRestantes(mes: number): number {
  return 12 - mes + 1
}

export function metaMensalBruta(
  pesoInicialDoMes: number,
  pesoAlvoKg: number,
  mesesRestantesNoAno: number,
): number {
  return (pesoInicialDoMes - pesoAlvoKg) / mesesRestantesNoAno
}

export type ResultadoTetoSeguranca = {
  metaKg: number
  metaLimitada: boolean
}

/** meta_kg nunca ultrapassa meta_mensal_maxima_pct × peso inicial do mês. */
export function aplicarTetoSeguranca(
  metaKgBruta: number,
  pesoInicialDoMes: number,
  metaMensalMaximaPct: number,
): ResultadoTetoSeguranca {
  const tetoKg = pesoInicialDoMes * metaMensalMaximaPct
  if (metaKgBruta > tetoKg) {
    return { metaKg: tetoKg, metaLimitada: true }
  }
  return { metaKg: metaKgBruta, metaLimitada: false }
}

export type ResultadoMetaDoMes =
  | { status: 'sem_meta' }
  | {
      status: 'ok'
      mesesRestantes: number
      metaKg: number
      metaLimitada: boolean
    }

/** Meta do mês, já com o teto de segurança aplicado. `sem_meta` quando não há
 *  meta anual cadastrada para o ano — o fechamento sai com bônus zero. */
export function calcularMetaDoMes(params: {
  metaAnual: Pick<MetaAnual, 'pesoAlvoKg'> | null
  mes: number // 1-12
  pesoInicialDoMes: number
  metaMensalMaximaPct: number
}): ResultadoMetaDoMes {
  if (!params.metaAnual) return { status: 'sem_meta' }

  const restantes = mesesRestantes(params.mes)
  const bruta = metaMensalBruta(params.pesoInicialDoMes, params.metaAnual.pesoAlvoKg, restantes)
  const { metaKg, metaLimitada } = aplicarTetoSeguranca(
    bruta,
    params.pesoInicialDoMes,
    params.metaMensalMaximaPct,
  )

  return { status: 'ok', mesesRestantes: restantes, metaKg, metaLimitada }
}

// --- Linha de referência linear e meta semestral (seção 8.2) ---------------

/** Posição da linha reta peso_base (01/jan) → peso_alvo (31/dez) numa data
 *  qualquer do ano. Em 31/12 vale exatamente peso_alvo_kg. */
export function linhaDeReferencia(
  pesoBaseKg: number,
  pesoAlvoKg: number,
  dataISO: string,
  ano: number,
): number {
  const inicioAno = paraData(`${ano}-01-01`)
  const fimAno = paraData(`${ano}-12-31`)
  const totalDias = differenceInCalendarDays(fimAno, inicioAno)
  const diasDecorridos = differenceInCalendarDays(paraData(dataISO), inicioAno)
  const fracao = totalDias === 0 ? 1 : diasDecorridos / totalDias
  return pesoBaseKg - (pesoBaseKg - pesoAlvoKg) * fracao
}

/** Semestres do ano calendário: S1 = jan-jun, S2 = jul-dez. A meta do
 *  semestre é a linha de referência no último dia dele. */
export function metaSemestral(
  pesoBaseKg: number,
  pesoAlvoKg: number,
  ano: number,
  semestre: 1 | 2,
): number {
  const ultimoDia = semestre === 1 ? `${ano}-06-30` : `${ano}-12-31`
  return linhaDeReferencia(pesoBaseKg, pesoAlvoKg, ultimoDia, ano)
}
