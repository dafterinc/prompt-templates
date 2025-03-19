import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock SvelteKit's navigation functions
vi.mock('$app/navigation', () => ({
    goto: vi.fn(),
    invalidate: vi.fn(),
}));

// Mock SvelteKit's environment variables
vi.mock('$env/dynamic/public', () => ({
    env: {}
}));

// Add any other global test setup here 