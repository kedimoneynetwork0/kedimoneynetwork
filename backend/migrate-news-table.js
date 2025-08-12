const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.sqlite');

db.serialize(() => {
  // Add media_url column if it doesn't exist
  db.run(`ALTER TABLE news ADD COLUMN media_url TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding media_url column:', err);
    } else if (err && err.message.includes('duplicate column name')) {
      console.log('Column media_url already exists');
    } else {
      console.log('Added media_url column to news table');
    }
  });
  
  // Add media_type column if it doesn't exist
  db.run(`ALTER TABLE news ADD COLUMN media_type TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding media_type column:', err);
    } else if (err && err.message.includes('duplicate column name')) {
      console.log('Column media_type already exists');
    } else {
      console.log('Added media_type column to news table');
    }
  });
});

setTimeout(() => {
  db.close();
  console.log('Migration completed');
}, 1000);