import { obterBanco, salvar } from './store'
import type { Settings } from '../../types'

export async function buscarSettings(): Promise<Settings> {
  return { ...obterBanco().settings }
}

export async function atualizarSettings(campos: Partial<Omit<Settings, 'id'>>): Promise<void> {
  Object.assign(obterBanco().settings, campos)
  salvar()
}
