const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.sqlite');

db.serialize(() => {
  db.each(`SELECT * FROM users`, (err, row) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(row);
  });
});

setTimeout(() => {
  db.close();
}, 1000);