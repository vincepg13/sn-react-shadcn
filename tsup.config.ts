import { defineConfig } from 'tsup'
import pkg from './package.json' assert { type: 'json' }

const externals = [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.peerDependencies ?? {})]

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    amb: 'src/exports/amb.index.ts',
    form: 'src/exports/form.index.ts',
    table: 'src/exports/table.index.ts',
    user: 'src/exports/user.index.ts',
    loader: 'src/exports/loader.index.ts',
    standalone: 'src/exports/standalone.index.ts',
  },
  dts: true,
  format: ['esm'],
  outDir: 'dist', 
  clean: true,
  splitting: true,
  treeshake: true,
  minify: true,
  external: externals,
})
