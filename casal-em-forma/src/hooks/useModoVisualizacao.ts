import { useState } from 'react'

export type ModoVisualizacao = 'hoje' | 'semana'

const CHAVE = 'cef_modo_visualizacao'

export function useModoVisualizacao() {
  const [modo, setModoEstado] = useState<ModoVisualizacao>(() => {
    const salvo = sessionStorage.getItem(CHAVE)
    return salvo === 'semana' ? 'semana' : 'hoje'
  })

  function setModo(novoModo: ModoVisualizacao) {
    sessionStorage.setItem(CHAVE, novoModo)
    setModoEstado(novoModo)
  }

  return { modo, setModo }
}
