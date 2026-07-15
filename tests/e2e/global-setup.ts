import { Pool } from 'pg';

// Verify the dedicated test database is local and migrated. Never truncate pre-existing
// local rows; browser tests use unique addresses for isolation.
export default async function globalSetup() {
  const connectionString =
    process.env.DATABASE_URL ??
    'postgresql://postgres:postgres@localhost:5433/bytesized_test';
  const url = new URL(connectionString);
  if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(url.hostname)) {
    throw new Error('E2E tests refuse to use a non-local database.');
  }
  const pool = new Pool({
    connectionString,
  });
  try {
    await pool.query('select lead_data_version from waitlist_leads limit 0');
  } finally {
    await pool.end();
  }
}
