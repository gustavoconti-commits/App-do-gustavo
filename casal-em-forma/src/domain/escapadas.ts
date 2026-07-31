// Escapadas — trava mensal de resgates com comida (seções 7.1 e 7.2 do
// PROMPT MESTRE v3). Funções puras: sem React, sem Supabase, sem
// `new Date()` interno — a data de referência entra por parâmetro.
import { format, addMonths, startOfMonth } from 'date-fns'

export type CategoriaResgate =
  | 'pequena'
  | 'media'
  | 'escapada_pequena'
  | 'escapada_grande'
  | 'casal'

export type CategoriaEscapada = 'escapada_pequena' | 'escapada_grande'

export type ResgateParaEscapadas = {
  escopo: 'individual' | 'casal'
  categoria: CategoriaResgate
  profileId: string | null // null quando escopo = 'casal'
  data: string // yyyy-MM-dd
  envolveComida: boolean
}

export const NOME_CATEGORIA_RESGATE: Record<CategoriaResgate, string> = {
  pequena: 'Recompensa pequena',
  media: 'Recompensa média',
  escapada_pequena: 'Escapada pequena',
  escapada_grande: 'Escapada grande',
  casal: 'Recompensa de casal',
}

function paraData(dataISO: string): Date {
  return new Date(`${dataISO}T12:00:00`)
}

function mesmoMes(aISO: string, bISO: string): boolean {
  return aISO.slice(0, 7) === bISO.slice(0, 7)
}

function formatarCurta(dataISO: string): string {
  return format(paraData(dataISO), 'dd/MM')
}

export function primeiroDiaDoMesSeguinteISO(dataISO: string): string {
  return format(addMonths(startOfMonth(paraData(dataISO)), 1), 'yyyy-MM-dd')
}

/** Um resgate consome a trava de `categoria` do perfil quando é a escapada
 *  individual da própria categoria, ou — só no caso da grande — quando é a
 *  recompensa de casal marcada como comida, que consome a grande dos dois. */
function consomeTrava(
  resgate: ResgateParaEscapadas,
  profileId: string,
  categoria: CategoriaEscapada,
): boolean {
  if (resgate.escopo === 'individual') {
    return resgate.categoria === categoria && resgate.profileId === profileId
  }
  return categoria === 'escapada_grande' && resgate.envolveComida
}

/** Data em que a trava de `categoria` foi consumida no mês calendário de
 *  `referenciaISO`, ou `null` se ainda está livre. As travas de pequena e
 *  grande são independentes entre si e independentes da outra pessoa. */
export function dataUsoEscapadaNoMes(
  resgates: ResgateParaEscapadas[],
  profileId: string,
  categoria: CategoriaEscapada,
  referenciaISO: string,
): string | null {
  const usos = resgates
    .filter((r) => mesmoMes(r.data, referenciaISO) && consomeTrava(r, profileId, categoria))
    .map((r) => r.data)
    .sort()
  return usos[0] ?? null
}

export type EstadoEscapada =
  | { estado: 'disponivel' }
  | { estado: 'usada'; usadaEm: string; liberaEm: string }
  | { estado: 'sem_saldo'; faltam: number }

/** Estado do botão de uma escapada (seção 7.2): já usada no mês vence a
 *  falta de saldo — a mensagem diz quando libera, que é o que importa. */
export function estadoEscapada(params: {
  resgates: ResgateParaEscapadas[]
  profileId: string
  categoria: CategoriaEscapada
  custo: number
  saldo: number
  hojeISO: string
}): EstadoEscapada {
  const usadaEm = dataUsoEscapadaNoMes(
    params.resgates,
    params.profileId,
    params.categoria,
    params.hojeISO,
  )
  if (usadaEm) {
    return { estado: 'usada', usadaEm, liberaEm: primeiroDiaDoMesSeguinteISO(params.hojeISO) }
  }
  if (params.saldo < params.custo) {
    return { estado: 'sem_saldo', faltam: params.custo - params.saldo }
  }
  return { estado: 'disponivel' }
}

/** Texto do botão conforme a voz da interface (seção 3.5):
 *  "Escapada grande já usada em 12/08. Libera em 01/09." */
export function textoEstadoEscapada(
  categoria: CategoriaEscapada,
  estado: EstadoEscapada,
): string {
  if (estado.estado === 'usada') {
    return `${NOME_CATEGORIA_RESGATE[categoria]} já usada em ${formatarCurta(
      estado.usadaEm,
    )}. Libera em ${formatarCurta(estado.liberaEm)}.`
  }
  if (estado.estado === 'sem_saldo') {
    return `Faltam ${estado.faltam} pontos`
  }
  return 'Resgatar'
}

export class EscapadaJaUsadaError extends Error {
  constructor(categoria: CategoriaEscapada, usadaEm: string, liberaEm: string) {
    super(textoEstadoEscapada(categoria, { estado: 'usada', usadaEm, liberaEm }))
    this.name = 'EscapadaJaUsadaError'
  }
}

/** Barra um novo resgate de escapada se a trava do mês já foi consumida —
 *  nem com saldo sobrando (seção 15). */
export function validarResgateEscapada(params: {
  resgates: ResgateParaEscapadas[]
  profileId: string
  categoria: CategoriaEscapada
  dataISO: string
}): void {
  const usadaEm = dataUsoEscapadaNoMes(
    params.resgates,
    params.profileId,
    params.categoria,
    params.dataISO,
  )
  if (usadaEm) {
    throw new EscapadaJaUsadaError(
      params.categoria,
      usadaEm,
      primeiroDiaDoMesSeguinteISO(params.dataISO),
    )
  }
}

// --- Recompensa de casal (seção 7.1) ----------------------------------------

export type PessoaParaRecompensaCasal = {
  profileId: string
  nome: string
  saldo: number
}

export type EstadoRecompensaCasal =
  | { disponivel: true }
  | { disponivel: false; motivos: string[] }

/** A recompensa de casal marcada como comida só fica disponível se os DOIS
 *  ainda tiverem a escapada grande livre E o saldo por pessoa ao mesmo tempo. */
export function estadoRecompensaCasal(params: {
  pessoas: PessoaParaRecompensaCasal[]
  envolveComida: boolean
  custoPorPessoa: number
  resgates: ResgateParaEscapadas[]
  hojeISO: string
}): EstadoRecompensaCasal {
  const motivos: string[] = []
  for (const pessoa of params.pessoas) {
    if (pessoa.saldo < params.custoPorPessoa) {
      motivos.push(
        `${pessoa.nome} precisa de mais ${params.custoPorPessoa - pessoa.saldo} pontos`,
      )
    }
    if (params.envolveComida) {
      const usadaEm = dataUsoEscapadaNoMes(
        params.resgates,
        pessoa.profileId,
        'escapada_grande',
        params.hojeISO,
      )
      if (usadaEm) {
        motivos.push(
          `Escapada grande de ${pessoa.nome} já usada em ${formatarCurta(
            usadaEm,
          )}. Libera em ${formatarCurta(primeiroDiaDoMesSeguinteISO(params.hojeISO))}.`,
        )
      }
    }
  }
  return motivos.length === 0 ? { disponivel: true } : { disponivel: false, motivos }
}

export class RecompensaCasalIndisponivelError extends Error {
  constructor(motivos: string[]) {
    super(motivos.join(' '))
    this.name = 'RecompensaCasalIndisponivelError'
  }
}

export function validarRecompensaCasal(params: {
  pessoas: PessoaParaRecompensaCasal[]
  envolveComida: boolean
  custoPorPessoa: number
  resgates: ResgateParaEscapadas[]
  dataISO: string
}): void {
  const estado = estadoRecompensaCasal({
    pessoas: params.pessoas,
    envolveComida: params.envolveComida,
    custoPorPessoa: params.custoPorPessoa,
    resgates: params.resgates,
    hojeISO: params.dataISO,
  })
  if (!estado.disponivel) {
    throw new RecompensaCasalIndisponivelError(estado.motivos)
  }
}
