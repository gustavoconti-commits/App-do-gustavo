import { useState } from 'react'
import { ConfiguracoesScreen } from './ConfiguracoesScreen'
import { AnelDoDia } from '../components/AnelDoDia'
import { GraficoPesoCasal } from '../components/GraficoPesoCasal'
import { AderenciaSemanal } from '../components/AderenciaSemanal'
import { ProgressoMetaAno } from '../components/ProgressoMetaAno'
import { BonusPesoMes } from '../components/BonusPesoMes'
import { EscapadasDoMes } from '../components/EscapadasDoMes'
import { TabelaComparativa } from '../components/TabelaComparativa'
import { HistoricoMensal, type FechamentoComPerfil } from '../components/HistoricoMensal'
import { usePerfis } from '../hooks/usePerfis'
import { useHabitosDoDia } from '../hooks/useHabitosDoDia'
import { usePesagens } from '../hooks/usePesagens'
import { useMetaAnual } from '../hooks/useMetaAnual'
import { useFechamentoDoMes } from '../hooks/useFechamentoDoMes'
import { useHistoricoFechamentos } from '../hooks/useHistoricoFechamentos'
import { usePontosDoCasal, type PessoaPontos } from '../hooks/usePontosDoCasal'
import { calcularPontosHabitos, type HabitoParaPontos } from '../domain/pontos'
import type { ResgateParaEscapadas } from '../domain/escapadas'
import { hojeISO, primeiroDiaDoMesISO } from '../utils/data'
import type { Habit, Redemption, Settings } from '../types'

function paraDominio(h: Habit): HabitoParaPontos {
  return { id: h.id, diasSemana: h.dias_semana, criadoEm: h.criado_em, arquivadoEm: h.arquivado_em }
}

function paraResgateDominio(r: Redemption): ResgateParaEscapadas {
  return {
    escopo: r.escopo,
    categoria: r.categoria,
    profileId: r.profile_id,
    data: r.data,
    envolveComida: r.envolve_comida,
  }
}

/** Pontos ganhos no mês corrente: hábitos/bônus apurados só dentro do mês
 *  mais os créditos do ledger com data no mês. */
function pontosDoMes(pessoa: PessoaPontos, settings: Settings, hoje: string): number {
  const inicioMes = primeiroDiaDoMesISO(hoje)
  const inicio = settings.data_inicio > inicioMes ? settings.data_inicio : inicioMes
  const deHabitos = calcularPontosHabitos(
    pessoa.habitos.map(paraDominio),
    pessoa.logs.map((l) => ({ habitId: l.habit_id, data: l.data })),
    { ...settings, data_inicio: inicio },
    hoje,
  ).total
  const creditosDoMes = pessoa.lancamentos
    .filter((l) => l.data >= inicioMes && l.data <= hoje && l.pontos > 0)
    .reduce((soma, l) => soma + l.pontos, 0)
  return deHabitos + creditosDoMes
}

export function CasalScreen() {
  const [configAberta, setConfigAberta] = useState(false)
  const { perfis, porNome } = usePerfis()
  const gustavo = porNome('Gustavo')
  const julia = porNome('Júlia')
  const hoje = hojeISO()

  const pontos = usePontosDoCasal(perfis)
  const hojeG = useHabitosDoDia(gustavo?.id, hoje)
  const hojeJ = useHabitosDoDia(julia?.id, hoje)
  const pesagensG = usePesagens(gustavo?.id)
  const pesagensJ = usePesagens(julia?.id)
  const metaG = useMetaAnual(gustavo?.id)
  const metaJ = useMetaAnual(julia?.id)
  const fechamentoG = useFechamentoDoMes(gustavo?.id)
  const fechamentoJ = useFechamentoDoMes(julia?.id)
  const historicoG = useHistoricoFechamentos(gustavo?.id)
  const historicoJ = useHistoricoFechamentos(julia?.id)

  if (configAberta) {
    return <ConfiguracoesScreen aoVoltar={() => setConfigAberta(false)} />
  }

  if (!gustavo || !julia) {
    return (
      <div className="px-4 pb-24 pt-6">
        <h1 className="text-2xl font-extrabold">Casal em Forma</h1>
      </div>
    )
  }

  const duplas = [
    { perfil: gustavo, dia: hojeG, pesagens: pesagensG, meta: metaG, fechamento: fechamentoG },
    { perfil: julia, dia: hojeJ, pesagens: pesagensJ, meta: metaJ, fechamento: fechamentoJ },
  ]

  const perdaTotalKg = duplas.reduce((soma, { pesagens }) => {
    if (pesagens.pesagens.length === 0) return soma
    const primeira = pesagens.pesagens[0].peso_kg
    const ultima = pesagens.pesagens[pesagens.pesagens.length - 1].peso_kg
    return soma + (primeira - ultima)
  }, 0)

  const historicoMesclado: FechamentoComPerfil[] = [
    ...historicoG.fechamentos.map((fechamento) => ({ perfil: gustavo, fechamento })),
    ...historicoJ.fechamentos.map((fechamento) => ({ perfil: julia, fechamento })),
  ]

  const resgatesDominio = pontos.resgates.map(paraResgateDominio)
  const configuracao = pontos.settings

  return (
    <div className="px-4 pb-24 pt-6">
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-extrabold">Casal em Forma</h1>
        <button
          type="button"
          onClick={() => setConfigAberta(true)}
          aria-label="Configurações"
          className="flex h-11 w-11 items-center justify-center text-texto-fraco"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.56-1.11 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.08a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.08a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1.03Z" />
          </svg>
        </button>
      </div>

      <AnelDoDia
        externa={{
          nome: gustavo.nome,
          corHex: gustavo.cor_hex,
          feitos: hojeG.habitos.filter((h) => hojeG.marcados.has(h.id)).length,
          total: hojeG.habitos.length,
        }}
        interna={{
          nome: julia.nome,
          corHex: julia.cor_hex,
          feitos: hojeJ.habitos.filter((h) => hojeJ.marcados.has(h.id)).length,
          total: hojeJ.habitos.length,
        }}
        dataISO={hoje}
      />

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-card border border-borda bg-superficie p-3">
          <p className="text-xs text-texto-fraco">Perda do casal</p>
          <p className="num mt-1 text-lg">{perdaTotalKg.toFixed(1)} kg</p>
        </div>
        <div className="rounded-card border border-borda bg-superficie p-3">
          <p className="text-xs text-texto-fraco">Hábitos hoje</p>
          {duplas.map(({ perfil, dia }) => (
            <p key={perfil.id} className="num mt-1 text-sm">
              <span style={{ color: perfil.cor_hex }}>{perfil.nome.slice(0, 1)}</span>{' '}
              {dia.habitos.filter((h) => dia.marcados.has(h.id)).length}/{dia.habitos.length}
            </p>
          ))}
        </div>
        <div className="rounded-card border border-borda bg-superficie p-3">
          <p className="text-xs text-texto-fraco">Sequência</p>
          {duplas.map(({ perfil, fechamento }) => (
            <p key={perfil.id} className="num mt-1 text-sm">
              <span style={{ color: perfil.cor_hex }}>{perfil.nome.slice(0, 1)}</span>{' '}
              {fechamento.fechamento?.streak_meses ?? 0}{' '}
              {(fechamento.fechamento?.streak_meses ?? 0) === 1 ? 'mês' : 'meses'}
            </p>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-sm text-texto-fraco">Evolução de peso</h2>
        <GraficoPesoCasal
          series={duplas.map(({ perfil, pesagens, meta }) => ({
            nome: perfil.nome,
            corHex: perfil.cor_hex,
            pesagens: pesagens.pesagens,
            meta: meta.meta,
          }))}
          hoje={hoje}
        />
      </div>

      <AderenciaSemanal
        pessoas={pontos.pessoas.map((pessoa) => ({
          nome: pessoa.perfil.nome,
          corHex: pessoa.perfil.cor_hex,
          habitos: pessoa.habitos,
          logs: pessoa.logs,
        }))}
        hoje={hoje}
      />

      <ProgressoMetaAno
        pessoas={duplas.map(({ perfil, meta, pesagens }) => ({
          perfil,
          meta: meta.meta,
          ultimaPesagem: pesagens.pesagens[pesagens.pesagens.length - 1],
        }))}
        hoje={hoje}
      />

      <BonusPesoMes
        pessoas={duplas.map(({ perfil, fechamento }) => ({
          perfil,
          fechamento: fechamento.fechamento,
        }))}
      />

      {configuracao && pontos.pessoas.length === 2 && (
        <EscapadasDoMes
          pessoas={pontos.pessoas}
          resgates={resgatesDominio}
          settings={configuracao}
          hoje={hoje}
        />
      )}

      {configuracao && (
        <TabelaComparativa
          linhas={duplas.map(({ perfil, pesagens }) => {
            const pessoaPontos = pontos.pessoas.find((p) => p.perfil.id === perfil.id)
            return {
              perfil,
              pesoInicialKg: pesagens.pesagens[0]?.peso_kg ?? null,
              pesoAtualKg: pesagens.pesagens[pesagens.pesagens.length - 1]?.peso_kg ?? null,
              pontosDoMes: pessoaPontos ? pontosDoMes(pessoaPontos, configuracao, hoje) : 0,
            }
          })}
        />
      )}

      <HistoricoMensal itens={historicoMesclado} />
    </div>
  )
}
