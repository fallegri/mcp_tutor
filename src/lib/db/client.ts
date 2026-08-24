import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Create a SQL query function using Neon's serverless driver
const sql = neon(process.env.DATABASE_URL!);

// Create Drizzle ORM instance
export const db = drizzle(sql, { schema });

// Export for direct SQL queries if needed
export { sql };
