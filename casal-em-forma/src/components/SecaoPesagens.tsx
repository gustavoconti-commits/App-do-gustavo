import { useState } from 'react'
import { GraficoPeso } from './GraficoPeso'
import { usePesagens } from '../hooks/usePesagens'
import { hojeISO, formatarDataCurta } from '../utils/data'
import type { WeighIn } from '../types'

export function SecaoPesagens({
  profileId,
  corHex,
}: {
  profileId: string | undefined
  corHex: string
}) {
  const { pesagens, registrar, editar, excluir } = usePesagens(profileId)
  const [peso, setPeso] = useState('')
  const [data, setData] = useState(hojeISO())
  const [salvando, setSalvando] = useState(false)
  const [edicaoId, setEdicaoId] = useState<string | null>(null)

  const ultimasDez = [...pesagens].reverse().slice(0, 10)

  async function aoSalvarPesagem() {
    const pesoNumerico = Number(peso.replace(',', '.'))
    if (!pesoNumerico || pesoNumerico <= 0) return
    setSalvando(true)
    try {
      await registrar(data, pesoNumerico)
      setPeso('')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="mt-6">
      <h2 className="text-sm text-texto-fraco">Pesagens</h2>

      <div className="mt-2 rounded-card border border-borda bg-superficie p-3">
        <GraficoPeso pesagens={pesagens} corHex={corHex} />
      </div>

      <div className="mt-3 rounded-card border border-borda bg-superficie p-3">
        <div className="flex gap-2">
          <input
            inputMode="decimal"
            placeholder="Peso (kg)"
            value={peso}
            onChange={(evento) => setPeso(evento.target.value)}
            className="num h-11 flex-1 rounded-control border border-borda bg-fundo px-3 text-base"
          />
          <input
            type="date"
            value={data}
            max={hojeISO()}
            onChange={(evento) => setData(evento.target.value)}
            className="h-11 rounded-control border border-borda bg-fundo px-3 text-base"
          />
        </div>
        <button
          type="button"
          onClick={aoSalvarPesagem}
          disabled={salvando || peso.trim().length === 0}
          className="mt-3 h-11 w-full rounded-control bg-sucesso text-base font-medium text-fundo disabled:opacity-50"
        >
          Salvar pesagem
        </button>
      </div>

      {ultimasDez.length > 0 && (
        <div className="mt-3 divide-y divide-borda rounded-card border border-borda bg-superficie">
          {ultimasDez.map((p) => (
            <LinhaPesagem
              key={p.id}
              pesagem={p}
              emEdicao={edicaoId === p.id}
              aoEditar={() => setEdicaoId(p.id)}
              aoCancelar={() => setEdicaoId(null)}
              aoSalvar={async (pesoKg, dataISO) => {
                await editar(p.id, pesoKg, dataISO)
                setEdicaoId(null)
              }}
              aoExcluir={() => excluir(p.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function LinhaPesagem({
  pesagem,
  emEdicao,
  aoEditar,
  aoCancelar,
  aoSalvar,
  aoExcluir,
}: {
  pesagem: WeighIn
  emEdicao: boolean
  aoEditar: () => void
  aoCancelar: () => void
  aoSalvar: (pesoKg: number, dataISO: string) => void
  aoExcluir: () => void
}) {
  const [peso, setPeso] = useState(String(pesagem.peso_kg))
  const [data, setData] = useState(pesagem.data)

  if (emEdicao) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <input
          inputMode="decimal"
          value={peso}
          onChange={(evento) => setPeso(evento.target.value)}
          className="num h-11 w-20 rounded-control border border-borda bg-fundo px-2 text-base"
        />
        <input
          type="date"
          value={data}
          max={hojeISO()}
          onChange={(evento) => setData(evento.target.value)}
          className="h-11 flex-1 rounded-control border border-borda bg-fundo px-2 text-base"
        />
        <button
          type="button"
          onClick={() => aoSalvar(Number(peso.replace(',', '.')), data)}
          className="h-11 rounded-control bg-sucesso px-3 text-sm font-medium text-fundo"
        >
          Salvar
        </button>
        <button
          type="button"
          onClick={aoCancelar}
          className="h-11 px-2 text-sm text-texto-fraco"
        >
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between px-3 py-2">
      <span className="num text-sm text-texto-fraco">{formatarDataCurta(pesagem.data)}</span>
      <span className="num text-base">{pesagem.peso_kg} kg</span>
      <div className="flex gap-3">
        <button type="button" onClick={aoEditar} className="text-sm text-texto-fraco">
          Editar
        </button>
        <button type="button" onClick={aoExcluir} className="text-sm text-julia">
          Excluir
        </button>
      </div>
    </div>
  )
}
