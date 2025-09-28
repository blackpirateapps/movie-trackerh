import { db } from './backend/lib/turso.js';
import fs from 'fs';
import path from 'path';

async function migrate() {
  try {
    // Read and execute the schema
    const schema = fs.readFileSync(path.join(process.cwd(), 'schema.sql'), 'utf8');
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    console.log('Starting database migration...');
    
    for (const statement of statements) {
      if (statement.trim()) {
        await db.execute(statement.trim());
        console.log('Executed:', statement.substring(0, 50) + '...');
      }
    }
    
    // Check if we need to migrate existing password_hash column to password
    try {
      const result = await db.execute("PRAGMA table_info(users)");
      const hasPasswordHash = result.rows.some(row => row.name === 'password_hash');
      const hasPassword = result.rows.some(row => row.name === 'password');
      
      if (hasPasswordHash && !hasPassword) {
        console.log('Migrating password_hash column to password...');
        await db.execute(`
          ALTER TABLE users ADD COLUMN password TEXT;
        `);
        await db.execute(`
          UPDATE users SET password = password_hash WHERE password_hash IS NOT NULL;
        `);
        // Note: SQLite doesn't support dropping columns easily, so we'll leave password_hash
        console.log('Password column migration completed');
      }
    } catch (migrationError) {
      console.log('Password column migration not needed or already done');
    }
    
    console.log('Migration completed successfully!');
    
    // Verify tables exist
    const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('Available tables:', tables.rows.map(row => row.name));
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

migrate();