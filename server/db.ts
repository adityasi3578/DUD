import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';

let pool: Pool | undefined;
let db: ReturnType<typeof drizzle> | undefined;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  db = drizzle(pool, { schema });
}

export { pool, db };
