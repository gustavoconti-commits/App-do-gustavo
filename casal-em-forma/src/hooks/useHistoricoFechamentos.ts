import { useCallback, useEffect, useState } from 'react'
import { listarFechamentos } from '../services/monthlyClosings'
import { useRecarregarQuandoMudar } from './useRealtimeInvalidation'
import type { MonthlyClosing } from '../types'

export function useHistoricoFechamentos(profileId: string | undefined) {
  const [fechamentos, setFechamentos] = useState<MonthlyClosing[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    if (!profileId) return
    setCarregando(true)
    setFechamentos(await listarFechamentos(profileId))
    setCarregando(false)
  }, [profileId])

  useEffect(() => {
    carregar()
  }, [carregar])

  useRecarregarQuandoMudar(['monthly_closings'], carregar)

  return { fechamentos, carregando, recarregar: carregar }
}
