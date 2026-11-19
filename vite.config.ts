import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const src = (p: string) => fileURLToPath(new URL(`./src/${p}`, import.meta.url))

// 部品のビルド（Vite のライブラリモード）。dist/index.js（React の hook つき）と dist/core.js（React なし）を作る。
// 型（dist/*.d.ts）は tsc（tsconfig.build.json）が作る
export default defineConfig({
  build: {
    lib: {
      entry: { index: src('index.ts'), core: src('core.ts') },
      formats: ['es'],
      fileName: (_format, name) => `${name}.js`,
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    target: 'es2020',
    minify: false,
    rolldownOptions: {
      // React は使う側のものを使う（部品の中に入れない）
      external: ['react', 'react-dom', 'react/jsx-runtime'],
    },
  },
})
