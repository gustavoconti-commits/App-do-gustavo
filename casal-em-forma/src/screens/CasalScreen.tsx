import { useState } from 'react'
import { ConfiguracoesScreen } from './ConfiguracoesScreen'

export function CasalScreen() {
  const [configAberta, setConfigAberta] = useState(false)

  if (configAberta) {
    return <ConfiguracoesScreen aoVoltar={() => setConfigAberta(false)} />
  }

  return (
    <div className="px-4 pb-24 pt-6">
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-extrabold">Casal em Forma</h1>
        <button
          type="button"
          onClick={() => setConfigAberta(true)}
          aria-label="Configurações"
          className="flex h-11 w-11 items-center justify-center text-texto-fraco"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.56-1.11 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.08a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.08a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1.03Z" />
          </svg>
        </button>
      </div>
      <p className="mt-1 text-sm text-texto-fraco">
        Anel do dia, evolução de peso e placar do casal chegam na próxima etapa.
      </p>
    </div>
  )
}
