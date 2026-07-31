import { describe, it, expect } from 'vitest'
import {
  calcularPesoInicialDoMes,
  calcularBonusEmagrecimento,
  calcularStreak,
  determinarModoDoMes,
  calcularBonusManutencao,
  calcularFechamentoMensal,
  type SettingsParaBonusPeso,
} from './bonusPeso'
import { criarMetaAnual } from './metas'

const settings: SettingsParaBonusPeso = {
  min_pesagens_mes: 3,
  faixa_parcial: 0.7,
  faixa_completa: 0.9,
  bonus_peso_parcial: 25,
  bonus_peso_completo: 60,
  bonus_streak_2: 40,
  bonus_streak_3mais: 80,
  tolerancia_manutencao_kg: 1.0,
  meta_mensal_maxima_pct: 0.04,
}

describe('bonusPeso.ts', () => {
  it('peso inicial usa a média das 3 últimas do mês anterior; no primeiro mês, as 3 primeiras registradas', () => {
    const mesAnterior = calcularPesoInicialDoMes({
      pesagensMesAnterior: [100, 99, 98, 97], // últimas 3: 99,98,97
      pesagensDesdeOInicio: [],
      pesagensMesCorrente: [],
      ehPrimeiroMes: false,
    })
    expect(mesAnterior).toBeCloseTo((99 + 98 + 97) / 3, 6)

    const primeiroMes = calcularPesoInicialDoMes({
      pesagensMesAnterior: [],
      pesagensDesdeOInicio: [100, 99.5, 99, 98.5], // 3 primeiras: 100,99.5,99
      pesagensMesCorrente: [100, 99.5, 99, 98.5],
      ehPrimeiroMes: true,
    })
    expect(primeiroMes).toBeCloseTo((100 + 99.5 + 99) / 3, 6)
  })

  it('mês com 2 pesagens retorna insuficiente, bônus 0, e zera a sequência', () => {
    const meta = criarMetaAnual(100, 12)
    const resultado = calcularFechamentoMensal({
      mes: 3,
      pesagensMesAnterior: [98, 97, 96],
      pesagensDesdeOInicio: [100, 99, 98, 97, 96],
      pesagensMesCorrente: [96, 95],
      ehPrimeiroMes: false,
      metaAnual: meta,
      estavaEmManutencaoNoAno: false,
      streakMesesAnterior: 2,
      settings,
    })
    expect(resultado.status).toBe('insuficiente')
    expect(resultado.bonusTotal).toBe(0)
    expect(resultado.streakMeses).toBe(0)
  })

  it('69,9% → 0. 70% → 25. 89,9% → 25. 90% → 60. 115% → 60', () => {
    const casos: [number, number][] = [
      [0.699, 0],
      [0.7, 25],
      [0.899, 25],
      [0.9, 60],
      [1.15, 60],
    ]
    for (const [percentual, bonusEsperado] of casos) {
      const { bonusBase } = calcularBonusEmagrecimento(percentual, 0.7, 0.9, 25, 60)
      expect(bonusBase).toBe(bonusEsperado)
    }
  })

  it('2º mês seguido em 90%+ soma 40; o 3º e o 4º somam 80 cada', () => {
    const mes1 = calcularStreak(0, true, 40, 80)
    expect(mes1).toEqual({ streakMeses: 1, bonusStreak: 0 })

    const mes2 = calcularStreak(mes1.streakMeses, true, 40, 80)
    expect(mes2).toEqual({ streakMeses: 2, bonusStreak: 40 })

    const mes3 = calcularStreak(mes2.streakMeses, true, 40, 80)
    expect(mes3).toEqual({ streakMeses: 3, bonusStreak: 80 })

    const mes4 = calcularStreak(mes3.streakMeses, true, 40, 80)
    expect(mes4).toEqual({ streakMeses: 4, bonusStreak: 80 })
  })

  it('mês abaixo de 90% zera a sequência sem tirar pontos já ganhos', () => {
    const apos3MesesNaFaixa = calcularStreak(2, true, 40, 80) // streak vira 3, ganha 80
    expect(apos3MesesNaFaixa.bonusStreak).toBe(80)

    const mesFraco = calcularStreak(apos3MesesNaFaixa.streakMeses, false, 40, 80)
    expect(mesFraco).toEqual({ streakMeses: 0, bonusStreak: 0 })
    // os 80 pontos do mês anterior não são revertidos por esta função —
    // ela só decide o bônus do mês corrente.
  })

  it('modo manutenção ativa ao bater o peso-alvo e paga 60 dentro de ±1 kg, 0 fora', () => {
    const modo = determinarModoDoMes({
      estavaEmManutencaoNoAno: false,
      pesoFinalDoMes: 87.5,
      pesoAlvoAnoKg: 88,
    })
    expect(modo).toBe('manutencao')

    const dentro = calcularBonusManutencao(87.2, 88, 1.0, 60)
    expect(dentro).toEqual({ bonusBase: 60, naFaixa: true })

    const fora = calcularBonusManutencao(85, 88, 1.0, 60)
    expect(fora).toEqual({ bonusBase: 0, naFaixa: false })
  })

  it('fechar o mesmo mês duas vezes credita uma vez só (cálculo determinístico)', () => {
    const meta = criarMetaAnual(100, 12)
    const entrada = {
      mes: 3,
      pesagensMesAnterior: [100, 99, 98],
      pesagensDesdeOInicio: [101, 100.5, 100, 99, 98],
      pesagensMesCorrente: [98, 97.5, 97],
      ehPrimeiroMes: false,
      metaAnual: meta,
      estavaEmManutencaoNoAno: false,
      streakMesesAnterior: 1,
      settings,
    }
    const primeiraVez = calcularFechamentoMensal(entrada)
    const segundaVez = calcularFechamentoMensal(entrada)
    // mesma entrada sempre produz o mesmo fechamento — a idempotência real
    // (não creditar duas vezes no ledger) é garantida pelo unique(profile_id,
    // ano_mes) da migration da etapa 1 e pela rotina de fechamento da etapa 9.
    expect(segundaVez).toEqual(primeiraVez)
  })

  it('editar pesagem de mês fechado recalcula aquele mês e os seguintes', () => {
    // peso inicial de um mês depende das pesagens do mês anterior: mudar o
    // mês anterior muda automaticamente o mês seguinte quando recalculado.
    const antes = calcularPesoInicialDoMes({
      pesagensMesAnterior: [100, 99, 98],
      pesagensDesdeOInicio: [],
      pesagensMesCorrente: [],
      ehPrimeiroMes: false,
    })
    const depoisDeEditar = calcularPesoInicialDoMes({
      pesagensMesAnterior: [100, 99, 95], // uma pesagem do mês fechado foi corrigida
      pesagensDesdeOInicio: [],
      pesagensMesCorrente: [],
      ehPrimeiroMes: false,
    })
    expect(depoisDeEditar).not.toBeCloseTo(antes!, 6)
  })

  it('sem meta cadastrada, calcularFechamentoMensal sai sem_meta com bônus 0', () => {
    const resultado = calcularFechamentoMensal({
      mes: 3,
      pesagensMesAnterior: [98, 97, 96],
      pesagensDesdeOInicio: [100, 99, 98, 97, 96],
      pesagensMesCorrente: [96, 95, 94],
      ehPrimeiroMes: false,
      metaAnual: null,
      estavaEmManutencaoNoAno: false,
      streakMesesAnterior: 2,
      settings,
    })
    expect(resultado.status).toBe('sem_meta')
    expect(resultado.bonusTotal).toBe(0)
  })
})
