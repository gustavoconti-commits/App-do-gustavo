import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
  },
  // casal-em-forma/ é um app independente com dependências e suíte próprias;
  // sem esta exclusão o vitest da raiz tenta rodar os testes dele sem os
  // node_modules dele e o deploy do GitHub Pages quebra.
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', 'casal-em-forma/**'],
  },
})
