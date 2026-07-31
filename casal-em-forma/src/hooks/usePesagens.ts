import { useCallback, useEffect, useState } from 'react'
import {
  listarPesagens,
  registrarPesagem,
  editarPesagem,
  excluirPesagem,
} from '../services/weighIns'
import type { WeighIn } from '../types'

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
  }

  async function editar(id: string, pesoKg: number, dataISO: string) {
    await editarPesagem(id, { pesoKg, data: dataISO })
    await carregar()
  }

  async function excluir(id: string) {
    await excluirPesagem(id)
    await carregar()
  }

  return { pesagens, carregando, registrar, editar, excluir, recarregar: carregar }
}
