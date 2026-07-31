import type { ModoVisualizacao } from '../hooks/useModoVisualizacao'

export function AlternadorModo({
  modo,
  aoMudar,
}: {
  modo: ModoVisualizacao
  aoMudar: (modo: ModoVisualizacao) => void
}) {
  return (
    <div className="inline-flex rounded-control border border-borda p-0.5">
      {(['hoje', 'semana'] as const).map((opcao) => (
        <button
          key={opcao}
          type="button"
          onClick={() => aoMudar(opcao)}
          className={`min-h-[36px] rounded-[6px] px-3 text-sm capitalize ${
            modo === opcao ? 'bg-superficie text-texto' : 'text-texto-fraco'
          }`}
        >
          {opcao}
        </button>
      ))}
    </div>
  )
}
