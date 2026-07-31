export type Aba = 'casal' | 'gustavo' | 'julia' | 'pontos'

const ABAS: { id: Aba; rotulo: string }[] = [
  { id: 'casal', rotulo: 'Casal' },
  { id: 'gustavo', rotulo: 'Gustavo' },
  { id: 'julia', rotulo: 'Júlia' },
  { id: 'pontos', rotulo: 'Pontos' },
]

export function BottomNav({
  abaAtiva,
  aoTrocarAba,
}: {
  abaAtiva: Aba
  aoTrocarAba: (aba: Aba) => void
}) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 flex border-t border-borda bg-superficie"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {ABAS.map((aba) => {
        const ativa = aba.id === abaAtiva
        return (
          <button
            key={aba.id}
            type="button"
            onClick={() => aoTrocarAba(aba.id)}
            className={`flex min-h-[44px] flex-1 items-center justify-center py-3 text-sm ${
              ativa ? 'text-texto' : 'text-texto-fraco'
            }`}
            aria-current={ativa ? 'page' : undefined}
          >
            {aba.rotulo}
          </button>
        )
      })}
    </nav>
  )
}
