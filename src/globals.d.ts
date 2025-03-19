/// <reference types="svelte" />
/// <reference types="@sveltejs/kit" />

// Declare module types for SvelteKit modules to fix TypeScript errors
declare module '$app/stores' {
	import type { Readable } from 'svelte/store';
	
	export interface Page {
		url: URL;
		params: Record<string, string>;
		status: number;
		error: Error | null;
		data: Record<string, any>;
		form?: Record<string, any> | null;
	}
	
	export const page: Readable<Page>;
	export const navigating: Readable<{
		from: {
			url: URL;
			params: Record<string, string>;
		};
		to: {
			url: URL;
			params: Record<string, string>;
		};
	} | null>;
}

declare module '$app/navigation' {
	export function goto(
		url: string | URL,
		opts?: {
			replaceState?: boolean;
			noScroll?: boolean;
			keepFocus?: boolean;
			invalidateAll?: boolean;
			state?: Record<string, any>;
		}
	): Promise<void>;
	
	export function invalidate(path: string): Promise<void>;
	export function invalidateAll(): Promise<void>;
}

declare module 'svelte' {
	export function onMount(callback: () => void | (() => void)): void;
} 