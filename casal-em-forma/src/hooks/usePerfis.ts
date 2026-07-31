import { useEffect, useState } from 'react'
import { listarPerfis } from '../services/profiles'
import type { Profile } from '../types'

export function usePerfis() {
  const [perfis, setPerfis] = useState<Profile[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true
    listarPerfis()
      .then((dados) => {
        if (ativo) setPerfis(dados)
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [])

  function porNome(nome: string): Profile | undefined {
    return perfis.find((p) => p.nome === nome)
  }

  return { perfis, carregando, porNome }
}
