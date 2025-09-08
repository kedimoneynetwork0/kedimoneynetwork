const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Migration script to help preserve data when switching to the correct SQLite setup
async function migrateData() {
  console.log('Starting data migration...');

  // Check if old database files exist
  const fs = require('fs');

  const oldDbPath = path.join(__dirname, 'db.sqlite');
  const newDbPath = path.join(__dirname, 'kedi_money_network.db');

  if (fs.existsSync(oldDbPath)) {
    console.log('Found old database file: db.sqlite');

    // Open both databases
    const oldDb = new sqlite3.Database(oldDbPath);
    const newDb = new sqlite3.Database(newDbPath);

    try {
      // Check if old database has data
      const oldUsers = await getTableCount(oldDb, 'users');
      console.log(`Old database has ${oldUsers} users`);

      if (oldUsers > 0) {
        console.log('Migrating data from old database...');

        // Migrate users (skip if they already exist to avoid duplicates)
        await migrateTable(oldDb, newDb, 'users', 'email');
        await migrateTable(oldDb, newDb, 'transactions', null);
        await migrateTable(oldDb, newDb, 'bonuses', null);
        await migrateTable(oldDb, newDb, 'stakes', null);
        await migrateTable(oldDb, newDb, 'withdrawals', null);
        await migrateTable(oldDb, newDb, 'news', null);

        console.log('Data migration completed successfully!');
        console.log('You can now safely delete the old db.sqlite file if desired.');
      } else {
        console.log('Old database appears to be empty, no migration needed.');
      }
    } catch (error) {
      console.error('Error during migration:', error);
    } finally {
      oldDb.close();
      newDb.close();
    }
  } else {
    console.log('No old database file found. Starting fresh with new SQLite database.');
  }
}

function getTableCount(db, tableName) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT COUNT(*) as count FROM ${tableName}`, (err, row) => {
      if (err) {
        // Table might not exist
        resolve(0);
      } else {
        resolve(row.count);
      }
    });
  });
}

function migrateTable(oldDb, newDb, tableName, uniqueColumn = null) {
  return new Promise((resolve, reject) => {
    // Get all data from old table
    oldDb.all(`SELECT * FROM ${tableName}`, async (err, rows) => {
      if (err) {
        console.log(`Table ${tableName} not found in old database, skipping...`);
        resolve();
        return;
      }

      if (rows.length === 0) {
        console.log(`No data in ${tableName}, skipping...`);
        resolve();
        return;
      }

      console.log(`Migrating ${rows.length} records from ${tableName}...`);

      // Insert data into new table
      for (const row of rows) {
        try {
          // Check if record already exists (if unique column provided)
          if (uniqueColumn && row[uniqueColumn]) {
            const exists = await checkExists(newDb, tableName, uniqueColumn, row[uniqueColumn]);
            if (exists) {
              console.log(`Record with ${uniqueColumn} ${row[uniqueColumn]} already exists, skipping...`);
              continue;
            }
          }

          // Insert the record
          await insertRecord(newDb, tableName, row);
        } catch (insertErr) {
          console.error(`Error inserting record into ${tableName}:`, insertErr);
        }
      }

      console.log(`Migration completed for ${tableName}`);
      resolve();
    });
  });
}

function checkExists(db, tableName, column, value) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT 1 FROM ${tableName} WHERE ${column} = ? LIMIT 1`, [value], (err, row) => {
      if (err) {
        resolve(false);
      } else {
        resolve(!!row);
      }
    });
  });
}

function insertRecord(db, tableName, record) {
  return new Promise((resolve, reject) => {
    const columns = Object.keys(record).filter(key => record[key] !== null);
    const values = columns.map(key => record[key]);
    const placeholders = columns.map(() => '?').join(', ');

    const sql = `INSERT OR IGNORE INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

    db.run(sql, values, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateData().then(() => {
    console.log('Migration script completed.');
    process.exit(0);
  }).catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}

module.exports = { migrateData };