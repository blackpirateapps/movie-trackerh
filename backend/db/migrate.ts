import { db } from '../lib/turso.js';
import fs from 'fs';
import path from 'path';

async function migrate() {
  try {
    const schemaPath = path.join(process.cwd(), 'backend', 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    console.log('Starting database migration...');
    
    for (const statement of statements) {
      if (statement.trim()) {
        await db.execute(statement.trim());
        console.log('Executed:', statement.trim().substring(0, 50) + '...');
      }
    }
    
    console.log('Migration completed successfully!');
    
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
