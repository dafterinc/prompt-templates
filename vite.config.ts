import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	// PostCSS (Tailwind + autoprefixer) is configured in postcss.config.cjs; do not inline a
	// `css.postcss` block here or it silently overrides that file and drops autoprefixer.
	optimizeDeps: {
		// Include svelte-sonner for dependency optimization
		include: ['svelte-sonner']
	},
	resolve: {
		// Ensure .svelte files in node_modules are resolved properly
		extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.svelte'],
		// Under Vitest, resolve Svelte's browser build so @testing-library/svelte's `mount` works
		// (otherwise it picks the server build and throws "mount(...) is not available on the server").
		...(process.env.VITEST ? { conditions: ['browser'] } : {})
	},
	ssr: {
		// Add svelte-sonner to noExternal to ensure it's properly processed in SSR
		noExternal: ['svelte-sonner']
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./src/setupTests.ts', './vitest-setup-client.ts']
	}
});
