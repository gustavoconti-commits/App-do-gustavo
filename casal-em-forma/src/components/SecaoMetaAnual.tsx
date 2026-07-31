import { useState } from 'react'
import { differenceInCalendarMonths } from 'date-fns'
import { useMetaAnual } from '../hooks/useMetaAnual'
import { hojeISO } from '../utils/data'
import type { WeighIn } from '../types'

export function SecaoMetaAnual({
  profileId,
  ultimaPesagem,
}: {
  profileId: string | undefined
  ultimaPesagem: WeighIn | undefined
}) {
  const { meta, ano, definir } = useMetaAnual(profileId)
  const [kgAPerder, setKgAPerder] = useState('')
  const [salvando, setSalvando] = useState(false)

  if (!meta) {
    return (
      <div className="mt-6">
        <h2 className="text-sm text-texto-fraco">Meta do ano</h2>
        <div className="mt-2 rounded-card border border-borda bg-superficie p-3">
          {!ultimaPesagem ? (
            <p className="text-sm text-texto-fraco">
              Registre uma pesagem antes de definir a meta de {ano}.
            </p>
          ) : (
            <>
              <p className="text-sm text-texto-fraco">
                Quantos quilos você quer perder até 31/12/{ano}?
              </p>
              <div className="mt-2 flex gap-2">
                <input
                  inputMode="decimal"
                  placeholder="kg"
                  value={kgAPerder}
                  onChange={(evento) => setKgAPerder(evento.target.value)}
                  className="num h-11 flex-1 rounded-control border border-borda bg-fundo px-3 text-base"
                />
                <button
                  type="button"
                  disabled={salvando || kgAPerder.trim().length === 0}
                  onClick={async () => {
                    setSalvando(true)
                    try {
                      await definir(ultimaPesagem.peso_kg, Number(kgAPerder.replace(',', '.')))
                    } finally {
                      setSalvando(false)
                    }
                  }}
                  className="h-11 rounded-control bg-sucesso px-4 text-sm font-medium text-fundo disabled:opacity-50"
                >
                  Definir meta do ano
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  const pesoAtual = ultimaPesagem?.peso_kg ?? meta.peso_base_kg
  const jaPerdeu = meta.peso_base_kg - pesoAtual
  const falta = pesoAtual - meta.peso_alvo_kg

  const mesesDecorridos = Math.max(
    1,
    differenceInCalendarMonths(new Date(`${hojeISO()}T12:00:00`), new Date(`${meta.data_criacao}T12:00:00`)),
  )
  const ritmoMensal = jaPerdeu / mesesDecorridos
  const mesAtual = Number(hojeISO().slice(5, 7))
  const mesesRestantes = 12 - mesAtual + 1
  const projecaoFinal = pesoAtual - ritmoMensal * mesesRestantes

  return (
    <div className="mt-6">
      <h2 className="text-sm text-texto-fraco">Meta do ano</h2>
      <div className="mt-2 grid grid-cols-2 gap-2 rounded-card border border-borda bg-superficie p-3">
        <div>
          <p className="text-xs text-texto-fraco">Peso-alvo</p>
          <p className="num text-lg">{meta.peso_alvo_kg} kg</p>
        </div>
        <div>
          <p className="text-xs text-texto-fraco">Já perdeu</p>
          <p className="num text-lg">{jaPerdeu.toFixed(1)} kg</p>
        </div>
        <div>
          <p className="text-xs text-texto-fraco">Falta</p>
          <p className="num text-lg">{Math.max(0, falta).toFixed(1)} kg</p>
        </div>
        <div>
          <p className="text-xs text-texto-fraco">Projeção 31/12</p>
          <p className="num text-lg">{projecaoFinal.toFixed(1)} kg</p>
        </div>
      </div>
    </div>
  )
}
