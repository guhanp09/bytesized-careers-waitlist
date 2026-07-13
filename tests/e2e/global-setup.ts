import { Pool } from 'pg';

// Reset the test database before the e2e run so results are deterministic across reruns.
export default async function globalSetup() {
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL ??
      'postgresql://postgres:postgres@localhost:5433/bytesized_test',
  });
  try {
    await pool.query(
      'truncate table waitlist_leads, rate_limit_hits restart identity cascade',
    );
  } finally {
    await pool.end();
  }
}
