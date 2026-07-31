// Empacota o build de demonstração (dist-demo/) num único arquivo HTML,
// com CSS e JS embutidos — abre offline em qualquer navegador, sem servidor.
// Uso: npm run build:demo && node scripts/gerar-demo-html.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(raiz, 'dist-demo')

let html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')

// Embute o JS do bundle (escapando </script> para não fechar a tag cedo)
html = html.replace(
  /<script type="module"[^>]*src="\.?\/?(assets\/[^"]+\.js)"[^>]*><\/script>/,
  (_, arquivo) => {
    const js = fs
      .readFileSync(path.join(dist, arquivo), 'utf8')
      .replaceAll('</script', '<\\/script')
    return `<script type="module">${js}</script>`
  },
)

// Embute o CSS
html = html.replace(
  /<link rel="stylesheet"[^>]*href="\.?\/?(assets\/[^"]+\.css)"[^>]*>/,
  (_, arquivo) => `<style>${fs.readFileSync(path.join(dist, arquivo), 'utf8')}</style>`,
)

// Remove referências externas (fontes do Google, ícones, manifest): o arquivo
// precisa funcionar 100% offline. As fontes caem no fallback do sistema.
html = html
  .replace(/^\s*<link rel="preconnect"[^>]*>\s*$/gm, '')
  .replace(/^\s*<link[^>]*fonts\.googleapis\.com[^>]*>\s*$/gm, '')
  .replace(/^\s*<link rel="icon"[^>]*>\s*$/gm, '')
  .replace(/^\s*<link rel="apple-touch-icon"[^>]*>\s*$/gm, '')
  .replace(/^\s*<link rel="manifest"[^>]*>\s*$/gm, '')

const completo = path.join(dist, 'casal-em-forma-demo.html')
fs.writeFileSync(completo, html)

// Variante "miolo" (sem <html>/<head>/<body>) para publicação como Artifact.
const estilo = html.match(/<style>[\s\S]*?<\/style>/)?.[0] ?? ''
const script = html.match(/<script type="module">[\s\S]*<\/script>/)?.[0] ?? ''
const miolo = `${estilo}\n<div id="root"></div>\n${script}\n`
const artifact = path.join(dist, 'casal-em-forma-demo-artifact.html')
fs.writeFileSync(artifact, miolo)

for (const arquivo of [completo, artifact]) {
  const kb = Math.round(fs.statSync(arquivo).size / 1024)
  console.log(`${path.basename(arquivo)} — ${kb} kB`)
}
