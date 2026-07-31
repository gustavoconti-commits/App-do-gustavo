import { novoId, obterBanco, notificar } from './store'
import { inserirLancamento } from './ledger'
import { NOME_CATEGORIA_RESGATE } from '../../domain/escapadas'
import type { Redemption, RedemptionCategoria } from '../../types'

export async function listarResgates(): Promise<Redemption[]> {
  return [...obterBanco().redemptions]
    .sort((a, b) => b.data.localeCompare(a.data) || b.criado_em.localeCompare(a.criado_em))
    .map((r) => ({ ...r }))
}

export async function registrarResgateIndividual(input: {
  profileId: string
  categoria: Exclude<RedemptionCategoria, 'casal'>
  pontosGastos: number
  descricao: string
  data: string
}): Promise<Redemption> {
  const envolveComida =
    input.categoria === 'escapada_pequena' || input.categoria === 'escapada_grande'
  const resgate: Redemption = {
    id: novoId(),
    escopo: 'individual',
    categoria: input.categoria,
    profile_id: input.profileId,
    pontos_gastos: input.pontosGastos,
    descricao: input.descricao,
    data: input.data,
    envolve_comida: envolveComida,
    criado_em: new Date().toISOString(),
  }
  obterBanco().redemptions.push(resgate)
  await inserirLancamento({
    profileId: input.profileId,
    data: input.data,
    tipo: 'resgate',
    pontos: -input.pontosGastos,
    contaParaTotalGanho: false,
    referenciaId: resgate.id,
    descricao: `${NOME_CATEGORIA_RESGATE[input.categoria]} · ${input.descricao}`,
  })
  notificar('redemptions')
  return { ...resgate }
}

export async function registrarResgateCasal(input: {
  profileIds: [string, string]
  pontosPorPessoa: number
  descricao: string
  envolveComida: boolean
  data: string
}): Promise<Redemption> {
  const resgate: Redemption = {
    id: novoId(),
    escopo: 'casal',
    categoria: 'casal',
    profile_id: null,
    pontos_gastos: input.pontosPorPessoa,
    descricao: input.descricao,
    data: input.data,
    envolve_comida: input.envolveComida,
    criado_em: new Date().toISOString(),
  }
  obterBanco().redemptions.push(resgate)
  for (const profileId of input.profileIds) {
    await inserirLancamento({
      profileId,
      data: input.data,
      tipo: 'resgate',
      pontos: -input.pontosPorPessoa,
      contaParaTotalGanho: false,
      referenciaId: resgate.id,
      descricao: `Recompensa de casal · ${input.descricao}`,
    })
  }
  notificar('redemptions')
  return { ...resgate }
}
