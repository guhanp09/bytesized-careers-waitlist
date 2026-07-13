import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Test environment defaults (integration tests point at a dedicated local Postgres DB).
// Set before any module reads process.env via src/lib/env. NODE_ENV is already 'test'
// under Vitest.
process.env.DATABASE_URL ??=
  'postgresql://postgres:postgres@localhost:5433/bytesized_test';
process.env.DB_DRIVER ??= 'node-postgres';
process.env.RESUME_TOKEN_SECRET ??= 'test-resume-secret';
process.env.RATE_LIMIT_IP_PEPPER ??= 'test-rate-pepper';

afterEach(() => {
  cleanup();
});
