import React from 'react'

// Símbolo Ápice do manual de marca: dois chevrons ascendentes,
// verde no topo (autoridade) e dourado embaixo (alta renda).
export function ApiceSymbol({ width = 40, onDark = false }: { width?: number; onDark?: boolean }) {
  return (
    <svg width={width} viewBox="0 0 140 90" role="img" aria-label="Gustavo Conti">
      <polygon points="70,10 110,48 94,48 70,24 46,48 30,48" fill={onDark ? '#F4EEE2' : '#14603C'} />
      <polygon points="70,44 110,82 94,82 70,58 46,82 30,82" fill="#C2A14E" />
    </svg>
  )
}

// Assinatura de peso: nome light + sobrenome bold, sem espaço.
export function Wordmark({ size = 20, onDark = false }: { size?: number; onDark?: boolean }) {
  return (
    <span className="wordmark" style={{ fontSize: size, color: onDark ? '#F4EEE2' : '#0B3A2A' }}>
      <span className="wm-light">Gustavo</span>
      <span className="wm-bold">Conti</span>
    </span>
  )
}
