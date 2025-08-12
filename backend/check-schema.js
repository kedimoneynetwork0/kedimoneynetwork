const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.sqlite');

db.serialize(() => {
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      console.error('Error getting tables:', err);
      return;
    }
    
    console.log('Tables in database:');
    tables.forEach(table => {
      console.log('- ' + table.name);
      
      // Get table schema
      db.all(`PRAGMA table_info(${table.name})`, (err, columns) => {
        if (err) {
          console.error(`Error getting schema for ${table.name}:`, err);
          return;
        }
        
        console.log(`Schema for ${table.name}:`);
        columns.forEach(column => {
          console.log(`  ${column.name} (${column.type}) ${column.notnull ? 'NOT NULL' : ''} ${column.pk ? 'PRIMARY KEY' : ''}`);
        });
      });
    });
  });
});

setTimeout(() => {
  db.close();
}, 1000);