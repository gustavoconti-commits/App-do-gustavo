import { supabase } from './supabase'
import { inserirLancamento } from './ledger'
import { NOME_CATEGORIA_RESGATE } from '../domain/escapadas'
import type { Redemption, RedemptionCategoria } from '../types'

export async function listarResgates(): Promise<Redemption[]> {
  const { data, error } = await supabase
    .from('redemptions')
    .select('*')
    .order('data', { ascending: false })
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data
}

/** Resgate individual: 1 linha em redemptions + 1 débito no ledger. Escapadas
 *  envolvem comida por definição; pequena e média nunca. A validação da trava
 *  mensal (domain/escapadas.ts) acontece antes de chamar aqui. */
export async function registrarResgateIndividual(input: {
  profileId: string
  categoria: Exclude<RedemptionCategoria, 'casal'>
  pontosGastos: number
  descricao: string
  data: string
}): Promise<Redemption> {
  const envolveComida =
    input.categoria === 'escapada_pequena' || input.categoria === 'escapada_grande'
  const { data, error } = await supabase
    .from('redemptions')
    .insert({
      escopo: 'individual',
      categoria: input.categoria,
      profile_id: input.profileId,
      pontos_gastos: input.pontosGastos,
      descricao: input.descricao,
      data: input.data,
      envolve_comida: envolveComida,
    })
    .select()
    .single()
  if (error) throw error

  await inserirLancamento({
    profileId: input.profileId,
    data: input.data,
    tipo: 'resgate',
    pontos: -input.pontosGastos,
    contaParaTotalGanho: false,
    referenciaId: data.id,
    descricao: `${NOME_CATEGORIA_RESGATE[input.categoria]} · ${input.descricao}`,
  })

  return data
}

/** Recompensa de casal: 1 linha em redemptions (profile_id null) + 1 débito
 *  no ledger de cada pessoa. `pontos_gastos` é o valor POR PESSOA. */
export async function registrarResgateCasal(input: {
  profileIds: [string, string]
  pontosPorPessoa: number
  descricao: string
  envolveComida: boolean
  data: string
}): Promise<Redemption> {
  const { data, error } = await supabase
    .from('redemptions')
    .insert({
      escopo: 'casal',
      categoria: 'casal',
      profile_id: null,
      pontos_gastos: input.pontosPorPessoa,
      descricao: input.descricao,
      data: input.data,
      envolve_comida: input.envolveComida,
    })
    .select()
    .single()
  if (error) throw error

  for (const profileId of input.profileIds) {
    await inserirLancamento({
      profileId,
      data: input.data,
      tipo: 'resgate',
      pontos: -input.pontosPorPessoa,
      contaParaTotalGanho: false,
      referenciaId: data.id,
      descricao: `Recompensa de casal · ${input.descricao}`,
    })
  }

  return data
}
