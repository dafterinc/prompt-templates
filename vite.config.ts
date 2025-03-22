import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from 'tailwindcss';

export default defineConfig({
	plugins: [sveltekit()],
	css: {
		postcss: {
			plugins: [tailwindcss]
		}
	},
	optimizeDeps: {
		// Include svelte-sonner for dependency optimization
		include: ['svelte-sonner']
	},
	resolve: {
		// Ensure .svelte files in node_modules are resolved properly
		extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.svelte']
	},
	ssr: {
		// Add svelte-sonner to noExternal to ensure it's properly processed in SSR
		noExternal: ['svelte-sonner']
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./src/setupTests.ts']
	}
});
