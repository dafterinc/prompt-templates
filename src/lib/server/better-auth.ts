import { betterAuth } from 'better-auth';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { Pool } from 'pg';
import { env } from '$env/dynamic/private';

// Better Auth. It owns the user/session/account/verification tables and uses node-postgres (Kysely
// under the hood). The app's own data uses postgres.js ($lib/server/db.ts); both talk to the same
// database through pgBouncer.
//
// Env: BETTER_AUTH_SECRET (32+ char random), BETTER_AUTH_URL (the app's base URL), DATABASE_URL,
// SMTP2GO_API_KEY + EMAIL_FROM (transactional email).
//
// node-postgres treats `sslmode=require` in the URL as verify-full, which rejects the lab's
// self-signed certificate and ignores the explicit `ssl` option. Strip sslmode from the URL and
// pass ssl explicitly: TLS stays on, CA verification is skipped. Pin the CA cert for production.
const pgConnectionString = (env.DATABASE_URL || '').replace(/\??&?sslmode=[^&]*/i, '');

// Transactional email via the SMTP2GO HTTP API (no SMTP dependency needed).
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
	const apiKey = env.SMTP2GO_API_KEY;
	const sender = env.EMAIL_FROM;
	if (!apiKey || !sender) {
		console.error('[auth] email not sent: SMTP2GO_API_KEY / EMAIL_FROM not configured');
		throw new Error('Email is not configured');
	}
	const res = await fetch('https://api.smtp2go.com/v3/email/send', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ api_key: apiKey, sender, to: [to], subject, html_body: html })
	});
	if (!res.ok) {
		console.error('[auth] SMTP2GO send failed', res.status, await res.text());
		throw new Error('Failed to send email');
	}
}

export const auth = betterAuth({
	database: new Pool({
		connectionString: pgConnectionString,
		ssl: { rejectUnauthorized: false }
	}),
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
	emailAndPassword: {
		enabled: true,
		sendResetPassword: async ({ user, url }) => {
			await sendEmail(
				user.email,
				'Reset your password',
				`<p>Hello,</p>
				<p>We received a request to reset your password. Click the link below to choose a new one:</p>
				<p><a href="${url}">Reset your password</a></p>
				<p>If you didn't request this, you can safely ignore this email.</p>`
			);
		}
	},
	plugins: [sveltekitCookies(getRequestEvent)]
});
