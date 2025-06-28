import { drizzle } from 'drizzle-orm/neon-http';
import { neon, Pool } from '@neondatabase/serverless';
import * as schema from '../shared/schema';

// Check if we have a database URL, if not, we'll use in-memory storage
const databaseUrl = process.env.DATABASE_URL;

let db: any = null;
let pool: any = null;

if (databaseUrl) {
  // Create a database connection for Drizzle ORM only if DATABASE_URL is provided
  const sql = neon(databaseUrl);
  db = drizzle(sql, { schema });

  // Create a Pool for session storage
  pool = new Pool({
    connectionString: databaseUrl
  });
} else {
  console.log('No DATABASE_URL provided, using in-memory storage');
}

export { db, pool };