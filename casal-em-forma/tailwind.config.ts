import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        fundo: '#0B0C0E',
        superficie: '#16181D',
        borda: '#24272E',
        texto: '#E8EAED',
        'texto-fraco': '#8A9099',
        gustavo: '#3B82F6',
        julia: '#F43F5E',
        sucesso: '#34D399',
      },
      fontFamily: {
        display: ['Archivo', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        xs: '11px',
        sm: '13px',
        base: '15px',
        lg: '18px',
        xl: '24px',
        '2xl': '32px',
      },
      borderRadius: {
        card: '14px',
        control: '8px',
      },
    },
  },
  plugins: [],
} satisfies Config
