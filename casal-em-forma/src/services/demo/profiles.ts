import { obterBanco, salvar } from './store'
import type { Profile } from '../../types'

export async function listarPerfis(): Promise<Profile[]> {
  return [...obterBanco().profiles]
}

export async function atualizarAlturaPerfil(id: string, alturaCm: number | null): Promise<void> {
  const perfil = obterBanco().profiles.find((p) => p.id === id)
  if (perfil) {
    perfil.altura_cm = alturaCm
    salvar()
  }
}
