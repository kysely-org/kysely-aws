import { isCI } from 'std-env'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		globals: true,
		allowOnly: !isCI,
		globalSetup: ['./vitest.setup.ts'],
		typecheck: {
			enabled: true,
			ignoreSourceErrors: true,
		},
	},
})
