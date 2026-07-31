import { useCallback, useEffect, useState } from 'react'
import {
  listarPesagens,
  registrarPesagem,
  editarPesagem,
  excluirPesagem,
} from '../services/weighIns'
import { buscarFechamento } from '../services/monthlyClosings'
import { recalcularAPartirDoMes, executarFechamentosPendentes } from '../services/fechamentoMensal'
import { primeiroDiaDoMesISO } from '../utils/data'
import type { WeighIn } from '../types'

/** Se a data cair num mês já fechado, reabre e recalcula em cascata (seção
 *  8.7). Senão, só refaz os fechamentos pendentes normalmente. */
async function reconciliarFechamentos(profileId: string, dataAfetadaISO: string) {
  const anoMesISO = primeiroDiaDoMesISO(dataAfetadaISO)
  const fechamento = await buscarFechamento(profileId, anoMesISO)
  if (fechamento?.status === 'fechado') {
    await recalcularAPartirDoMes(profileId, anoMesISO)
  } else {
    await executarFechamentosPendentes(profileId)
  }
}

export function usePesagens(profileId: string | undefined) {
  const [pesagens, setPesagens] = useState<WeighIn[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    if (!profileId) return
    setCarregando(true)
    setPesagens(await listarPesagens(profileId))
    setCarregando(false)
  }, [profileId])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function registrar(dataISO: string, pesoKg: number, observacao?: string) {
    if (!profileId) return
    await registrarPesagem({ profileId, data: dataISO, pesoKg, observacao })
    await carregar()
    await reconciliarFechamentos(profileId, dataISO)
  }

  async function editar(id: string, pesoKg: number, dataISO: string) {
    if (!profileId) return
    await editarPesagem(id, { pesoKg, data: dataISO })
    await carregar()
    await reconciliarFechamentos(profileId, dataISO)
  }

  async function excluir(id: string) {
    if (!profileId) return
    const pesagem = pesagens.find((p) => p.id === id)
    await excluirPesagem(id)
    await carregar()
    if (pesagem) await reconciliarFechamentos(profileId, pesagem.data)
  }

  return { pesagens, carregando, registrar, editar, excluir, recarregar: carregar }
}
