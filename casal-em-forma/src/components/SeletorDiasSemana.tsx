const DIAS: { valor: number; rotulo: string }[] = [
  { valor: 1, rotulo: 'Seg' },
  { valor: 2, rotulo: 'Ter' },
  { valor: 3, rotulo: 'Qua' },
  { valor: 4, rotulo: 'Qui' },
  { valor: 5, rotulo: 'Sex' },
  { valor: 6, rotulo: 'Sáb' },
  { valor: 7, rotulo: 'Dom' },
]

export function SeletorDiasSemana({
  selecionados,
  aoAlternar,
}: {
  selecionados: number[]
  aoAlternar: (dia: number) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {DIAS.map((dia) => {
        const ativo = selecionados.includes(dia.valor)
        return (
          <button
            key={dia.valor}
            type="button"
            onClick={() => aoAlternar(dia.valor)}
            className={`min-h-[44px] min-w-[44px] rounded-control border text-sm ${
              ativo
                ? 'border-sucesso bg-sucesso/10 text-sucesso'
                : 'border-borda text-texto-fraco'
            }`}
          >
            {dia.rotulo}
          </button>
        )
      })}
    </div>
  )
}
