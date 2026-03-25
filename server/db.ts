import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  console.error("CRITICAL ERROR: DATABASE_URL environment variable is MISSING.");
  throw new Error("DATABASE_URL must be set. Please check your Vercel Environment Variables.");
}

console.log("Initializing database connection with Neon...");
export const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });