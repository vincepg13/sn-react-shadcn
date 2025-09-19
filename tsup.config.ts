import { defineConfig } from 'tsup'
import pkg from './package.json' assert { type: 'json' }

const externals = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
]

export default defineConfig({
  entry: ['src/index.ts'],
  dts: true,
  format: ['esm', 'cjs'],
  outDir: 'dist',
  splitting: false,
  treeshake: true,
  minify: true,
  external: externals,
})
