export function ProfileScreen({ nome }: { nome: 'Gustavo' | 'Júlia' }) {
  return (
    <div className="px-4 pb-24 pt-6">
      <h1 className="text-2xl font-extrabold">{nome}</h1>
      <p className="mt-1 text-sm text-texto-fraco">
        Hábitos, pesagens e metas chegam nas próximas etapas.
      </p>
    </div>
  )
}
