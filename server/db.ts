import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '../shared/schema';

// Use a local sqlite file if no DATABASE_URL is provided
const client = createClient({ url: process.env.DATABASE_URL || 'file:sqlite.db' });
export const db = drizzle(client, { schema });
export const pool = null;