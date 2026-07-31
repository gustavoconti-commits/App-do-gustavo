import { useEffect } from 'react'
import { assinarMudancas, type TabelaSincronizada } from '../services/realtime'

// Registro simples de ouvintes em escopo de módulo: os hooks de dados se
// inscrevem por tabela e o canal único (aberto no App) os notifica. Sem
// reescrever os hooks existentes para react-query — eles já expõem
// recarregar(), que é tudo de que a invalidação precisa.
type Ouvinte = (tabela: TabelaSincronizada) => void
const ouvintes = new Set<Ouvinte>()

/** Abre o canal Realtime uma única vez (chamado no App, quando logado) e
 *  repassa cada mudança aos ouvintes registrados. */
export function useCanalRealtime(
  ativo: boolean,
  aoMudarEstadoCanal?: (conectado: boolean) => void,
) {
  useEffect(() => {
    if (!ativo) return
    const cancelar = assinarMudancas(
      (tabela) => ouvintes.forEach((ouvinte) => ouvinte(tabela)),
      aoMudarEstadoCanal,
    )
    return cancelar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativo])
}

/** Chama `recarregar()` quando qualquer das tabelas muda em outro
 *  dispositivo — a escrita local também dispara, o que só reconfirma o
 *  estado otimista contra o servidor. */
export function useRecarregarQuandoMudar(
  tabelas: TabelaSincronizada[],
  recarregar: () => void,
) {
  useEffect(() => {
    const ouvinte: Ouvinte = (tabela) => {
      if (tabelas.includes(tabela)) recarregar()
    }
    ouvintes.add(ouvinte)
    return () => {
      ouvintes.delete(ouvinte)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabelas.join(','), recarregar])
}
