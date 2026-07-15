import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required.');
const target = new URL(connectionString);
if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(target.hostname)) {
  throw new Error('Admin demo records may only be removed from local PostgreSQL.');
}

async function main() {
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    const result = await client.query(
      `delete from waitlist_leads
       where source = 'admin-demo'
         and normalized_email like 'admin-demo.%@example.test'`,
    );
    console.log(`Marked local admin demo leads removed: ${result.rowCount ?? 0}`);
    console.log(`Sanitized target: ${target.hostname}:${target.port || '5432'}/${target.pathname.slice(1)}`);
  } finally {
    await client.end();
  }
}

void main();
