import { describe, it, expect } from 'vitest'
import { calcularCalibrador, type SettingsParaCalibrador } from './calibradorEconomia'

const settings: SettingsParaCalibrador = {
  pontos_por_habito: 1,
  bonus_dia_perfeito: 1,
  bonus_semana_perfeita: 5,
  bonus_peso_completo: 60,
  custo_escapada_pequena: 50,
  custo_escapada_grande: 140,
}

describe('calibradorEconomia.ts', () => {
  it('com 4 hábitos/dia reproduz a tabela da seção 7.3: máximo 230 · bom 192 · fraco 80', () => {
    const resultado = calcularCalibrador(4, settings)
    expect(resultado.maximo).toBe(230)
    expect(resultado.bom).toBe(192)
    expect(resultado.fraco).toBe(80)
    expect(resultado.custoDuasEscapadas).toBe(190)
    expect(resultado.folgaMesBom).toBe(2)
  })

  it('um 5º hábito infla a economia e a folga do mês bom cresce', () => {
    const com4 = calcularCalibrador(4, settings)
    const com5 = calcularCalibrador(5, settings)
    expect(com5.maximo).toBeGreaterThan(com4.maximo)
    expect(com5.folgaMesBom).toBeGreaterThan(com4.folgaMesBom)
    // O custo das escapadas não muda sozinho — é isso que o calibrador expõe.
    expect(com5.custoDuasEscapadas).toBe(com4.custoDuasEscapadas)
  })
})
