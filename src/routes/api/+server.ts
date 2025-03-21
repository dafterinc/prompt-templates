import type { RequestHandler } from './$types';

// Example endpoint with rate limiting now handled in hooks.server.ts
export const GET: RequestHandler = async () => {
  // No need for inline rate limiting as it's now handled by the middleware in hooks.server.ts
  
  // Normal API response logic here
  return new Response(JSON.stringify({ message: 'API response' }), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}; 