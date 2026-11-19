import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const src = (p: string) => fileURLToPath(new URL(`../../src/${p}`, import.meta.url))

// 見本のページ。npm の部品の代わりに、このリポジトリの src/ をそのまま使う（公開前でも試せる）
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@shiodome47/practice-kit/core', replacement: src('core.ts') },
      { find: '@shiodome47/practice-kit', replacement: src('index.ts') },
    ],
  },
  build: { outDir: 'dist', emptyOutDir: true },
})
