import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@kit': path.resolve(__dirname, './src'),
    },
  },
})