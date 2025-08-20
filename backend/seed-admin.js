const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('./db.sqlite');

const email = 'kedimoneynetwork@gmail.com';
const password = 'kedi@123';

async function seedAdmin() {
  const hash = await bcrypt.hash(password, 10);

  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT,
      status TEXT
    )`,
    (err) => {
      if (err) return console.error(err.message);

      db.run(
        `INSERT OR IGNORE INTO users (email, password, role, status) VALUES (?, ?, ?, ?)`,
        [email, hash, 'admin', 'approved'],
        (err) => {
          if (err) return console.error(err.message);
          console.log(`Admin user seeded: ${email} / ${password}`);
          db.close();
        }
      );
    }
  );
}

seedAdmin();
