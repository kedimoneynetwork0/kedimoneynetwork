# PostgreSQL Setup Guide for KEDI Money Network

This guide will help you set up PostgreSQL database for your KEDI Money Network application on Render.

## 🚀 Quick Setup for Render Deployment

### 1. Create PostgreSQL Database on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "PostgreSQL"
3. Configure your database:
   - **Name**: `kedi-money-network-db`
   - **Database**: `kedi_money_network`
   - **User**: Choose a username
   - **Region**: Select the closest region to your users
   - **Version**: Latest PostgreSQL version

4. Click "Create Database"
5. Wait for the database to be provisioned
6. Copy the **External Database URL** from the dashboard

### 2. Update Environment Variables

In your Render web service environment variables, set:

```bash
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your_super_secret_jwt_key_here
ADMIN_EMAIL=kedimoneynetwork@gmail.com
ADMIN_PASSWORD=your_secure_admin_password
NODE_ENV=production
```

### 3. Database Schema Setup

The application will automatically create all necessary tables when it starts. The following tables will be created:

- `users` - User accounts and profiles
- `transactions` - Financial transactions
- `bonuses` - Referral bonuses
- `stakes` - Investment stakes
- `withdrawals` - Withdrawal requests
- `news` - News articles
- `messages` - User notifications
- `password_reset_requests` - Password reset functionality

## 🛠️ Local Development Setup

### Option 1: Local PostgreSQL Installation

1. **Install PostgreSQL**:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib

   # macOS with Homebrew
   brew install postgresql
   brew services start postgresql

   # Windows - Download from postgresql.org
   ```

2. **Create Database**:
   ```bash
   createdb kedi_money_network
   ```

3. **Update .env file**:
   ```bash
   DATABASE_URL=postgresql://username:password@localhost:5432/kedi_money_network
   ```

### Option 2: Docker PostgreSQL

1. **Run PostgreSQL with Docker**:
   ```bash
   docker run --name kedi-postgres \
     -e POSTGRES_DB=kedi_money_network \
     -e POSTGRES_USER=kedi_user \
     -e POSTGRES_PASSWORD=kedi_password \
     -p 5432:5432 \
     -d postgres:13
   ```

2. **Update .env file**:
   ```bash
   DATABASE_URL=postgresql://kedi_user:kedi_password@localhost:5432/kedi_money_network
   ```

## 🔧 Database Migration

The application automatically handles database schema creation. When you start the application for the first time, it will:

1. Connect to your PostgreSQL database
2. Create all necessary tables
3. Seed the admin user account

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  firstname VARCHAR(255),
  lastname VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255),
  referralId VARCHAR(255),
  idNumber VARCHAR(20),
  role VARCHAR(50),
  status VARCHAR(50),
  profile_picture VARCHAR(500),
  estimated_balance DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Transactions Table
```sql
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  type VARCHAR(50),
  amount DECIMAL(10,2),
  txn_id VARCHAR(255),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Stakes Table
```sql
CREATE TABLE stakes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  amount DECIMAL(10,2),
  stake_period INTEGER,
  interest_rate DECIMAL(5,4),
  start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active'
);
```

### Withdrawals Table
```sql
CREATE TABLE withdrawals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  stake_id INTEGER REFERENCES stakes(id),
  amount DECIMAL(10,2),
  request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending',
  processed_date TIMESTAMP
);
```

## 🚀 Deployment Checklist

- [ ] PostgreSQL database created on Render
- [ ] DATABASE_URL environment variable set
- [ ] JWT_SECRET environment variable set
- [ ] ADMIN_EMAIL and ADMIN_PASSWORD set
- [ ] NODE_ENV set to 'production'
- [ ] Web service deployed on Render
- [ ] Static file serving configured
- [ ] Domain configured (optional)

## 🔍 Troubleshooting

### Connection Issues
- Verify DATABASE_URL format: `postgresql://user:password@host:port/database`
- Ensure database is accessible from Render's IP range
- Check firewall settings if using local PostgreSQL

### Migration Issues
- Check application logs for database errors
- Verify PostgreSQL user has CREATE TABLE permissions
- Ensure database name matches in connection string

### Performance
- Monitor query performance with `EXPLAIN ANALYZE`
- Consider adding database indexes for frequently queried columns
- Use connection pooling for high-traffic applications

## 📞 Support

For issues with PostgreSQL setup:
1. Check Render's PostgreSQL documentation
2. Review application logs in Render dashboard
3. Verify environment variables are correctly set
4. Test database connection locally first

## 🔒 Security Notes

- Never commit database credentials to version control
- Use strong, unique passwords for database users
- Regularly update PostgreSQL to latest version
- Enable SSL connections in production
- Use Render's managed PostgreSQL for automatic backups

---

**Happy deploying! 🎉**