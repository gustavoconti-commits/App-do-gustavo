// Banco local do modo demonstração: os mesmos dados que viveriam no
// Supabase, guardados em localStorage e semeados com um casal de exemplo.
// Nenhum byte sai do aparelho. Os módulos vizinhos desta pasta substituem os
// services reais quando o app é construído com `--mode demo`.
import { addDays, addMonths, format, getISODay, startOfMonth } from 'date-fns'
import type {
  AnnualGoal,
  Habit,
  HabitLog,
  LedgerEntry,
  MonthlyClosing,
  PiggyWithdrawal,
  Profile,
  Redemption,
  Settings,
  Transfer,
} from '../../types'
import type { TabelaSincronizada } from '../realtime'

export type BancoDemo = {
  profiles: Profile[]
  settings: Settings
  annual_goals: AnnualGoal[]
  habits: Habit[]
  habit_logs: HabitLog[]
  weigh_ins: { id: string; profile_id: string; data: string; peso_kg: number; observacao: string | null }[]
  monthly_closings: MonthlyClosing[]
  ledger: LedgerEntry[]
  redemptions: Redemption[]
  transfers: Transfer[]
  piggy_withdrawals: PiggyWithdrawal[]
}

const CHAVE = 'casal-em-forma-demo-v1'

export function novoId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `demo-${Math.random().toString(36).slice(2)}-${Date.now()}`
}

function dataISO(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

function agoraISO(): string {
  return new Date().toISOString()
}

/** Semeia um mês e meio de uso: hábitos, marcações quase perfeitas, pesagens
 *  em queda e a meta do ano — tudo relativo à data em que o demo é aberto,
 *  para o app acordar vivo em qualquer dia. */
function semear(): BancoDemo {
  const hoje = new Date()
  const inicioMesAtual = startOfMonth(hoje)
  const inicioMesAnterior = addMonths(inicioMesAtual, -1)
  const dataInicio = dataISO(inicioMesAnterior)
  const criadoEm = addDays(inicioMesAnterior, -3).toISOString()

  const gustavoId = novoId()
  const juliaId = novoId()

  const profiles: Profile[] = [
    { id: gustavoId, nome: 'Gustavo', cor_hex: '#3B82F6', altura_cm: 178, criado_em: criadoEm },
    { id: juliaId, nome: 'Júlia', cor_hex: '#F43F5E', altura_cm: 164, criado_em: criadoEm },
  ]

  const settings: Settings = {
    id: 1,
    data_inicio: dataInicio,
    pontos_por_habito: 1,
    bonus_dia_perfeito: 1,
    bonus_semana_perfeita: 5,
    limite_habitos_ativos: 5,
    faixa_parcial: 0.7,
    faixa_completa: 0.9,
    bonus_peso_parcial: 25,
    bonus_peso_completo: 60,
    bonus_streak_2: 40,
    bonus_streak_3mais: 80,
    tolerancia_manutencao_kg: 1,
    min_pesagens_mes: 3,
    meta_mensal_maxima_pct: 0.04,
    valor_ponto_cofrinho: 1,
    teto_cofrinho_mensal_reais: 0,
    pedagio_transferencia: 0.5,
    custo_tier_pequena: 30,
    custo_tier_media: 80,
    custo_escapada_pequena: 50,
    custo_escapada_grande: 140,
    custo_tier_casal: 120,
  }

  const nomesGustavo = ['Treinar', 'Beber 2L de água', 'Dormir antes das 23h', 'Caminhar 8 mil passos']
  const nomesJulia = ['Pilates', 'Beber 2L de água', 'Sem açúcar', 'Caminhar 6 mil passos']

  const habits: Habit[] = [
    ...nomesGustavo.map((nome, i) => ({
      id: novoId(),
      profile_id: gustavoId,
      nome,
      dias_semana: [1, 2, 3, 4, 5, 6, 7],
      pontos: 1,
      ordem: i,
      arquivado_em: null,
      criado_em: criadoEm,
    })),
    ...nomesJulia.map((nome, i) => ({
      id: novoId(),
      profile_id: juliaId,
      nome,
      dias_semana: [1, 2, 3, 4, 5, 6, 7],
      pontos: 1,
      ordem: i,
      arquivado_em: null,
      criado_em: criadoEm,
    })),
  ]

  const habitosDe = (profileId: string) => habits.filter((h) => h.profile_id === profileId)

  const habit_logs: HabitLog[] = []
  const hojeStr = dataISO(hoje)
  for (let d = new Date(inicioMesAnterior); dataISO(d) <= hojeStr; d = addDays(d, 1)) {
    const dia = dataISO(d)
    const ehHoje = dia === hojeStr
    // Gustavo: tudo marcado até ontem; hoje 2 de 4, para o anel aparecer pela metade
    habitosDe(gustavoId).forEach((h, i) => {
      if (ehHoje ? i < 2 : true) {
        habit_logs.push({ id: novoId(), habit_id: h.id, profile_id: gustavoId, data: dia, criado_em: agoraISO() })
      }
    })
    // Júlia: pula o 3º hábito às quintas; hoje 3 de 4
    habitosDe(juliaId).forEach((h, i) => {
      const pulaHoje = ehHoje && i === 3
      const pulaQuinta = !ehHoje && i === 2 && getISODay(d) === 4
      if (!pulaHoje && !pulaQuinta) {
        habit_logs.push({ id: novoId(), habit_id: h.id, profile_id: juliaId, data: dia, criado_em: agoraISO() })
      }
    })
  }

  const weigh_ins: BancoDemo['weigh_ins'] = []
  const pesagem = (profileId: string, d: Date, peso: number) => {
    if (dataISO(d) <= hojeStr) {
      weigh_ins.push({
        id: novoId(),
        profile_id: profileId,
        data: dataISO(d),
        peso_kg: Math.round(peso * 10) / 10,
        observacao: null,
      })
    }
  }
  // mês anterior: 6 pesagens em queda; mês atual: a cada 4 dias
  for (let i = 0; i < 6; i++) {
    pesagem(gustavoId, addDays(inicioMesAnterior, 2 + i * 5), 95.0 - i * 0.22)
    pesagem(juliaId, addDays(inicioMesAnterior, 2 + i * 5), 68.5 - i * 0.16)
  }
  for (let i = 0; i < 8; i++) {
    pesagem(gustavoId, addDays(inicioMesAtual, 1 + i * 4), 93.8 - i * 0.13)
    pesagem(juliaId, addDays(inicioMesAtual, 1 + i * 4), 67.6 - i * 0.1)
  }

  const ano = hoje.getFullYear()
  const annual_goals: AnnualGoal[] = [
    {
      id: novoId(),
      profile_id: gustavoId,
      ano,
      data_criacao: dataInicio,
      peso_base_kg: 95.0,
      kg_a_perder: 8,
      peso_alvo_kg: 87.0,
      criado_em: agoraISOAntes(),
    },
    {
      id: novoId(),
      profile_id: juliaId,
      ano,
      data_criacao: dataInicio,
      peso_base_kg: 68.5,
      kg_a_perder: 5,
      peso_alvo_kg: 63.5,
      criado_em: agoraISOAntes(),
    },
  ]

  function agoraISOAntes(): string {
    return inicioMesAnterior.toISOString()
  }

  return {
    profiles,
    settings,
    annual_goals,
    habits,
    habit_logs,
    weigh_ins,
    monthly_closings: [],
    ledger: [],
    redemptions: [],
    transfers: [],
    piggy_withdrawals: [],
  }
}

let banco: BancoDemo | null = null

export function obterBanco(): BancoDemo {
  if (banco) return banco
  try {
    const salvo = localStorage.getItem(CHAVE)
    if (salvo) {
      banco = JSON.parse(salvo) as BancoDemo
      return banco
    }
  } catch {
    // localStorage indisponível (ex.: navegação privada): segue só em memória
  }
  banco = semear()
  salvar()
  return banco
}

export function salvar(): void {
  if (!banco) return
  try {
    localStorage.setItem(CHAVE, JSON.stringify(banco))
  } catch {
    // sem persistência disponível: o demo continua funcionando em memória
  }
}

// Barramento local que faz as vezes do Realtime: cada escrita avisa os
// ouvintes registrados (useRealtimeInvalidation), e as outras telas recarregam.
type Ouvinte = (tabela: TabelaSincronizada) => void
const ouvintes = new Set<Ouvinte>()

export function aoMudarTabela(ouvinte: Ouvinte): () => void {
  ouvintes.add(ouvinte)
  return () => {
    ouvintes.delete(ouvinte)
  }
}

export function notificar(tabela: TabelaSincronizada): void {
  salvar()
  ouvintes.forEach((o) => o(tabela))
}
