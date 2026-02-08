# 🚀 Quick Setup Guide - Day 2

This guide will help you set up and test the Day 2 implementation (Database & Authentication).

---

## Prerequisites

- Node.js 20.x or higher
- PostgreSQL 14+ with PostGIS extension
- Firebase account (free tier)
- Git

---

## Step 1: Database Setup

### Install PostgreSQL with PostGIS

**Windows:**
```bash
# Download from https://www.postgresql.org/download/windows/
# During installation, include PostGIS extension via Stack Builder
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib postgis
```

**macOS:**
```bash
brew install postgresql postgis
```

### Create Database

```bash
# Start PostgreSQL service (if not running)
# Windows: Services → PostgreSQL
# Linux: sudo systemctl start postgresql
# macOS: brew services start postgresql

# Create database
psql -U postgres -c "CREATE DATABASE civic_sense_db;"

# Verify PostGIS is available
psql -U postgres -d civic_sense_db -c "CREATE EXTENSION postgis;"
```

---

## Step 2: Firebase Setup

### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name: `civic-sense-portal`
4. Disable Google Analytics (optional)
5. Create project

### Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click "Get Started"
3. Enable **Email/Password** provider
4. Enable **Google** provider
   - Add your email as test user
   - Configure OAuth consent screen

### Get Client Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll to "Your apps"
3. Click **Web** icon (`</>`)
4. Register app: `Civic Sense Portal Web`
5. Copy the configuration values:

```javascript
{
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
}
```

### Get Server Configuration (Service Account)

1. In **Project Settings**, go to **Service Accounts** tab
2. Click "Generate New Private Key"
3. Save the JSON file as `firebase-service-account.json`
4. Place it in `server/config/` directory (or keep it secure elsewhere)

---

## Step 3: Environment Configuration

### Backend (.env)

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```env
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/civic_sense_db

# JWT Secret (generate a random string)
JWT_SECRET=your_random_secret_key_here

# Firebase Admin SDK
FIREBASE_PROJECT_ID=civic-sense-portal
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
# OR use JSON string for production:
# FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# For development without Firebase
SKIP_FIREBASE_AUTH=false

# Cloudinary (optional for now)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# AI Service (coming in Day 4)
AI_SERVICE_URL=http://localhost:8000
```

### Frontend (.env)

```bash
cd client
cp .env.example .env
```

Edit `client/.env`:

```env
# Backend API
VITE_API_URL=http://localhost:5000/api

# Firebase Configuration (from step 2)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

# Optional
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

## Step 4: Install Dependencies

### Backend

```bash
cd server
npm install
```

### Frontend

```bash
cd client
npm install
```

---

## Step 5: Run Database Migrations

```bash
cd server
npm run migrate
```

**Expected Output:**
```
🚀 Starting database migrations...

📄 Running migration: 001_initial_schema.sql
✅ Successfully executed 001_initial_schema.sql

🎉 All migrations completed successfully!

📊 Database tables:
   - departments
   - users
   - issues
   - issue_updates
   - routing_rules
   - notifications
   - schema_migrations

🏛️  Departments created: 5
```

---

## Step 6: Start the Application

### Terminal 1 - Backend Server

```bash
cd server
npm run dev
```

**Expected Output:**
```
✅ Connected to PostgreSQL database
✅ Firebase Admin SDK initialized
🚀 Server running on port 5000
📍 API available at http://localhost:5000/api
```

### Terminal 2 - Frontend Development Server

```bash
cd client
npm run dev
```

**Expected Output:**
```
  VITE v6.0.5  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## Step 7: Test the Application

### 1. Open the Application

Navigate to: http://localhost:5173

### 2. Test Registration

1. Click "Sign Up" or "Get Started"
2. Fill in the registration form:
   - Name: Test User
   - Email: test@example.com
   - Phone: +91 98765 43210 (optional)
   - Password: testpass123
   - Confirm Password: testpass123
3. Click "Sign Up"
4. You should be redirected to the dashboard

### 3. Test Login

1. Sign out from dashboard
2. Go to Login page
3. Enter credentials:
   - Email: test@example.com
   - Password: testpass123
4. Click "Sign In"
5. You should be logged in and see dashboard

### 4. Test Google Sign-In

1. Sign out if logged in
2. Click "Sign in with Google"
3. Select your Google account
4. Authorize the app
5. You should be logged in

### 5. Test Protected Routes

1. Log out
2. Try to access: http://localhost:5173/dashboard
3. You should be redirected to login page
4. After login, you should be redirected back to dashboard

### 6. Test API Endpoints

**Health Check:**
```bash
curl http://localhost:5000/api/health
```

**Get Profile (requires authentication):**
```bash
# First, get the Firebase token from browser console:
# In browser console: await firebase.auth().currentUser.getIdToken()

curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

---

## Step 8: Verify Database

```bash
psql -U postgres -d civic_sense_db

# List all tables
\dt

# View departments
SELECT * FROM departments;

# View users (after registration)
SELECT id, name, email, role, civic_points FROM users;

# View routing rules
SELECT * FROM routing_rules;

# Exit
\q
```

---

## Troubleshooting

### Issue: "Cannot connect to database"

**Solution:**
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure database exists: `psql -U postgres -l`

### Issue: "Firebase Admin not initialized"

**Solution:**
- Verify firebase-service-account.json exists
- Check FIREBASE_SERVICE_ACCOUNT_PATH in .env
- Or set SKIP_FIREBASE_AUTH=true for development

### Issue: "Firebase client error"

**Solution:**
- Verify all VITE_FIREBASE_* variables in client/.env
- Check Firebase project settings
- Ensure authentication providers are enabled

### Issue: "CORS error"

**Solution:**
- Verify backend is running on port 5000
- Check VITE_API_URL in client/.env
- Ensure cors is configured in app.js

### Issue: "Token verification failed"

**Solution:**
- Check Firebase service account configuration
- Verify token is being sent in Authorization header
- Check if user exists in database

---

## Development Tips

### Hot Reload

Both frontend and backend support hot reload:
- Frontend: Changes auto-refresh
- Backend: nodemon restarts on file changes

### Database Reset

To reset the database:

```bash
psql -U postgres -d civic_sense_db

DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS routing_rules CASCADE;
DROP TABLE IF EXISTS issue_updates CASCADE;
DROP TABLE IF EXISTS issues CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS schema_migrations CASCADE;
DROP EXTENSION IF EXISTS postgis CASCADE;

\q

# Then run migrations again
cd server
npm run migrate
```

### Check Logs

**Backend logs:** Check terminal running `npm run dev`

**Frontend logs:** Check browser console (F12)

**Database logs:** Check PostgreSQL logs

### Test User Creation

You can create a test user directly in the database:

```sql
INSERT INTO users (firebase_uid, email, name, role)
VALUES ('dev-user-id', 'dev@test.com', 'Dev User', 'CITIZEN');
```

---

## Next Steps

After successful setup and testing:

1. ✅ Verify all tests pass
2. ✅ Check database has sample departments
3. ✅ Confirm authentication works
4. ✅ Test protected routes
5. ➡️ Ready for Day 3 (Dataset Preparation)

---

## Useful Commands

```bash
# Backend
npm run dev          # Start development server
npm start            # Start production server
npm run migrate      # Run database migrations

# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Database
psql -U postgres -d civic_sense_db    # Connect to database
\dt                                     # List tables
\d+ table_name                         # Describe table
\q                                      # Exit psql
```

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review logs in terminal and browser console
3. Verify environment variables are correct
4. Ensure all dependencies are installed
5. Check Firebase and PostgreSQL are running

---

**Setup complete! You're ready to start developing! 🎉**
