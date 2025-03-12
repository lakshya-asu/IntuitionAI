import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';
import pg from 'pg';

// Create a postgres connection for Drizzle ORM
const connectionString = process.env.DATABASE_URL!;
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });

// Create a Pool for session storage
export const pool = new pg.Pool({
  connectionString: connectionString
});