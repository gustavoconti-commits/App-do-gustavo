import { useState } from 'react'
import { BottomNav, type Aba } from './components/BottomNav'
import { CasalScreen } from './screens/CasalScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { PontosScreen } from './screens/PontosScreen'
import { LoginScreen } from './screens/LoginScreen'
import { useAuth } from './hooks/useAuth'
import { usePerfis } from './hooks/usePerfis'
import { useFechamentoAutomatico } from './hooks/useFechamentoAutomatico'
import { useCanalRealtime } from './hooks/useRealtimeInvalidation'
import { IndicadorConexao } from './components/IndicadorConexao'

function App() {
  const [abaAtiva, setAbaAtiva] = useState<Aba>('casal')
  const [canalConectado, setCanalConectado] = useState(false)
  const { logado, carregando } = useAuth()
  const { perfis } = usePerfis()
  useFechamentoAutomatico(logado ? perfis.map((p) => p.id) : [])
  useCanalRealtime(logado, setCanalConectado)

  if (carregando) {
    return <div className="min-h-full bg-fundo" />
  }

  if (!logado) {
    return (
      <div className="min-h-full bg-fundo text-texto">
        <LoginScreen />
      </div>
    )
  }

  return (
    <div className="min-h-full bg-fundo text-texto">
      <IndicadorConexao canalConectado={canalConectado} />
      {abaAtiva === 'casal' && <CasalScreen />}
      {abaAtiva === 'gustavo' && <ProfileScreen nome="Gustavo" />}
      {abaAtiva === 'julia' && <ProfileScreen nome="Júlia" />}
      {abaAtiva === 'pontos' && <PontosScreen />}
      <BottomNav abaAtiva={abaAtiva} aoTrocarAba={setAbaAtiva} />
    </div>
  )
}

export default App
