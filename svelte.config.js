import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter(),

		// Content-Security-Policy. SvelteKit hashes every inline script/style in the rendered
		// output (including the landing page's application/ld+json blocks), so script-src stays
		// 'self' with no 'unsafe-inline'/'unsafe-eval'.
		csp: {
			mode: 'hash',
			directives: {
				'default-src': ['self'],
				// SvelteKit auto-adds the hash of its own bootstrap script. The hashes below are static
				// inline scripts SvelteKit does not hash for us: the theme no-flash script in
				// src/app.html, and the three application/ld+json (SEO) blocks in src/routes/+page.svelte.
				// Regenerate the corresponding hash if any of those scripts change.
				'script-src': [
					'self',
					'sha256-p8wGsD1QUb2wjh2RG8ZGukCIfrJrXWJhoZ5yHjeRpxs=',
					'sha256-lNo+ozNcY52oi6r9dq+YBs69XYm28nIM1UJu/9eScBQ=',
					'sha256-aeEDSoAiNqwGDsLiJYMz2vSFRdjCPDxSxyckGNZpIHE=',
					'sha256-fRDNk8nQitLBJjoi+t8JkAaST9FM54MS7f5UHF4zzlg='
				],
				'style-src': ['self', 'unsafe-inline', 'https://fonts.googleapis.com'],
				'font-src': ['self', 'https://fonts.gstatic.com'],
				'img-src': ['self', 'data:', 'https://*.supabase.co'],
				'connect-src': [
					'self',
					'https://*.supabase.co',
					'https://api.iconify.design',
					'https://api.simplesvg.com',
					'https://api.unisvg.com',
					'ws://localhost:*',
					'wss://localhost:*',
					'ws://127.0.0.1:*',
					'wss://127.0.0.1:*'
				]
			}
		}
	},
	
	// Allow Svelte to process files in node_modules
	compilerOptions: {
		customElement: false
	},
	
	// Enable processing .svelte files from node_modules
	extensions: ['.svelte']
};

export default config;
