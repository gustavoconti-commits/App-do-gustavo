import { useEffect, useState } from 'react'
import { buscarSettings, atualizarSettings } from '../services/settings'
import { atualizarAlturaPerfil } from '../services/profiles'
import { listarHabitos } from '../services/habits'
import { sair } from '../services/auth'
import { usePerfis } from '../hooks/usePerfis'
import { calcularCalibrador } from '../domain/calibradorEconomia'
import type { Settings } from '../types'

type ChaveNumerica = Exclude<keyof Settings, 'id' | 'data_inicio'>

type Campo = { chave: ChaveNumerica; rotulo: string }

const GRUPOS: { titulo: string; campos: Campo[] }[] = [
  {
    titulo: 'Pontuação de hábitos',
    campos: [
      { chave: 'pontos_por_habito', rotulo: 'Pontos por hábito' },
      { chave: 'bonus_dia_perfeito', rotulo: 'Bônus dia perfeito' },
      { chave: 'bonus_semana_perfeita', rotulo: 'Bônus semana perfeita' },
      { chave: 'limite_habitos_ativos', rotulo: 'Teto de hábitos ativos' },
    ],
  },
  {
    titulo: 'Bônus de peso',
    campos: [
      { chave: 'bonus_peso_parcial', rotulo: 'Bônus 70–89%' },
      { chave: 'bonus_peso_completo', rotulo: 'Bônus 90%+' },
      { chave: 'bonus_streak_2', rotulo: 'Bônus 2º mês seguido' },
      { chave: 'bonus_streak_3mais', rotulo: 'Bônus 3º mês em diante' },
      { chave: 'meta_mensal_maxima_pct', rotulo: 'Teto de segurança (fração do peso)' },
      { chave: 'min_pesagens_mes', rotulo: 'Mínimo de pesagens no mês' },
      { chave: 'tolerancia_manutencao_kg', rotulo: 'Tolerância na manutenção (kg)' },
    ],
  },
  {
    titulo: 'Economia de pontos',
    campos: [
      { chave: 'valor_ponto_cofrinho', rotulo: 'Valor do ponto (R$)' },
      { chave: 'teto_cofrinho_mensal_reais', rotulo: 'Teto mensal do cofrinho (R$, 0 = sem teto)' },
      { chave: 'pedagio_transferencia', rotulo: 'Pedágio de transferência (fração)' },
      { chave: 'custo_tier_pequena', rotulo: 'Recompensa pequena (pts)' },
      { chave: 'custo_tier_media', rotulo: 'Recompensa média (pts)' },
      { chave: 'custo_escapada_pequena', rotulo: 'Escapada pequena (pts)' },
      { chave: 'custo_escapada_grande', rotulo: 'Escapada grande (pts)' },
      { chave: 'custo_tier_casal', rotulo: 'Recompensa de casal (pts, por pessoa)' },
    ],
  },
]

function paraNumero(valor: string): number {
  return Number(valor.replace(',', '.'))
}

export function ConfiguracoesScreen({ aoVoltar }: { aoVoltar: () => void }) {
  const { perfis } = usePerfis()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [valores, setValores] = useState<Record<string, string>>({})
  const [alturas, setAlturas] = useState<Record<string, string>>({})
  const [habitosAtivos, setHabitosAtivos] = useState<Record<string, number>>({})
  const [salvando, setSalvando] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    buscarSettings().then((config) => {
      setSettings(config)
      const iniciais: Record<string, string> = {}
      for (const grupo of GRUPOS) {
        for (const campo of grupo.campos) {
          iniciais[campo.chave] = String(config[campo.chave])
        }
      }
      setValores(iniciais)
    })
  }, [])

  useEffect(() => {
    setAlturas(
      Object.fromEntries(perfis.map((p) => [p.id, p.altura_cm ? String(p.altura_cm) : ''])),
    )
    Promise.all(
      perfis.map(async (p) => {
        const habitos = await listarHabitos(p.id)
        return [p.id, habitos.filter((h) => !h.arquivado_em).length] as const
      }),
    ).then((pares) => setHabitosAtivos(Object.fromEntries(pares)))
  }, [perfis])

  if (!settings) {
    return (
      <div className="px-4 pb-24 pt-6">
        <h1 className="text-2xl font-extrabold">Configurações</h1>
      </div>
    )
  }

  // O calibrador reage aos valores do formulário: ajustar um preço mostra a
  // folga nova antes mesmo de salvar.
  const settingsParaCalibrador = {
    pontos_por_habito: paraNumero(valores.pontos_por_habito ?? '') || settings.pontos_por_habito,
    bonus_dia_perfeito:
      paraNumero(valores.bonus_dia_perfeito ?? '') || settings.bonus_dia_perfeito,
    bonus_semana_perfeita:
      paraNumero(valores.bonus_semana_perfeita ?? '') || settings.bonus_semana_perfeita,
    bonus_peso_completo:
      paraNumero(valores.bonus_peso_completo ?? '') || settings.bonus_peso_completo,
    custo_escapada_pequena:
      paraNumero(valores.custo_escapada_pequena ?? '') || settings.custo_escapada_pequena,
    custo_escapada_grande:
      paraNumero(valores.custo_escapada_grande ?? '') || settings.custo_escapada_grande,
  }

  async function salvar() {
    setSalvando(true)
    setFeedback(null)
    try {
      const campos: Partial<Omit<Settings, 'id'>> = {}
      for (const grupo of GRUPOS) {
        for (const campo of grupo.campos) {
          const numero = paraNumero(valores[campo.chave] ?? '')
          if (!Number.isNaN(numero)) {
            campos[campo.chave] = numero
          }
        }
      }
      await atualizarSettings(campos)
      for (const perfil of perfis) {
        const altura = alturas[perfil.id]?.trim() ?? ''
        const alturaNumero = altura.length > 0 ? paraNumero(altura) : null
        if (alturaNumero !== perfil.altura_cm && !Number.isNaN(alturaNumero ?? 0)) {
          await atualizarAlturaPerfil(perfil.id, alturaNumero)
        }
      }
      setSettings(await buscarSettings())
      setFeedback('Configurações salvas.')
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : 'Não foi possível salvar.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="px-4 pb-24 pt-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={aoVoltar}
          aria-label="Voltar"
          className="flex h-11 w-11 items-center justify-center text-texto-fraco"
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none">
            <path
              d="M10 2L4 8L10 14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h1 className="text-2xl font-extrabold">Configurações</h1>
      </div>

      {GRUPOS.map((grupo) => (
        <div key={grupo.titulo} className="mt-6">
          <h2 className="text-sm text-texto-fraco">{grupo.titulo}</h2>
          <div className="mt-2 grid grid-cols-2 gap-2 rounded-card border border-borda bg-superficie p-3">
            {grupo.campos.map((campo) => (
              <label key={campo.chave} className="block">
                <span className="text-xs text-texto-fraco">{campo.rotulo}</span>
                <input
                  inputMode="decimal"
                  value={valores[campo.chave] ?? ''}
                  onChange={(evento) =>
                    setValores((atual) => ({ ...atual, [campo.chave]: evento.target.value }))
                  }
                  className="num mt-1 h-11 w-full rounded-control border border-borda bg-fundo px-3 text-base"
                />
              </label>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-6">
        <h2 className="text-sm text-texto-fraco">Alturas</h2>
        <div className="mt-2 grid grid-cols-2 gap-2 rounded-card border border-borda bg-superficie p-3">
          {perfis.map((perfil) => (
            <label key={perfil.id} className="block">
              <span className="text-xs" style={{ color: perfil.cor_hex }}>
                {perfil.nome} (cm)
              </span>
              <input
                inputMode="decimal"
                value={alturas[perfil.id] ?? ''}
                onChange={(evento) =>
                  setAlturas((atual) => ({ ...atual, [perfil.id]: evento.target.value }))
                }
                className="num mt-1 h-11 w-full rounded-control border border-borda bg-fundo px-3 text-base"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-sm text-texto-fraco">Calibrador da economia</h2>
        <div className="mt-2 space-y-3 rounded-card border border-borda bg-superficie p-3">
          {perfis.map((perfil) => {
            const qtd = habitosAtivos[perfil.id] ?? 0
            const resultado = calcularCalibrador(qtd, settingsParaCalibrador)
            return (
              <div key={perfil.id}>
                <p className="text-sm font-semibold" style={{ color: perfil.cor_hex }}>
                  {perfil.nome}{' '}
                  <span className="font-normal text-texto-fraco">
                    · {qtd} {qtd === 1 ? 'hábito ativo' : 'hábitos ativos'}
                  </span>
                </p>
                <div className="num mt-1 space-y-0.5 text-sm">
                  <p>
                    <span className="text-texto-fraco">Pontos possíveis no mês: </span>
                    máximo {resultado.maximo} · bom {resultado.bom} · fraco {resultado.fraco}
                  </p>
                  <p>
                    <span className="text-texto-fraco">Custo das duas escapadas: </span>
                    {resultado.custoDuasEscapadas}
                  </p>
                  <p>
                    <span className="text-texto-fraco">Folga num mês bom: </span>
                    {resultado.folgaMesBom >= 0 ? `+${resultado.folgaMesBom}` : resultado.folgaMesBom}
                  </p>
                </div>
                {resultado.folgaMesBom < 0 && (
                  <p className="mt-1 text-xs text-julia">
                    Um mês bom não paga as duas escapadas. Reajuste os preços acima.
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {feedback && <p className="mt-4 text-sm text-texto-fraco">{feedback}</p>}

      <button
        type="button"
        disabled={salvando}
        onClick={salvar}
        className="mt-4 h-11 w-full rounded-control bg-sucesso text-base font-medium text-fundo disabled:opacity-50"
      >
        Salvar configurações
      </button>

      <button
        type="button"
        onClick={() => sair()}
        className="mt-3 h-11 w-full rounded-control border border-borda text-base font-medium text-julia"
      >
        Sair
      </button>
    </div>
  )
}
