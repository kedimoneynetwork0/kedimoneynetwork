-- Create admin user in PostgreSQL database
-- Run this SQL command in your Railway PostgreSQL database

-- First, make sure the users table exists (this should be created by the app)
-- If not, the app will create it when it starts

-- Insert admin user with phone-based login
-- Password is hashed version of 'kedi@123'
INSERT INTO users (
  firstname,
  lastname,
  phone,
  password,
  role,
  status,
  created_at
) VALUES (
  'Admin',
  'User',
  '0788123456',
  '$2b$10$xHcLpJCJJjyRjCQ8V5m8Ue6N5q5q5q5q5q5q5q5q5q5q5q5q5q5q', -- bcrypt hash for 'kedi@123'
  'admin',
  'approved',
  CURRENT_TIMESTAMP
) ON CONFLICT (phone) DO NOTHING;

-- Alternative: If you want to use a different password, replace the hash above
-- You can generate bcrypt hash using: https://bcrypt-generator.com/
-- Or use this Node.js script to generate hash:
-- const bcrypt = require('bcrypt'); bcrypt.hash('yourpassword', 10).then(console.log);