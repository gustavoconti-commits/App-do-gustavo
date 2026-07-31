import { useState } from 'react'
import { BottomNav, type Aba } from './components/BottomNav'
import { CasalScreen } from './screens/CasalScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { PontosScreen } from './screens/PontosScreen'

function App() {
  const [abaAtiva, setAbaAtiva] = useState<Aba>('casal')

  return (
    <div className="min-h-full bg-fundo text-texto">
      {abaAtiva === 'casal' && <CasalScreen />}
      {abaAtiva === 'gustavo' && <ProfileScreen nome="Gustavo" />}
      {abaAtiva === 'julia' && <ProfileScreen nome="Júlia" />}
      {abaAtiva === 'pontos' && <PontosScreen />}
      <BottomNav abaAtiva={abaAtiva} aoTrocarAba={setAbaAtiva} />
    </div>
  )
}

export default App
