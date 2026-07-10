const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const brlNoSymbol = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function fmtBRL(v: number): string {
  // Evita "-R$ 0,00" por causa de -0
  if (Object.is(v, -0)) v = 0
  return brl.format(v)
}

export function fmtNum(v: number): string {
  return brlNoSymbol.format(v)
}

// Entrada de dinheiro estilo "caixa registradora": o usuário digita dígitos e
// o valor cresce dos centavos (1 → 0,01; 12 → 0,12; 1250 → 12,50).
export function digitsToAmount(digits: string): number {
  const clean = digits.replace(/\D/g, '').slice(0, 12)
  return clean ? parseInt(clean, 10) / 100 : 0
}

export function amountToDigits(v: number): string {
  return String(Math.round(v * 100))
}

export function round2(v: number): number {
  return Math.round(v * 100) / 100
}
