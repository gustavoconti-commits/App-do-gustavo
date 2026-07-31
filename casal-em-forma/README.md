# Casal em Forma

PWA privado para duas pessoas — hábitos diários, emagrecimento contra meta anual e sistema de pontos com recompensas e cofrinho. Construído seguindo o `PROMPT MESTRE v3`, uma etapa por commit (ver histórico do git).

## Stack

Vite · React 18 · TypeScript (`strict`) · Tailwind CSS · Recharts · Supabase (Postgres + Auth + Realtime) · date-fns · Vitest · vite-plugin-pwa.

## Desenvolvimento

```bash
npm install
cp .env.example .env.local   # preencher com as chaves do projeto Supabase
npm run dev                  # http://localhost:5173
npm test                     # testes de src/domain
npm run build
```

## Estrutura

```
src/
  domain/      funções puras (pontos, metas, bônus de peso, escapadas) — sem React, sem Supabase
  services/    única pasta que fala com o Supabase
  hooks/
  components/
  screens/
supabase/
  migrations/  schema SQL versionado
```

## Início da apuração

`data_inicio` em `settings` = 01/08/2026. Nada antes disso pontua.

## PWA e deploy

O `vite-plugin-pwa` gera `manifest.webmanifest` e o service worker no build:
assets estáticos pré-cacheados, dados do Supabase em `NetworkFirst`. O app é
instalável na tela inicial (ícones 192/512 + apple-touch-icon em `public/`).

Deploy: conectar o repositório ao Vercel apontando o root para
`casal-em-forma/`, com `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e
`VITE_APP_EMAIL` nas variáveis de ambiente do projeto. Toda chamada de rede
vive em `src/services/` e a navegação é por estado React (sem rotas por URL) —
estrutura pronta para empacotar com Capacitor numa fase futura, sem instalar
agora.
