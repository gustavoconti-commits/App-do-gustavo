import { defineConfig, type Plugin } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'
import fs from 'node:fs'

/** Modo demonstração (`--mode demo`): redireciona cada service que tenha um
 *  dublê em src/services/demo/ para ele — o app inteiro passa a rodar com
 *  dados locais (localStorage), sem Supabase e sem rede. Services sem dublê
 *  (ex.: fechamentoMensal.ts) continuam reais, mas os módulos que eles
 *  importam também são redirecionados, então a lógica roda sobre o demo. */
function servicosDemo(): Plugin {
  const dirServicos = path.resolve(__dirname, 'src/services')
  const dirDemo = path.join(dirServicos, 'demo')
  return {
    name: 'servicos-demo',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (!importer || importer.startsWith(dirDemo)) return null
      const resolvido = await this.resolve(source, importer, { ...options, skipSelf: true })
      if (!resolvido) return null
      const id = resolvido.id
      if (!id.startsWith(dirServicos + path.sep) || id.startsWith(dirDemo + path.sep)) {
        return null
      }
      const dubleDemo = path.join(dirDemo, path.basename(id))
      return fs.existsSync(dubleDemo) ? dubleDemo : null
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    ...(mode === 'demo'
      ? [servicosDemo()]
      : [
          VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icon.svg', 'apple-touch-icon.png'],
            manifest: {
              name: 'Casal em Forma',
              short_name: 'Casal em Forma',
              description: 'Hábitos, emagrecimento e pontos para duas pessoas.',
              lang: 'pt-BR',
              display: 'standalone',
              theme_color: '#0B0C0E',
              background_color: '#0B0C0E',
              icons: [
                { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
                { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
                { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
              ],
            },
            workbox: {
              // Assets estáticos do build ficam pré-cacheados (CacheFirst por
              // natureza); dados vão por NetworkFirst para nunca mostrar um saldo
              // velho quando há rede.
              globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
              runtimeCaching: [
                {
                  urlPattern: /^https:\/\/[a-z0-9-]+\.supabase\.co\/.*/i,
                  handler: 'NetworkFirst',
                  options: {
                    cacheName: 'dados-supabase',
                    networkTimeoutSeconds: 5,
                    expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
                  },
                },
                {
                  urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                  handler: 'CacheFirst',
                  options: {
                    cacheName: 'google-fonts-css',
                    expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                  },
                },
                {
                  urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                  handler: 'CacheFirst',
                  options: {
                    cacheName: 'google-fonts-arquivos',
                    expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
                  },
                },
              ],
            },
          }),
        ]),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build:
    mode === 'demo'
      ? {
          outDir: 'dist-demo',
          rollupOptions: { output: { inlineDynamicImports: true } },
        }
      : undefined,
  test: {
    environment: 'node',
  },
}))
