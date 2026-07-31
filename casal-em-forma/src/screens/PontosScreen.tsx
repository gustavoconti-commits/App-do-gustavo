import { usePerfis } from '../hooks/usePerfis'
import { usePontosDoCasal, type PessoaPontos } from '../hooks/usePontosDoCasal'
import { SaldosCasal } from '../components/SaldosCasal'
import { EscapadasDoMes } from '../components/EscapadasDoMes'
import { ProgressoProximaRecompensa } from '../components/ProgressoProximaRecompensa'
import { SecaoResgatesIndividuais } from '../components/SecaoResgatesIndividuais'
import { RecompensaCasalCard } from '../components/RecompensaCasalCard'
import { SecaoTransferencia } from '../components/SecaoTransferencia'
import { SecaoCofrinho } from '../components/SecaoCofrinho'
import { HistoricoResgates } from '../components/HistoricoResgates'
import { HistoricoTransferenciasSaques } from '../components/HistoricoTransferenciasSaques'
import {
  validarResgateEscapada,
  validarRecompensaCasal,
  type ResgateParaEscapadas,
} from '../domain/escapadas'
import type { ResultadoTransferencia } from '../domain/pontos'
import { registrarResgateIndividual, registrarResgateCasal } from '../services/redemptions'
import { registrarTransferencia } from '../services/transfers'
import { registrarSaque } from '../services/piggyWithdrawals'
import { hojeISO } from '../utils/data'
import type { Redemption, RedemptionCategoria } from '../types'

function paraResgateDominio(r: Redemption): ResgateParaEscapadas {
  return {
    escopo: r.escopo,
    categoria: r.categoria,
    profileId: r.profile_id,
    data: r.data,
    envolveComida: r.envolve_comida,
  }
}

export function PontosScreen() {
  const { perfis } = usePerfis()
  const { settings, pessoas, resgates, transferencias, saques, recarregar } =
    usePontosDoCasal(perfis)
  const hoje = hojeISO()

  if (!settings || pessoas.length < 2) {
    return (
      <div className="px-4 pb-24 pt-6">
        <h1 className="text-2xl font-extrabold">Pontos</h1>
      </div>
    )
  }

  const resgatesDominio = resgates.map(paraResgateDominio)

  function nomePorPerfil(profileId: string | null): string {
    if (profileId === null) return 'Casal'
    return perfis.find((p) => p.id === profileId)?.nome ?? '—'
  }

  async function resgatarIndividual(
    pessoa: PessoaPontos,
    categoria: Exclude<RedemptionCategoria, 'casal'>,
    custo: number,
    descricao: string,
  ) {
    if (categoria === 'escapada_pequena' || categoria === 'escapada_grande') {
      validarResgateEscapada({
        resgates: resgatesDominio,
        profileId: pessoa.perfil.id,
        categoria,
        dataISO: hoje,
      })
    }
    if (pessoa.saldo < custo) {
      throw new Error(`Faltam ${custo - pessoa.saldo} pontos`)
    }
    await registrarResgateIndividual({
      profileId: pessoa.perfil.id,
      categoria,
      pontosGastos: custo,
      descricao,
      data: hoje,
    })
    await recarregar()
  }

  async function resgatarCasal(envolveComida: boolean, descricao: string) {
    if (!settings || pessoas.length < 2) return
    validarRecompensaCasal({
      pessoas: pessoas.map((p) => ({
        profileId: p.perfil.id,
        nome: p.perfil.nome,
        saldo: p.saldo,
      })),
      envolveComida,
      custoPorPessoa: settings.custo_tier_casal,
      resgates: resgatesDominio,
      dataISO: hoje,
    })
    await registrarResgateCasal({
      profileIds: [pessoas[0].perfil.id, pessoas[1].perfil.id],
      pontosPorPessoa: settings.custo_tier_casal,
      descricao,
      envolveComida,
      data: hoje,
    })
    await recarregar()
  }

  async function transferir(
    de: PessoaPontos,
    para: PessoaPontos,
    resultado: ResultadoTransferencia,
  ) {
    await registrarTransferencia({
      deProfileId: de.perfil.id,
      paraProfileId: para.perfil.id,
      nomeDe: de.perfil.nome,
      nomePara: para.perfil.nome,
      pontosEnviados: resultado.pontosEnviados,
      pontosRecebidos: resultado.pontosRecebidos,
      data: hoje,
    })
    await recarregar()
  }

  async function sacar(pessoa: PessoaPontos, valorReais: number, descricao: string) {
    await registrarSaque({
      profileId: pessoa.perfil.id,
      valorReais,
      descricao: descricao.length > 0 ? descricao : undefined,
      data: hoje,
    })
    await recarregar()
  }

  return (
    <div className="px-4 pb-24 pt-6">
      <h1 className="text-2xl font-extrabold">Pontos</h1>

      <SaldosCasal pessoas={pessoas} />

      <EscapadasDoMes
        pessoas={pessoas}
        resgates={resgatesDominio}
        settings={settings}
        hoje={hoje}
      />

      <ProgressoProximaRecompensa pessoas={pessoas} settings={settings} />

      <SecaoResgatesIndividuais
        pessoas={pessoas}
        resgates={resgatesDominio}
        settings={settings}
        hoje={hoje}
        aoResgatar={resgatarIndividual}
      />

      <RecompensaCasalCard
        pessoas={pessoas}
        resgates={resgatesDominio}
        settings={settings}
        hoje={hoje}
        aoResgatar={resgatarCasal}
      />

      <SecaoTransferencia pessoas={pessoas} settings={settings} aoTransferir={transferir} />

      <SecaoCofrinho pessoas={pessoas} aoSacar={sacar} />

      <HistoricoResgates resgates={resgates} nomePorPerfil={nomePorPerfil} />

      <HistoricoTransferenciasSaques
        transferencias={transferencias}
        saques={saques}
        nomePorPerfil={nomePorPerfil}
      />
    </div>
  )
}
