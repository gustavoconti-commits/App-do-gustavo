// Modo demonstração: qualquer senha entra — não há conta nem servidor.
import { definirLogado } from './supabase'

export async function entrarComSenha(_senha: string) {
  definirLogado(true)
}

export async function sair() {
  definirLogado(false)
}
