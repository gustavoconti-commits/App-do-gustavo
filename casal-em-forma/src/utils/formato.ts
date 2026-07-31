export function formatarReais(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Sinal explícito para extratos: +12 / -140. */
export function formatarPontosComSinal(pontos: number): string {
  return pontos > 0 ? `+${pontos}` : String(pontos)
}
