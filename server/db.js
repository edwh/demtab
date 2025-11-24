import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, readdirSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, '../messages.db'));

// Migration system
function runMigrations() {
  // Create migrations table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const migrationsDir = join(__dirname, 'migrations');

  if (!existsSync(migrationsDir)) {
    console.log('No migrations directory found, skipping migrations');
    return;
  }

  const migrationFiles = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  const appliedMigrations = db.prepare('SELECT name FROM migrations').all().map(m => m.name);

  for (const file of migrationFiles) {
    if (!appliedMigrations.includes(file)) {
      console.log(`Applying migration: ${file}`);
      const sql = readFileSync(join(migrationsDir, file), 'utf-8');

      try {
        db.exec(sql);
        db.prepare('INSERT INTO migrations (name) VALUES (?)').run(file);
        console.log(`Migration ${file} applied successfully`);
      } catch (error) {
        console.error(`Error applying migration ${file}:`, error);
        throw error;
      }
    }
  }
}

// Run migrations on startup
runMigrations();

export default db;
