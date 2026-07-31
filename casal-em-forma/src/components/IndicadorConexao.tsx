import { useEffect, useState } from 'react'

/** Indicador discreto de 6px no topo (seção 10): verde online, cinza
 *  offline. Baseado em navigator.onLine + eventos online/offline; o estado
 *  do canal Realtime entra só no rótulo acessível. */
export function IndicadorConexao({ canalConectado }: { canalConectado: boolean }) {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const aoFicarOnline = () => setOnline(true)
    const aoFicarOffline = () => setOnline(false)
    window.addEventListener('online', aoFicarOnline)
    window.addEventListener('offline', aoFicarOffline)
    return () => {
      window.removeEventListener('online', aoFicarOnline)
      window.removeEventListener('offline', aoFicarOffline)
    }
  }, [])

  const rotulo = !online
    ? 'Offline'
    : canalConectado
      ? 'Online · sincronização em tempo real ativa'
      : 'Online'

  return (
    <div
      role="status"
      aria-label={rotulo}
      title={rotulo}
      className="fixed right-3 z-30 h-[6px] w-[6px] rounded-full"
      style={{
        top: 'calc(env(safe-area-inset-top) + 12px)',
        backgroundColor: online ? '#34D399' : '#8A9099',
      }}
    />
  )
}
