const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { open } = require('sqlite');

const dbPath = path.join(__dirname, 'admin_auth.sqlite');

/** Initialize SQLite for Admin Authentication */
async function initDb() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT, -- In production, we'd hash this!
      role TEXT DEFAULT 'ADMIN'
    )
  `);

  // Insert a default admin if none exists (hardcoded for the user's requirement)
  const existing = await db.get('SELECT * FROM admin_users WHERE username = ?', ['admin']);
  if (!existing) {
    await db.run('INSERT INTO admin_users (username, password, role) VALUES (?, ?, ?)', ['admin', 'admin', 'ADMIN']);
    console.log('[SQLite] Default admin created (admin/admin)');
  }

  return db;
}

initDb().catch(err => {
  console.error('[SQLite] Error initializing database:', err);
});

module.exports = { initDb };
