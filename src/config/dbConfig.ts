import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import postgres from "postgres";
import * as schema from "../db/schema";
import { envConfigs } from "./envconfig";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load the local env file first, then fall back to the regular .env
// dotenv.config({ path: resolve(process.cwd(), '.env.local') });
// dotenv.config();

// // Configure postgres connection with SSL options for cloud databases
// const connectionString = process.env.DB_URL || envConfigs.db_url;
// const ssl = connectionString.includes('neon.tech') || 
//            connectionString.includes('supabase.co') || 
//            connectionString.includes('wstf.io') ? 
//            { rejectUnauthorized: false } : false;

// // Create postgres connection
// export const client = postgres(connectionString, { 
//   ssl,
//   max: 10, // connection pool size
//   idle_timeout: 20, // seconds before an idle connection is closed
//   connect_timeout: 10, // seconds to try to connect before error
// });


export const client = new Client({ connectionString: envConfigs.DB_URL });

client
  .connect()
  .then(() => {
  console.log("PostGre client connected Successfully");
  })
  .catch((err) => {
    console.log("Error Connecting the client", err);
  });



// Use the connection with Drizzle
const postgreDb = drizzle(client, { schema: { ...schema } });

export default postgreDb;