import { useCallback, useEffect, useState } from 'react'
import { buscarFechamento } from '../services/monthlyClosings'
import { infoDoMes, hojeISO } from '../utils/data'
import { useRecarregarQuandoMudar } from './useRealtimeInvalidation'
import type { MonthlyClosing } from '../types'

export function useFechamentoDoMes(profileId: string | undefined) {
  const [fechamento, setFechamento] = useState<MonthlyClosing | null>(null)
  const [carregando, setCarregando] = useState(true)
  const anoMesISO = infoDoMes(hojeISO()).anoMesISO

  const carregar = useCallback(async () => {
    if (!profileId) return
    setCarregando(true)
    setFechamento(await buscarFechamento(profileId, anoMesISO))
    setCarregando(false)
  }, [profileId, anoMesISO])

  useEffect(() => {
    carregar()
  }, [carregar])

  useRecarregarQuandoMudar(['monthly_closings'], carregar)

  return { fechamento, carregando, recarregar: carregar }
}
