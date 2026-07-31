import type { ReactNode } from 'react'

export function BottomSheet({
  aberto,
  titulo,
  aoFechar,
  children,
}: {
  aberto: boolean
  titulo: string
  aoFechar: () => void
  children: ReactNode
}) {
  if (!aberto) return null

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center">
      <button
        type="button"
        aria-label="Fechar"
        onClick={aoFechar}
        className="absolute inset-0 bg-black/60"
      />
      <div
        className="relative z-10 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-card border-t border-borda bg-superficie p-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{titulo}</h2>
          <button
            type="button"
            onClick={aoFechar}
            className="flex h-11 w-11 items-center justify-center text-texto-fraco"
            aria-label="Fechar"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none">
              <path
                d="M2 2L14 14M14 2L2 14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
