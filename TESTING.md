# Testing the Integrated Kedi Money Network Application

This document provides step-by-step instructions for testing the integrated backend and frontend of the Kedi Money Network application.

## Prerequisites

Before testing, ensure you have:
1. Node.js installed (version 14 or higher)
2. A terminal/command prompt
3. The application codebase

## Setup Instructions

1. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

## Running the Application

### Start the Backend Server

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Start the server:
   ```bash
   npm start
   ```
   
   The backend will start on port 4000 by default.

### Start the Frontend Server

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Start the development server:
   ```bash
   npm start
   ```
   
   The frontend will start on port 3000 by default and open in your browser.

## Testing User Functionality

### 1. User Registration

1. Navigate to http://localhost:3000/signup
2. Fill in all required fields:
   - First Name
   - Last Name
   - Phone
   - Email (valid email format)
   - Username
   - Password (at least 8 characters with a number and special character)
   - ID/Passport Number
3. Click "Sign Up"
4. You should see a success message: "Signup successful, wait for admin approval"

### 2. User Login

1. Navigate to http://localhost:3000/login
2. Enter your email and password
3. Click "Login"
4. If your account is approved by an admin, you'll be redirected to the user dashboard
5. If your account is not approved, you'll see a message: "User not approved yet"

### 3. User Dashboard

After successful login, you'll be redirected to the user dashboard where you can:

1. View your referral bonus
2. Submit transactions:
   - Select transaction type (Tree Plan, Loan, or Savings)
   - Enter amount (positive number)
   - Enter transaction ID
   - Click "Make Transaction"
3. View your transaction history
4. Logout using the "Logout" button

### 4. User Profile

1. Navigate to the user profile page from the dashboard
2. View your profile information
3. Change your password:
   - Enter old password
   - Enter new password (at least 8 characters with a number and special character)
   - Click "Update Password"
4. Request password reset:
   - Click "Forgot Password? Request Admin Reset"

## Testing Admin Functionality

### 1. Admin Login

1. Navigate to http://localhost:3000/admin-login
2. Enter admin credentials (email and password)
3. Click "Login"
4. You'll be redirected to the admin dashboard

### 2. Admin Dashboard

After successful login, you'll be redirected to the admin dashboard where you can:

1. View pending users:
   - Approve or reject user registrations
2. View pending transactions:
   - Approve or reject transactions
3. Logout using the "Logout" button

## Testing API Endpoints

You can also test the API endpoints directly using tools like Postman or curl:

### Authentication Endpoints

1. POST /api/auth/signup
   - Request body: { firstname, lastname, phone, email, username, password, referralId, idNumber }
   - Response: { message }

2. POST /api/auth/login
   - Request body: { email, password }
   - Response: { token, role, status }

3. POST /api/auth/admin-login
   - Request body: { email, password }
   - Response: { token }

### User Endpoints

1. GET /api/user/bonus
   - Headers: Authorization: Bearer <token>
   - Response: { totalBonus }

2. GET /api/user/dashboard
   - Headers: Authorization: Bearer <token>
   - Response: { transactions }

3. GET /api/user/profile
   - Headers: Authorization: Bearer <token>
   - Response: { firstname, lastname, phone, email, username, referralId, idNumber }

4. POST /api/transactions
   - Headers: Authorization: Bearer <token>
   - Request body: { type, amount, txn_id }
   - Response: { message, id }

5. POST /api/user/change-password
   - Headers: Authorization: Bearer <token>
   - Request body: { oldPassword, newPassword }
   - Response: { message }

6. POST /api/user/request-password-reset
   - Request body: { email }
   - Response: { message }

### Admin Endpoints

1. GET /api/admin/pending-users
   - Headers: Authorization: Bearer <token>
   - Response: [ { id, email, firstname, lastname } ]

2. GET /api/admin/pending-transactions
   - Headers: Authorization: Bearer <token>
   - Response: [ { id, type, amount, txn_id, status, created_at, email } ]

3. PUT /api/admin/users/:id/approve
   - Headers: Authorization: Bearer <token>
   - Request body: { approve }
   - Response: { message }

4. PUT /api/admin/transactions/:id/approve
   - Headers: Authorization: Bearer <token>
   - Request body: { approve }
   - Response: { message }

## Troubleshooting

### Common Issues

1. **CORS Error**: Ensure the backend server is running on port 4000 and the frontend is configured to allow CORS requests.

2. **Port Conflicts**: If port 4000 or 3000 are already in use, you can change the ports:
   - Backend: Modify the PORT variable in backend/.env
   - Frontend: Modify the port in frontend/package.json start script

3. **Database Issues**: If you encounter database errors, you may need to delete the db.sqlite file in the backend directory and restart the server to recreate the database.

4. **Authentication Errors**: Ensure you're using the correct JWT token in the Authorization header for protected routes.

### Testing with curl

You can test API endpoints directly with curl:

1. User signup:
   ```bash
   curl -X POST http://localhost:4000/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"firstname":"John","lastname":"Doe","phone":"1234567890","email":"john@example.com","username":"johndoe","password":"Password123!","idNumber":"ID123456"}'
   ```

2. User login:
   ```bash
   curl -X POST http://localhost:4000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"john@example.com","password":"Password123!"}'
   ```

3. Get user profile (replace <token> with actual JWT token):
   ```bash
   curl http://localhost:4000/api/user/profile \
     -H "Authorization: Bearer <token>"
   ```

## Conclusion

The integrated application should now be fully functional with all backend routes properly connected to the frontend components. Users can register, login, submit transactions, and view their dashboard. Admins can approve users and transactions through the admin dashboard.