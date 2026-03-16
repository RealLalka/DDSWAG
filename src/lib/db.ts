import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../database.sqlite');
let db: any;
try {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
} catch (err) {
  console.error('Failed to initialize database:', err);
  // Fallback to a mock or throw a more descriptive error
  throw err;
}

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      min_budget REAL DEFAULT 15000
    );

    CREATE TABLE IF NOT EXISTS incomes (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      dates TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS debts (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      rate REAL NOT NULL,
      type TEXT NOT NULL,
      mandatoryPayment REAL,
      remainingMonths INTEGER,
      paymentDate INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      dueDate INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      item_id TEXT NOT NULL,
      item_type TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
    CREATE TABLE IF NOT EXISTS item_shifts (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      item_id TEXT NOT NULL,
      item_type TEXT NOT NULL,
      original_date TEXT NOT NULL,
      new_date TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `);
} catch (err) {
  console.error('Error creating tables:', err);
}

try {
  db.exec('ALTER TABLE users ADD COLUMN min_budget REAL DEFAULT 15000');
} catch (e) {}

try {
  db.exec('ALTER TABLE users ADD COLUMN calendar_start_date TEXT');
} catch (e) {}

try {
  db.exec('ALTER TABLE users ADD COLUMN debt_start_date TEXT');
} catch (e) {}

try {
  db.exec('ALTER TABLE debts ADD COLUMN paymentDate INTEGER DEFAULT 1');
} catch (e) {}

try {
  db.exec('ALTER TABLE users ADD COLUMN target_months INTEGER DEFAULT 24');
} catch (e) {}

try {
  db.exec('ALTER TABLE users ADD COLUMN avatar_url TEXT');
} catch (e) {}

try {
  db.exec('ALTER TABLE users ADD COLUMN google_id TEXT');
} catch (e) {}

export default db;
