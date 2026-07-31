import { supabase } from './supabase'

const APP_EMAIL = import.meta.env.VITE_APP_EMAIL

export async function entrarComSenha(senha: string) {
  if (!APP_EMAIL) {
    throw new Error('VITE_APP_EMAIL precisa estar definida em .env.local')
  }
  const { error } = await supabase.auth.signInWithPassword({
    email: APP_EMAIL,
    password: senha,
  })
  if (error) throw error
}

export async function sair() {
  await supabase.auth.signOut()
}
