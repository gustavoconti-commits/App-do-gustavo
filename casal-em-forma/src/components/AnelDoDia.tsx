import { useEffect, useRef, useState } from 'react'
import { formatarDataExtensa } from '../utils/data'

export type PessoaAnel = {
  nome: string
  corHex: string
  feitos: number
  total: number
}

function fracao(pessoa: PessoaAnel): number {
  return pessoa.total === 0 ? 0 : pessoa.feitos / pessoa.total
}

function completa(pessoa: PessoaAnel): boolean {
  return pessoa.total > 0 && pessoa.feitos === pessoa.total
}

function reduzMovimento(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Pulso único quando a pessoa completa o dia. Além do bloco global de
 *  prefers-reduced-motion no CSS, o gatilho também é checado via JS. */
function usePulso(estaCompleta: boolean): boolean {
  const [pulsando, setPulsando] = useState(false)
  const anterior = useRef(estaCompleta)

  useEffect(() => {
    if (estaCompleta && !anterior.current && !reduzMovimento()) {
      setPulsando(true)
      const timer = setTimeout(() => setPulsando(false), 700)
      return () => clearTimeout(timer)
    }
    anterior.current = estaCompleta
  }, [estaCompleta])

  useEffect(() => {
    anterior.current = estaCompleta
  }, [estaCompleta])

  return pulsando
}

function Anel({
  raio,
  espessura,
  corHex,
  fracaoPreenchida,
  pulsando,
}: {
  raio: number
  espessura: number
  corHex: string
  fracaoPreenchida: number
  pulsando: boolean
}) {
  const circunferencia = 2 * Math.PI * raio
  return (
    <>
      <circle cx="70" cy="70" r={raio} stroke="#24272E" strokeWidth={espessura} fill="none" />
      <circle
        cx="70"
        cy="70"
        r={raio}
        stroke={pulsando ? '#34D399' : corHex}
        strokeWidth={espessura}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circunferencia}
        strokeDashoffset={circunferencia * (1 - Math.min(1, fracaoPreenchida))}
        transform="rotate(-90 70 70)"
        className={pulsando ? 'anel-pulso' : ''}
        style={{ transition: 'stroke-dashoffset 400ms ease-out' }}
      />
    </>
  )
}

/** Elemento-assinatura (seção 3.3): dois anéis concêntricos — externo azul =
 *  Gustavo, interno rosa = Júlia — preenchendo conforme os hábitos do dia são
 *  marcados. Único elemento animado do app. */
export function AnelDoDia({
  externa,
  interna,
  dataISO,
}: {
  externa: PessoaAnel
  interna: PessoaAnel
  dataISO: string
}) {
  const pulsoExterna = usePulso(completa(externa))
  const pulsoInterna = usePulso(completa(interna))

  return (
    <div className="mt-4 flex items-center gap-4">
      <svg viewBox="0 0 140 140" className="h-32 w-32 shrink-0" role="img" aria-label="Anel do dia">
        <Anel
          raio={60}
          espessura={10}
          corHex={externa.corHex}
          fracaoPreenchida={fracao(externa)}
          pulsando={pulsoExterna}
        />
        <Anel
          raio={44}
          espessura={10}
          corHex={interna.corHex}
          fracaoPreenchida={fracao(interna)}
          pulsando={pulsoInterna}
        />
      </svg>
      <div>
        <p className="text-sm capitalize text-texto-fraco">{formatarDataExtensa(dataISO)}</p>
        <div className="mt-2 space-y-1">
          {[externa, interna].map((pessoa) => (
            <p key={pessoa.nome} className="text-sm">
              <span style={{ color: pessoa.corHex }}>{pessoa.nome}</span>{' '}
              <span className="num">
                {pessoa.feitos}/{pessoa.total}
              </span>
              {completa(pessoa) && <span className="text-sucesso"> · dia completo</span>}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
