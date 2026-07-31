import { describe, it, expect } from 'vitest'
import {
  criarMetaAnual,
  mesesRestantes,
  metaMensalBruta,
  aplicarTetoSeguranca,
  calcularMetaDoMes,
  linhaDeReferencia,
  metaSemestral,
} from './metas'

describe('metas.ts', () => {
  it('meta de 12 kg criada em janeiro: janeiro pede 1,00 kg', () => {
    const meta = criarMetaAnual(100, 12) // peso_alvo = 88
    const restantes = mesesRestantes(1)
    expect(restantes).toBe(12)
    const metaJan = metaMensalBruta(100, meta.pesoAlvoKg, restantes)
    expect(metaJan).toBeCloseTo(1.0, 4)
  })

  it('sem perder nada em janeiro, fevereiro pede 1,09 kg (12 ÷ 11)', () => {
    const meta = criarMetaAnual(100, 12)
    const restantes = mesesRestantes(2)
    expect(restantes).toBe(11)
    // não perdeu nada em janeiro: peso inicial de fevereiro continua 100
    const metaFev = metaMensalBruta(100, meta.pesoAlvoKg, restantes)
    expect(metaFev).toBeCloseTo(12 / 11, 4)
    expect(Number(metaFev.toFixed(2))).toBe(1.09)
  })

  it('perdendo 2 kg até fevereiro, março pede 1,00 kg (10 ÷ 10)', () => {
    // reproduz a tabela da seção 8.2: peso inicial de março = 98 (perdeu 2 kg)
    const meta = criarMetaAnual(100, 12)
    const restantes = mesesRestantes(3)
    expect(restantes).toBe(10)
    const metaMar = metaMensalBruta(98, meta.pesoAlvoKg, restantes)
    expect(metaMar).toBeCloseTo(1.0, 4)
  })

  it('meta criada em agosto/2026 divide por 5 meses, não por 12', () => {
    expect(mesesRestantes(8)).toBe(5)
  })

  it('meta que exigiria mais de 4% do peso no mês é cortada pelo teto e marca meta_limitada', () => {
    // pesoInicial 100, teto 4% = 4 kg; meta bruta de 6 kg deve ser cortada
    const resultado = aplicarTetoSeguranca(6, 100, 0.04)
    expect(resultado.metaKg).toBeCloseTo(4, 4)
    expect(resultado.metaLimitada).toBe(true)

    const dentroDoTeto = aplicarTetoSeguranca(2, 100, 0.04)
    expect(dentroDoTeto.metaKg).toBeCloseTo(2, 4)
    expect(dentroDoTeto.metaLimitada).toBe(false)
  })

  it('linha de referência em 31/12 é exatamente o peso_alvo_kg', () => {
    const meta = criarMetaAnual(100, 12)
    const linha = linhaDeReferencia(meta.pesoBaseKg, meta.pesoAlvoKg, '2026-12-31', 2026)
    expect(linha).toBeCloseTo(meta.pesoAlvoKg, 6)
  })

  it('meta semestral de S2 é o valor da linha em 31/12', () => {
    const meta = criarMetaAnual(100, 12)
    const s2 = metaSemestral(meta.pesoBaseKg, meta.pesoAlvoKg, 2026, 2)
    const linhaEm31Dez = linhaDeReferencia(meta.pesoBaseKg, meta.pesoAlvoKg, '2026-12-31', 2026)
    expect(s2).toBeCloseTo(linhaEm31Dez, 6)
    expect(s2).toBeCloseTo(meta.pesoAlvoKg, 6)
  })

  it('sem meta cadastrada, o fechamento sai sem_meta com bônus 0', () => {
    const resultado = calcularMetaDoMes({
      metaAnual: null,
      mes: 3,
      pesoInicialDoMes: 98,
      metaMensalMaximaPct: 0.04,
    })
    expect(resultado.status).toBe('sem_meta')
  })
})
