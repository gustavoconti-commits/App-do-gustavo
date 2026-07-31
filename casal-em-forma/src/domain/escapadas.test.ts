import { describe, it, expect } from 'vitest'
import {
  dataUsoEscapadaNoMes,
  estadoEscapada,
  estadoRecompensaCasal,
  textoEstadoEscapada,
  validarResgateEscapada,
  validarRecompensaCasal,
  EscapadaJaUsadaError,
  RecompensaCasalIndisponivelError,
  type ResgateParaEscapadas,
  type CategoriaEscapada,
} from './escapadas'

const GUSTAVO = 'perfil-gustavo'
const JULIA = 'perfil-julia'

function escapadaIndividual(
  profileId: string,
  categoria: CategoriaEscapada,
  data: string,
): ResgateParaEscapadas {
  return { escopo: 'individual', categoria, profileId, data, envolveComida: true }
}

function recompensaCasal(data: string, envolveComida: boolean): ResgateParaEscapadas {
  return { escopo: 'casal', categoria: 'casal', profileId: null, data, envolveComida }
}

describe('escapadas.ts', () => {
  it('primeira escapada grande do mês passa; a segunda é recusada', () => {
    expect(() =>
      validarResgateEscapada({
        resgates: [],
        profileId: GUSTAVO,
        categoria: 'escapada_grande',
        dataISO: '2026-08-12',
      }),
    ).not.toThrow()

    const resgates = [escapadaIndividual(GUSTAVO, 'escapada_grande', '2026-08-12')]
    expect(() =>
      validarResgateEscapada({
        resgates,
        profileId: GUSTAVO,
        categoria: 'escapada_grande',
        dataISO: '2026-08-20',
      }),
    ).toThrow(EscapadaJaUsadaError)

    const estado = estadoEscapada({
      resgates,
      profileId: GUSTAVO,
      categoria: 'escapada_grande',
      custo: 140,
      saldo: 500,
      hojeISO: '2026-08-20',
    })
    expect(textoEstadoEscapada('escapada_grande', estado)).toBe(
      'Escapada grande já usada em 12/08. Libera em 01/09.',
    )
  })

  it('escapada grande do Gustavo não bloqueia a da Júlia', () => {
    const resgates = [escapadaIndividual(GUSTAVO, 'escapada_grande', '2026-08-12')]
    expect(() =>
      validarResgateEscapada({
        resgates,
        profileId: JULIA,
        categoria: 'escapada_grande',
        dataISO: '2026-08-15',
      }),
    ).not.toThrow()
    expect(dataUsoEscapadaNoMes(resgates, JULIA, 'escapada_grande', '2026-08-15')).toBeNull()
  })

  it('escapada pequena e grande são independentes entre si', () => {
    const resgates = [escapadaIndividual(GUSTAVO, 'escapada_grande', '2026-08-12')]
    expect(() =>
      validarResgateEscapada({
        resgates,
        profileId: GUSTAVO,
        categoria: 'escapada_pequena',
        dataISO: '2026-08-15',
      }),
    ).not.toThrow()

    const comAsDuas = [...resgates, escapadaIndividual(GUSTAVO, 'escapada_pequena', '2026-08-15')]
    expect(() =>
      validarResgateEscapada({
        resgates: comAsDuas,
        profileId: GUSTAVO,
        categoria: 'escapada_pequena',
        dataISO: '2026-08-20',
      }),
    ).toThrow(EscapadaJaUsadaError)
  })

  it('recompensa de casal marcada como comida consome a grande dos dois', () => {
    const resgates = [recompensaCasal('2026-08-10', true)]

    for (const pessoa of [GUSTAVO, JULIA]) {
      expect(() =>
        validarResgateEscapada({
          resgates,
          profileId: pessoa,
          categoria: 'escapada_grande',
          dataISO: '2026-08-18',
        }),
      ).toThrow(EscapadaJaUsadaError)
      // A pequena segue livre — só a grande é consumida.
      expect(() =>
        validarResgateEscapada({
          resgates,
          profileId: pessoa,
          categoria: 'escapada_pequena',
          dataISO: '2026-08-18',
        }),
      ).not.toThrow()
    }

    // Sem comida, a recompensa de casal não toca nas travas.
    const semComida = [recompensaCasal('2026-08-10', false)]
    expect(dataUsoEscapadaNoMes(semComida, GUSTAVO, 'escapada_grande', '2026-08-18')).toBeNull()

    // E uma nova recompensa de casal com comida fica indisponível enquanto a grande estiver consumida.
    expect(() =>
      validarRecompensaCasal({
        pessoas: [
          { profileId: GUSTAVO, nome: 'Gustavo', saldo: 200 },
          { profileId: JULIA, nome: 'Júlia', saldo: 200 },
        ],
        envolveComida: true,
        custoPorPessoa: 120,
        resgates,
        dataISO: '2026-08-18',
      }),
    ).toThrow(RecompensaCasalIndisponivelError)
  })

  it('no dia 1º do mês seguinte, as duas voltam a ficar disponíveis', () => {
    const resgates = [
      escapadaIndividual(GUSTAVO, 'escapada_grande', '2026-08-12'),
      escapadaIndividual(GUSTAVO, 'escapada_pequena', '2026-08-20'),
    ]

    for (const categoria of ['escapada_grande', 'escapada_pequena'] as const) {
      expect(() =>
        validarResgateEscapada({
          resgates,
          profileId: GUSTAVO,
          categoria,
          dataISO: '2026-09-01',
        }),
      ).not.toThrow()

      const estado = estadoEscapada({
        resgates,
        profileId: GUSTAVO,
        categoria,
        custo: 140,
        saldo: 200,
        hojeISO: '2026-09-01',
      })
      expect(estado).toEqual({ estado: 'disponivel' })
    }
  })

  it('sem saldo o botão explica quanto falta', () => {
    const estado = estadoEscapada({
      resgates: [],
      profileId: JULIA,
      categoria: 'escapada_grande',
      custo: 140,
      saldo: 105,
      hojeISO: '2026-08-15',
    })
    expect(estado).toEqual({ estado: 'sem_saldo', faltam: 35 })
    expect(textoEstadoEscapada('escapada_grande', estado)).toBe('Faltam 35 pontos')

    const casal = estadoRecompensaCasal({
      pessoas: [
        { profileId: GUSTAVO, nome: 'Gustavo', saldo: 150 },
        { profileId: JULIA, nome: 'Júlia', saldo: 85 },
      ],
      envolveComida: false,
      custoPorPessoa: 120,
      resgates: [],
      hojeISO: '2026-08-15',
    })
    expect(casal).toEqual({
      disponivel: false,
      motivos: ['Júlia precisa de mais 35 pontos'],
    })
  })
})
