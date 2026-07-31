import { useEffect } from 'react'
import { executarFechamentosPendentes } from '../services/fechamentoMensal'

/** Roda a rotina de fechamento mensal (seção 8.7) uma vez por carregamento
 *  do app, para cada perfil — sem servidor com agendador, a virada do mês é
 *  detectada e creditada aqui. */
export function useFechamentoAutomatico(profileIds: string[]) {
  useEffect(() => {
    if (profileIds.length === 0) return
    profileIds.forEach((id) => {
      executarFechamentosPendentes(id).catch((erro) => {
        console.error('Falha ao executar fechamento mensal automático', erro)
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileIds.join(',')])
}
