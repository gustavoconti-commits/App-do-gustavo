import { useCallback, useEffect, useState } from 'react'
import { buscarSettings } from '../services/settings'
import { listarHabitos } from '../services/habits'
import { listarLogsNoPeriodo } from '../services/habitLogs'
import { listarLancamentos } from '../services/ledger'
import { listarResgates } from '../services/redemptions'
import { listarTransferencias } from '../services/transfers'
import { listarSaques } from '../services/piggyWithdrawals'
import {
  calcularPontosHabitos,
  calcularSaldo,
  calcularTotalGanho,
  calcularCofrinho,
  type HabitoParaPontos,
} from '../domain/pontos'
import { hojeISO, diasAtrasISO } from '../utils/data'
import type {
  Habit,
  HabitLog,
  LedgerEntry,
  PiggyWithdrawal,
  Profile,
  Redemption,
  Settings,
  Transfer,
} from '../types'

function paraDominio(h: Habit): HabitoParaPontos {
  return { id: h.id, diasSemana: h.dias_semana, criadoEm: h.criado_em, arquivadoEm: h.arquivado_em }
}

export type PessoaPontos = {
  perfil: Profile
  saldo: number
  totalGanho: number
  cofrinho: number
  lancamentos: LedgerEntry[]
  habitos: Habit[]
  logs: HabitLog[]
}

/** Saldo, total ganho e cofrinho dos dois perfis, mais os históricos que a
 *  aba Pontos exibe. Tudo derivado — nenhum valor de saldo vem do banco. */
export function usePontosDoCasal(perfis: Profile[]) {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [pessoas, setPessoas] = useState<PessoaPontos[]>([])
  const [resgates, setResgates] = useState<Redemption[]>([])
  const [transferencias, setTransferencias] = useState<Transfer[]>([])
  const [saques, setSaques] = useState<PiggyWithdrawal[]>([])
  const [carregando, setCarregando] = useState(true)

  const chavePerfis = perfis.map((p) => p.id).join(',')

  const carregar = useCallback(async () => {
    if (perfis.length === 0) return
    setCarregando(true)
    try {
      const hoje = hojeISO()
      const [config, todosResgates, todasTransferencias, todosSaques] = await Promise.all([
        buscarSettings(),
        listarResgates(),
        listarTransferencias(),
        listarSaques(),
      ])

      // A janela de logs cobre também os últimos 7 dias mesmo antes de
      // data_inicio — a aderência do dashboard mostra marcações reais,
      // ainda que só o período de apuração pontue.
      const inicioJanela =
        config.data_inicio < diasAtrasISO(hoje, 6) ? config.data_inicio : diasAtrasISO(hoje, 6)

      const dadosPessoas = await Promise.all(
        perfis.map(async (perfil) => {
          const [habitos, logs, lancamentos] = await Promise.all([
            listarHabitos(perfil.id),
            listarLogsNoPeriodo(perfil.id, inicioJanela, hoje),
            listarLancamentos(perfil.id),
          ])
          const pontosHabitos = calcularPontosHabitos(
            habitos.map(paraDominio),
            logs.map((l) => ({ habitId: l.habit_id, data: l.data })),
            config,
            hoje,
          ).total
          const saldo = calcularSaldo(pontosHabitos, lancamentos)
          const totalGanho = calcularTotalGanho(
            pontosHabitos,
            lancamentos.map((l) => ({
              pontos: l.pontos,
              contaParaTotalGanho: l.conta_para_total_ganho,
            })),
          )
          const cofrinho = calcularCofrinho(
            totalGanho,
            config.valor_ponto_cofrinho,
            todosSaques
              .filter((s) => s.profile_id === perfil.id)
              .map((s) => ({ valorReais: s.valor_reais })),
          )
          return { perfil, saldo, totalGanho, cofrinho, lancamentos, habitos, logs }
        }),
      )

      setSettings(config)
      setPessoas(dadosPessoas)
      setResgates(todosResgates)
      setTransferencias(todasTransferencias)
      setSaques(todosSaques)
    } finally {
      setCarregando(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chavePerfis])

  useEffect(() => {
    carregar()
  }, [carregar])

  return { settings, pessoas, resgates, transferencias, saques, carregando, recarregar: carregar }
}
