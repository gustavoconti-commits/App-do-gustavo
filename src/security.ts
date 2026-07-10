// Proteção por senha local: o hash (SHA-256 com salt) fica salvo junto dos
// dados no aparelho. Protege o acesso ao app neste navegador — não é um
// login em servidor (os dados nunca saem do aparelho).

export interface PinConfig {
  salt: string
  hash: string
}

export function mkSalt(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${pin}`)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function verifyPin(pin: string, cfg: PinConfig): Promise<boolean> {
  return (await hashPin(pin, cfg.salt)) === cfg.hash
}

const SESSION_KEY = 'grana-unlocked'

export function isUnlocked(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1'
  } catch {
    return true
  }
}

export function markUnlocked(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, '1')
  } catch {
    // sessionStorage indisponível: segue desbloqueado só em memória
  }
}

export function lockSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // ignora
  }
}
