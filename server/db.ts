import { drizzle } from 'drizzle-orm/neon-http';
import { neon, Pool } from '@neondatabase/serverless';
import * as schema from '../shared/schema';

// Create a database connection for Drizzle ORM
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

// Create a Pool for session storage
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL!
});