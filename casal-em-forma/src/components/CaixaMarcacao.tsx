export function CaixaMarcacao({
  marcada,
  aoAlternar,
  desabilitada,
  tamanho = 'padrao',
}: {
  marcada: boolean
  aoAlternar: () => void
  desabilitada?: boolean
  tamanho?: 'padrao' | 'compacta'
}) {
  const caixa = tamanho === 'padrao' ? 'h-7 w-7' : 'h-6 w-6'
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={marcada}
      disabled={desabilitada}
      onClick={aoAlternar}
      className="flex h-11 w-11 items-center justify-center disabled:opacity-30"
    >
      <span
        className={`flex ${caixa} items-center justify-center rounded-[4px] border-[1.5px] ${
          marcada ? 'border-sucesso bg-sucesso' : 'border-borda'
        }`}
      >
        {marcada && (
          <svg viewBox="0 0 16 16" className="h-4 w-4 text-fundo" fill="none">
            <path
              d="M3 8.5L6.5 12L13 4.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
    </button>
  )
}
