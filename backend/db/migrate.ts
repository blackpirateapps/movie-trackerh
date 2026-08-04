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

    // Check if user_movies table has old CHECK constraint (rating <= 5) and migrate if needed
    try {
      const tableInfo = await db.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='user_movies'");
      if (tableInfo.rows.length > 0) {
        const sql = String(tableInfo.rows[0].sql || '');
        if (sql.includes('rating <= 5') || sql.includes('CHECK')) {
          console.log('Migrating user_movies table to remove old rating CHECK constraint...');
          await db.execute('ALTER TABLE user_movies RENAME TO user_movies_old;');
          await db.execute(`
            CREATE TABLE user_movies (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL,
              movie_id INTEGER NOT NULL,
              rating INTEGER,
              review TEXT,
              watched_date DATE,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
              FOREIGN KEY (movie_id) REFERENCES movies (id) ON DELETE CASCADE,
              UNIQUE (user_id, movie_id)
            );
          `);
          await db.execute(`
            INSERT INTO user_movies (id, user_id, movie_id, rating, review, watched_date, created_at, updated_at)
            SELECT id, user_id, movie_id, rating, review, watched_date, created_at, updated_at FROM user_movies_old;
          `);
          await db.execute('DROP TABLE user_movies_old;');
          console.log('user_movies table migrated successfully!');
        }
      }
    } catch (migErr) {
      console.error('Error auto-migrating user_movies table:', migErr);
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
