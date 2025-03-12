import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';
import pg from 'pg';
import { log } from './vite';

// Create a postgres connection for Drizzle ORM
const connectionString = process.env.DATABASE_URL!;
log(`Connecting to database: ${connectionString ? 'Connection string available' : 'Missing connection string'}`, 'database');

// Create postgres client for Drizzle ORM
const queryClient = postgres(connectionString, {
  max: 10, // Maximum number of connections
  idle_timeout: 20, // Idle connection timeout in seconds
  connect_timeout: 10, // Connection timeout in seconds
});

// Test connection
queryClient`SELECT 1`.then(() => {
  log('Database connection successful', 'database');
}).catch(err => {
  log(`Database connection test failed: ${err.message}`, 'database');
});

// Create a Pool for session storage
const pool: pg.Pool = new pg.Pool({
  connectionString: connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Test pool connection
pool.query('SELECT 1').then(() => {
  log('Session pool connection successful', 'database');
}).catch(err => {
  log(`Session pool connection test failed: ${err.message}`, 'database');
});

// Export database client and pool
export const db = drizzle(queryClient, { schema });
export { pool };