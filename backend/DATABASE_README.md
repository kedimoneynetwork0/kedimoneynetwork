# Database Persistence Fix

## Problem Identified
Your Node.js backend was using a mixed SQLite/PostgreSQL configuration that was causing data persistence issues. The main `index.js` file was:
- Creating a SQLite database but using PostgreSQL-style queries (`pool.query()`)
- This caused database operations to fail silently
- Data appeared to disappear on server restarts

## Solution Implemented
✅ **Fixed**: Updated `package.json` to use the working `index-sqlite.js` file
✅ **Fixed**: Database now properly uses SQLite with correct query functions
✅ **Fixed**: Database file is stored persistently at `backend/kedi_money_network.db`
✅ **Added**: Migration script to preserve existing data

## Database Configuration
- **Database Type**: SQLite (file-based, persistent)
- **Database File**: `backend/kedi_money_network.db`
- **Tables**: users, transactions, bonuses, stakes, withdrawals, news, messages
- **Persistence**: Data survives server restarts and deployments

## How to Use

### 1. Start the Server (Fixed Configuration)
```bash
cd backend
npm start
```
This now uses the correct SQLite implementation.

### 2. Migrate Existing Data (if any)
If you had data in the old broken setup, run the migration:
```bash
cd backend
npm run migrate
```
This will:
- Check for old database files (`db.sqlite`)
- Migrate users, transactions, and other data
- Preserve existing data without duplicates

### 3. Verify Database Persistence
1. Start the server: `npm start`
2. Create a test user or transaction
3. Stop the server (Ctrl+C)
4. Restart the server: `npm start`
5. Verify data is still there

## Database Schema
The database includes these tables:
- `users` - User accounts and profiles
- `transactions` - Financial transactions
- `bonuses` - Referral bonuses
- `stakes` - Investment stakes
- `withdrawals` - Withdrawal requests
- `news` - News articles
- `messages` - User notifications

## Environment Variables
Make sure your `backend/.env` file includes:
```
JWT_SECRET=your_secure_jwt_secret
ADMIN_EMAIL=kedimoneynetwork@gmail.com
ADMIN_PASSWORD=your_admin_password
```

## File Structure
```
backend/
├── index-sqlite.js      # ✅ Working SQLite server (now used)
├── index.js            # ❌ Broken mixed configuration
├── migrate-data.js     # ✅ Data migration script
├── kedi_money_network.db  # ✅ Persistent database file
├── package.json        # ✅ Updated to use correct entry point
└── .env               # ✅ Environment configuration
```

## Troubleshooting
- **Data still disappears**: Make sure you're running `npm start` (uses index-sqlite.js)
- **Migration fails**: Check that old database files exist and are readable
- **Server won't start**: Verify all dependencies are installed with `npm install`

## Production Deployment
For production, you can:
1. Use the same SQLite setup (file-based)
2. Or switch to PostgreSQL by updating the environment variables
3. The database file will persist across deployments if stored in persistent storage

## Backup
To backup your data:
```bash
cp backend/kedi_money_network.db backend/backup_$(date +%Y%m%d_%H%M%S).db
```

Your data persistence issues should now be resolved! 🎉