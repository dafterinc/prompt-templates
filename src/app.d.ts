/// <reference types="@sveltejs/kit" />

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import { SupabaseClient, Session } from '@supabase/supabase-js';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: import('@supabase/supabase-js').User | null;
		}
		// interface PageData {}
		interface PageState {
			[key: string]: any;
		}
		// interface Platform {}
	}
}

export {};

// For TypeScript support for Svelte modules
declare module '$app/navigation' {
	export function goto(
		url: string | URL,
		opts?: {
			replaceState?: boolean;
			noScroll?: boolean;
			keepFocus?: boolean;
			invalidateAll?: boolean;
			state?: App.PageState;
		}
	): Promise<void>;
}

declare module '$app/stores' {
	import { type Readable } from 'svelte/store';
	
	interface Page {
		url: URL;
		params: Record<string, string>;
		state: App.PageState;
		status: number;
		error: Error | null;
		data: Record<string, any>;
		form: Record<string, any> | null;
	}
	
	export const page: Readable<Page>;
	export const navigating: Readable<{
		from: {
			url: URL;
			params: Record<string, string>;
		} | null;
		to: {
			url: URL;
			params: Record<string, string>;
		} | null;
	} | null>;
}
