// Calibrador da economia (seção 7.3 do PROMPT MESTRE v3). Funções puras.
//
// Os pontos precisam ser proporcionais ao que se pode gastar: um mês bom deve
// pagar exatamente as duas escapadas, quase sem sobra. O calibrador recalcula
// os totais a partir do número REAL de hábitos ativos, para que a inflação de
// um 5º hábito apareça na tela e os preços sejam reajustados sem tocar no
// código.

export type SettingsParaCalibrador = {
  pontos_por_habito: number
  bonus_dia_perfeito: number
  bonus_semana_perfeita: number
  bonus_peso_completo: number
  custo_escapada_pequena: number
  custo_escapada_grande: number
}

// Mês de referência do documento: 30 dias, 4 semanas completas.
const DIAS_NO_MES = 30
const SEMANAS_NO_MES = 4

type Cenario = {
  aderencia: number // fração dos hábitos marcados
  diasPerfeitos: number
  semanasPerfeitas: number
  comBonusPeso: boolean
}

// Cenários calibrados para reproduzir a tabela da seção 7.3
// (com 4 hábitos/dia: máximo 230 · bom 192 · fraco 80).
const CENARIOS: Record<'maximo' | 'bom' | 'fraco', Cenario> = {
  maximo: { aderencia: 1, diasPerfeitos: DIAS_NO_MES, semanasPerfeitas: SEMANAS_NO_MES, comBonusPeso: true },
  bom: { aderencia: 0.85, diasPerfeitos: 20, semanasPerfeitas: 2, comBonusPeso: true },
  fraco: { aderencia: 0.6, diasPerfeitos: 8, semanasPerfeitas: 0, comBonusPeso: false },
}

function pontosDoCenario(
  qtdHabitosAtivos: number,
  settings: SettingsParaCalibrador,
  cenario: Cenario,
): number {
  const habitos = Math.round(
    qtdHabitosAtivos * DIAS_NO_MES * cenario.aderencia * settings.pontos_por_habito,
  )
  const diasPerfeitos = cenario.diasPerfeitos * settings.bonus_dia_perfeito
  const semanasPerfeitas = cenario.semanasPerfeitas * settings.bonus_semana_perfeita
  const bonusPeso = cenario.comBonusPeso ? settings.bonus_peso_completo : 0
  return habitos + diasPerfeitos + semanasPerfeitas + bonusPeso
}

export type ResultadoCalibrador = {
  maximo: number
  bom: number
  fraco: number
  custoDuasEscapadas: number
  folgaMesBom: number
}

export function calcularCalibrador(
  qtdHabitosAtivos: number,
  settings: SettingsParaCalibrador,
): ResultadoCalibrador {
  const maximo = pontosDoCenario(qtdHabitosAtivos, settings, CENARIOS.maximo)
  const bom = pontosDoCenario(qtdHabitosAtivos, settings, CENARIOS.bom)
  const fraco = pontosDoCenario(qtdHabitosAtivos, settings, CENARIOS.fraco)
  const custoDuasEscapadas = settings.custo_escapada_pequena + settings.custo_escapada_grande
  return { maximo, bom, fraco, custoDuasEscapadas, folgaMesBom: bom - custoDuasEscapadas }
}
