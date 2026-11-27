import pg from "pg";

const { Client } = pg;

async function test() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: true },
    connectionTimeoutMillis: 8000,
  });

  try {
    await client.connect();

    const result = await client.query(
      "SELECT current_database(), current_setting('server_version')"
    );

    console.log("Connection successful:");
    console.log(result.rows);
  } catch (error) {
    console.error("Connection failed:", error.message);
  } finally {
    await client.end().catch(() => {});
  }
}

test();