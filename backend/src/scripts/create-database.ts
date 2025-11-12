import { Client } from 'pg';
import { config } from 'dotenv';

config();

async function createDatabase() {
  // Connect to postgres database (default) to create our database
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT) || 5432,
    user: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: 'postgres', // Connect to default database
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL server');

    // Check if database exists
    const dbName = process.env.DATABASE_NAME || 'clarence_db';
    const result = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (result.rows.length === 0) {
      console.log(`Creating database "${dbName}"...`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database "${dbName}" created successfully!`);
    } else {
      console.log(`Database "${dbName}" already exists.`);
    }
  } catch (error) {
    console.error('Error creating database:', error);
    throw error;
  } finally {
    await client.end();
  }
}

createDatabase()
  .then(() => {
    console.log('Database setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to create database:', error);
    process.exit(1);
  });
