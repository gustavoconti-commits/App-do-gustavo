import { estadoEscapada, type CategoriaEscapada, type EstadoEscapada, type ResgateParaEscapadas } from '../domain/escapadas'
import { formatarDataCurta } from '../utils/data'
import type { Profile, Settings } from '../types'

const CATEGORIAS: { categoria: CategoriaEscapada; rotulo: string }[] = [
  { categoria: 'escapada_pequena', rotulo: 'Pequena' },
  { categoria: 'escapada_grande', rotulo: 'Grande' },
]

function textoCurto(estado: EstadoEscapada): string {
  if (estado.estado === 'usada') return `Usada em ${formatarDataCurta(estado.usadaEm)}`
  if (estado.estado === 'sem_saldo') return `Faltam ${estado.faltam} pontos`
  return 'Disponível'
}

/** Grade 2×2: estado das escapadas pequena e grande de cada pessoa no mês
 *  corrente. Usada na aba Pontos e no dashboard do Casal. */
export function EscapadasDoMes({
  pessoas,
  resgates,
  settings,
  hoje,
}: {
  pessoas: { perfil: Profile; saldo: number }[]
  resgates: ResgateParaEscapadas[]
  settings: Settings
  hoje: string
}) {
  const custoPorCategoria: Record<CategoriaEscapada, number> = {
    escapada_pequena: settings.custo_escapada_pequena,
    escapada_grande: settings.custo_escapada_grande,
  }

  return (
    <div className="mt-6">
      <h2 className="text-sm text-texto-fraco">Escapadas do mês</h2>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {pessoas.map((pessoa) => (
          <div
            key={pessoa.perfil.id}
            className="rounded-card border border-borda bg-superficie p-3"
          >
            <p className="text-sm font-semibold" style={{ color: pessoa.perfil.cor_hex }}>
              {pessoa.perfil.nome}
            </p>
            <div className="mt-2 space-y-1.5">
              {CATEGORIAS.map(({ categoria, rotulo }) => {
                const estado = estadoEscapada({
                  resgates,
                  profileId: pessoa.perfil.id,
                  categoria,
                  custo: custoPorCategoria[categoria],
                  saldo: pessoa.saldo,
                  hojeISO: hoje,
                })
                return (
                  <div key={categoria}>
                    <p className="text-xs text-texto-fraco">{rotulo}</p>
                    <p
                      className={`num text-sm ${
                        estado.estado === 'disponivel' ? 'text-sucesso' : 'text-texto-fraco'
                      }`}
                    >
                      {textoCurto(estado)}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
