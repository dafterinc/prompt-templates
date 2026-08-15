/// <reference types="svelte" />
/// <reference types="@sveltejs/kit" />

// See https://svelte.dev/docs/kit/types#app.d.ts for information about these interfaces.
import type { User } from '@supabase/supabase-js';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: User | null;
			isAdmin: boolean;
		}
		interface PageData {
			user: User | null;
			isAdmin: boolean;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
