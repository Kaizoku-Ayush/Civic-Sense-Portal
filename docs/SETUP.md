# Setup Guide

## Prerequisites

- Node.js 20.x or higher
- Python 3.10+ (for AI service)
- npm or yarn
- A [MongoDB Atlas](https://cloud.mongodb.com/) free account
- A [Firebase](https://console.firebase.google.com/) project with Authentication enabled

## Step-by-Step Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Kaizoku-Ayush/Civic-Sense-Portal.git
cd Civic-Sense-Portal
```

### 2. Frontend Setup
```bash
cd client
npm install
copy .env.example .env   # Windows
# cp .env.example .env   # macOS/Linux
# Edit .env with your Firebase config and API URL
npm run dev
```

The frontend will be available at http://localhost:3000

### 3. Backend Setup
```bash
cd server
npm install
copy .env.example .env   # Windows
# cp .env.example .env   # macOS/Linux
# Edit .env with your MongoDB URI and Firebase credentials
npm run dev
```

The backend will be available at http://localhost:5000

### 4. Database Setup (MongoDB Atlas)
1. Create a free M0 cluster at https://cloud.mongodb.com/
2. Create a database user and whitelist your IP
3. Copy the connection string into `server/.env` as `MONGODB_URI`
4. The app auto-creates collections and indexes on first run

### 5. Firebase Setup
1. Go to https://console.firebase.google.com/
2. Create a new project
3. Enable **Email/Password** and **Google** sign-in providers
4. Copy the Web App config into `client/.env`
5. Go to **Project Settings > Service Accounts** > Generate new private key
6. Save the JSON file as `server/firebase-service-account.json` (already gitignored)

### 6. AI Service Setup (Week 1, Days 4-6)
```bash
cd ai-service
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the service
uvicorn main:app --reload --port 8000
```

## Environment Variables Reference

See `client/.env.example` and `server/.env.example` for the full list
of required variables with descriptions.

## Troubleshooting

### Port Already in Use
If you get a "port already in use" error:
- Kill the process: `npx kill-port 3000` or `npx kill-port 5000`
- Or change `PORT` in the respective `.env` file

### MongoDB Connection Issues
- Ensure your IP is whitelisted in MongoDB Atlas Network Access
- Verify the `MONGODB_URI` connection string in `server/.env`

### Firebase Auth Not Working
- Make sure Email/Password provider is enabled in Firebase Console
- Double-check `VITE_FIREBASE_*` values in `client/.env`
- For the backend, ensure `firebase-service-account.json` is in `server/`

### Module Not Found
Run `npm install` in the relevant directory (`client/` or `server/`)

## Next Steps

See [ROADMAP.md](../ROADMAP.md) for the full 4-week development plan.
