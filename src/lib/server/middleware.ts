import type { RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';

// Simple in-memory rate limiter
const rateLimiter = new Map<string, { count: number; resetTime: number }>();

// Get rate limiting settings from environment variables or use defaults
const MAX_REQUESTS = parseInt(env.RATE_LIMIT_MAX_REQUESTS || '100', 10);
const WINDOW_MS = parseInt(env.RATE_LIMIT_WINDOW_MS || '60000', 10); // Default: 1 minute

/**
 * Rate limiting middleware for API routes
 * Limits the number of requests from a single IP address
 */
export async function applyRateLimit(event: RequestEvent): Promise<void> {
  const clientIp = event.getClientAddress();
  const now = Date.now();
  
  // Skip rate limiting for local development
  if (event.url.hostname === 'localhost' || event.url.hostname === '127.0.0.1') {
    return;
  }
  
  // Initialize or get existing rate limit data
  let limitData = rateLimiter.get(clientIp);
  
  if (!limitData || now > limitData.resetTime) {
    // First request or window expired, create new entry
    limitData = { count: 1, resetTime: now + WINDOW_MS };
    rateLimiter.set(clientIp, limitData);
    return;
  }
  
  // Increment counter
  limitData.count++;
  
  // Check if limit exceeded
  if (limitData.count > MAX_REQUESTS) {
    // Clean up very old entries
    const cleanupTime = now - (WINDOW_MS * 10);
    for (const [ip, data] of rateLimiter.entries()) {
      if (data.resetTime < cleanupTime) {
        rateLimiter.delete(ip);
      }
    }
    
    throw error(429, 'Too many requests. Please try again later.');
  }
}

/**
 * Force HTTPS middleware
 * Redirects HTTP requests to HTTPS in production
 */
export function forceHttps(event: RequestEvent): Response | null {
  const forceHttpsEnabled = env.FORCE_HTTPS === 'true';
  
  if (
    forceHttpsEnabled && 
    event.url.protocol === 'http:' && 
    event.url.hostname !== 'localhost' && 
    event.url.hostname !== '127.0.0.1'
  ) {
    const httpsUrl = new URL(event.url.toString());
    httpsUrl.protocol = 'https:';
    
    return new Response(null, {
      status: 301,
      headers: {
        'Location': httpsUrl.toString()
      }
    });
  }
  
  return null;
} 