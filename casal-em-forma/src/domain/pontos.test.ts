import { describe, it, expect } from 'vitest'
import {
  calcularPontosDoDia,
  semanaEhPerfeita,
  calcularPontosHabitos,
  calcularTransferencia,
  criarLancamentosTransferencia,
  calcularTotalGanho,
  calcularSaldo,
  SaldoInsuficienteError,
  type HabitoParaPontos,
  type LogParaPontos,
  type SettingsParaPontos,
} from './pontos'

const settings: SettingsParaPontos = {
  pontos_por_habito: 1,
  bonus_dia_perfeito: 1,
  bonus_semana_perfeita: 5,
  data_inicio: '2026-08-01',
}

function habito(
  id: string,
  diasSemana: number[],
  extras: Partial<HabitoParaPontos> = {},
): HabitoParaPontos {
  return { id, diasSemana, criadoEm: '2026-07-01', arquivadoEm: null, ...extras }
}

describe('pontos.ts', () => {
  it('hábito marcado gera pontos_por_habito; desmarcar zera', () => {
    const habitos = [habito('h1', [1, 2, 3, 4, 5, 6, 7])]
    const dia = '2026-08-03' // segunda

    const marcado = calcularPontosDoDia(habitos, [{ habitId: 'h1', data: dia }], dia, settings)
    expect(marcado.pontosHabitos).toBe(1)

    const desmarcado = calcularPontosDoDia(habitos, [], dia, settings)
    expect(desmarcado.pontosHabitos).toBe(0)
  })

  it('dia com todos os hábitos marcados gera +1 uma única vez', () => {
    const habitos = [
      habito('h1', [1, 2, 3, 4, 5, 6, 7]),
      habito('h2', [1, 2, 3, 4, 5, 6, 7]),
      habito('h3', [1, 2, 3, 4, 5, 6, 7]),
    ]
    const dia = '2026-08-03'
    const logs: LogParaPontos[] = [
      { habitId: 'h1', data: dia },
      { habitId: 'h2', data: dia },
      { habitId: 'h3', data: dia },
    ]
    const resultado = calcularPontosDoDia(habitos, logs, dia, settings)
    expect(resultado.diaPerfeito).toBe(true)
    expect(resultado.bonusDiaPerfeito).toBe(1)
    expect(resultado.pontosHabitos).toBe(3)
  })

  it('dia sem hábitos programados não conta como dia perfeito', () => {
    // hábito programado só às segundas; 2026-08-04 é uma terça
    const habitos = [habito('h1', [1])]
    const resultado = calcularPontosDoDia(habitos, [], '2026-08-04', settings)
    expect(resultado.diaPerfeito).toBe(false)
    expect(resultado.bonusDiaPerfeito).toBe(0)
  })

  it('semana com 6 dias perfeitos e 1 falho não gera +5', () => {
    const habitos = [habito('h1', [1, 2, 3, 4, 5, 6, 7])]
    const diasDaSemana = [
      '2026-08-03',
      '2026-08-04',
      '2026-08-05',
      '2026-08-06',
      '2026-08-07',
      '2026-08-08',
      '2026-08-09',
    ]
    // marca todos os dias menos o último
    const logs: LogParaPontos[] = diasDaSemana
      .slice(0, 6)
      .map((data) => ({ habitId: 'h1', data }))

    const perfeita = semanaEhPerfeita('2026-08-03', habitos, logs, settings, '2026-08-09')
    expect(perfeita).toBe(false)
  })

  it('semana de 27/07 a 02/08/2026 não gera bônus (está antes de data_inicio)', () => {
    const habitos = [habito('h1', [1, 2, 3, 4, 5, 6, 7], { criadoEm: '2026-07-01' })]
    const diasDaSemana = [
      '2026-07-27',
      '2026-07-28',
      '2026-07-29',
      '2026-07-30',
      '2026-07-31',
      '2026-08-01',
      '2026-08-02',
    ]
    const logs: LogParaPontos[] = diasDaSemana.map((data) => ({ habitId: 'h1', data }))

    const perfeita = semanaEhPerfeita('2026-07-27', habitos, logs, settings, '2026-08-02')
    expect(perfeita).toBe(false)
  })

  it('semana de 03 a 09/08/2026 gera +5 se os 7 dias forem perfeitos', () => {
    const habitos = [habito('h1', [1, 2, 3, 4, 5, 6, 7])]
    const diasDaSemana = [
      '2026-08-03',
      '2026-08-04',
      '2026-08-05',
      '2026-08-06',
      '2026-08-07',
      '2026-08-08',
      '2026-08-09',
    ]
    const logs: LogParaPontos[] = diasDaSemana.map((data) => ({ habitId: 'h1', data }))

    const perfeita = semanaEhPerfeita('2026-08-03', habitos, logs, settings, '2026-08-09')
    expect(perfeita).toBe(true)

    const resultado = calcularPontosHabitos(habitos, logs, settings, '2026-08-09')
    expect(resultado.semanasPerfeitas).toContain('2026-08-03')
    expect(resultado.bonusSemanasPerfeitas).toBe(5)
  })

  it('hábito arquivado no meio da semana não invalida os dias anteriores', () => {
    // arquivado na quinta (06/08): dias antes continuam contando como perfeitos
    const habitos = [
      habito('h1', [1, 2, 3, 4, 5, 6, 7], { arquivadoEm: '2026-08-06' }),
    ]
    const antesDoArquivamento = calcularPontosDoDia(
      habitos,
      [{ habitId: 'h1', data: '2026-08-04' }],
      '2026-08-04',
      settings,
    )
    expect(antesDoArquivamento.diaPerfeito).toBe(true)

    // no dia do arquivamento em diante, o hábito não conta mais
    const noDiaDoArquivamento = calcularPontosDoDia(
      habitos,
      [{ habitId: 'h1', data: '2026-08-06' }],
      '2026-08-06',
      settings,
    )
    expect(noDiaDoArquivamento.diaPerfeito).toBe(false)
    expect(noDiaDoArquivamento.pontosHabitos).toBe(0)
  })

  it('transferência de 21 entrega 10 e debita 21', () => {
    const resultado = calcularTransferencia(30, 21, 0.5)
    expect(resultado.pontosEnviados).toBe(21)
    expect(resultado.pontosRecebidos).toBe(10)
  })

  it('transferência recebida não aumenta o cofrinho do destinatário', () => {
    const transferencia = calcularTransferencia(30, 21, 0.5)
    const { recebimento } = criarLancamentosTransferencia(transferencia)
    expect(recebimento.contaParaTotalGanho).toBe(false)

    const totalGanho = calcularTotalGanho(0, [recebimento])
    expect(totalGanho).toBe(0)
  })

  it('saldo nunca fica negativo', () => {
    expect(() => calcularTransferencia(10, 21, 0.5)).toThrow(SaldoInsuficienteError)

    // saldo calculado nunca fica negativo quando a transferência é validada antes de debitar
    const saldoAntes = calcularSaldo(0, [{ pontos: 10 }])
    expect(saldoAntes).toBe(10)
    expect(() => calcularTransferencia(saldoAntes, 21, 0.5)).toThrow()
  })
})
