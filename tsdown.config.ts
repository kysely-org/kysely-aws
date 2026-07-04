import { defineConfig } from 'tsdown'

export default defineConfig({
	attw: {
		enabled: true,
		level: 'error',
		profile: 'esm-only',
	},
	clean: true,
	dts: true,
	entry: ['./src/index.ts'],
	exports: {
		enabled: 'local-only',
	},
	format: ['esm'],
	publint: {
		enabled: true,
	},
	shims: true,
	tsconfig: './tsconfig.prod.json',
})
