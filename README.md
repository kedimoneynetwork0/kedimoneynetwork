# KEDI BUSINESS & AGRI FUNDS

A comprehensive financial management platform built with React, Node.js, and PostgreSQL.

## 🚀 Features

- ✅ **User Management**: Registration, authentication, and profile management
- ✅ **Financial Transactions**: Tree plans, savings, and loan management
- ✅ **Staking System**: Investment staking with interest calculations
- ✅ **Admin Dashboard**: Complete administrative control
- ✅ **News Management**: Dynamic news posting and management
- ✅ **File Uploads**: Profile pictures and media uploads
- ✅ **Real-time Notifications**: User messaging system
- ✅ **Responsive Design**: Mobile-first approach with Tailwind CSS

## 🗄️ Database Migration: SQLite → PostgreSQL

**IMPORTANT**: This application has been migrated from SQLite to PostgreSQL for production deployment on Render.

### What's Changed:
- ✅ Database connection updated to PostgreSQL
- ✅ All SQL queries converted to PostgreSQL syntax
- ✅ Environment variables configured for Render
- ✅ Automatic table creation and seeding
- ✅ Production-ready database schema

### Quick Setup:
1. **Create PostgreSQL database on Render**
2. **Copy the DATABASE_URL from Render dashboard**
3. **Set environment variables in your Render web service**
4. **Deploy!** The app will automatically create tables and seed admin user

## 📋 Deployment to Render

### Option 1: Using render.yaml (Recommended - Single Service)

1. Push your code to a GitHub repository
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click "New +" → "Blueprint"
4. Connect your GitHub repository
5. Render will automatically detect `render.yaml` and set up:
   - PostgreSQL database
   - Web service with frontend and backend combined
6. In the web service settings, add the following environment variables as **secrets**:
   ```
   JWT_SECRET=your_super_secret_jwt_key
   ADMIN_PASSWORD=your_secure_password
   ```
   (ADMIN_EMAIL is already set to kedimoneynetwork@gmail.com)
7. Deploy!

### Option 2: Separate Services (For Better Scaling)

#### Step 1: Create PostgreSQL Database
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "PostgreSQL"
3. Configure:
   - Name: `kedi-money-network-db`
   - Database: `kedi_money_network`
   - Choose your region
4. Copy the **External Database URL**

#### Step 2: Deploy Backend (Web Service)
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Set configuration:
   - **Runtime**: Node.js
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && node index.js`
4. Set environment variables:
   ```
   DATABASE_URL=postgresql://user:pass@host:port/db
   JWT_SECRET=your_super_secret_jwt_key
   ADMIN_EMAIL=kedimoneynetwork@gmail.com
   ADMIN_PASSWORD=your_secure_password
   NODE_ENV=production
   ```

#### Step 3: Deploy Frontend (Static Site)
1. Click "New +" → "Static Site"
2. Connect your GitHub repository
3. Set configuration:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Set environment variable:
   ```
   VITE_API_BASE=https://your-backend-service.onrender.com/api
   ```

## 🔧 Local Development

### Prerequisites
- Node.js 16+
- PostgreSQL (local or Docker)

### Setup
```bash
# Install dependencies
npm install
cd backend && npm install

# Set up environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your database URL

# Start development servers
npm run dev          # Frontend on :5173
cd backend && npm start  # Backend on :4000
```

### Docker PostgreSQL (Recommended)
```bash
docker run --name kedi-postgres \
  -e POSTGRES_DB=kedi_money_network \
  -e POSTGRES_USER=kedi_user \
  -e POSTGRES_PASSWORD=kedi_password \
  -p 5432:5432 \
  -d postgres:13
```

## 📊 Database Schema

The application automatically creates these tables:
- `users` - User accounts and profiles
- `transactions` - Financial transactions
- `stakes` - Investment stakes
- `withdrawals` - Withdrawal requests
- `bonuses` - Referral bonuses
- `news` - News articles
- `messages` - User notifications

## 🔒 Security Features

- JWT authentication with expiration
- Password hashing with bcrypt
- Rate limiting on login endpoints
- Input validation and sanitization
- CORS protection
- File upload restrictions

## Local Development

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install
npm start
```

## 🐛 Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` format: `postgresql://user:password@host:port/database`
- Ensure PostgreSQL database is running and accessible
- Check Render database credentials are correct

### Build Issues
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version compatibility

### File Upload Issues
- Ensure `uploads/` directory exists in backend
- Check file permissions for uploads directory
- Verify multer configuration for file types

### Authentication Issues
- Verify JWT_SECRET is set and matches between frontend/backend
- Check token expiration (1 hour default)
- Ensure CORS is properly configured

## 📚 Additional Resources

- [PostgreSQL Setup Guide](./POSTGRESQL_SETUP.md) - Detailed database setup instructions
- [Render Deployment Docs](https://docs.render.com/) - Official Render documentation
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework used

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

---

**Built with ❤️ for the KEDI Money Network community**