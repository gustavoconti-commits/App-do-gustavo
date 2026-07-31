import { useCallback, useEffect, useState } from 'react'
import { buscarMetaAnual, definirMetaAnual } from '../services/annualGoals'
import { hojeISO } from '../utils/data'
import type { AnnualGoal } from '../types'

export function useMetaAnual(profileId: string | undefined) {
  const [meta, setMeta] = useState<AnnualGoal | null>(null)
  const [carregando, setCarregando] = useState(true)
  const ano = Number(hojeISO().slice(0, 4))

  const carregar = useCallback(async () => {
    if (!profileId) return
    setCarregando(true)
    setMeta(await buscarMetaAnual(profileId, ano))
    setCarregando(false)
  }, [profileId, ano])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function definir(pesoBaseKg: number, kgAPerder: number) {
    if (!profileId) return
    await definirMetaAnual({ profileId, ano, pesoBaseKg, kgAPerder })
    await carregar()
  }

  return { meta, ano, carregando, definir, recarregar: carregar }
}
