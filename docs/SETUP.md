# Setup Guide

## Prerequisites

- Node.js 20.x or higher
- Python 3.10 or higher
- PostgreSQL 14+ with PostGIS extension
- npm or yarn

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
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

The frontend will be available at http://localhost:3000

### 3. Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your database and API keys
npm run dev
```

The backend will be available at http://localhost:5000

### 4. Database Setup
```bash
# Access PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE civic_sense;

# Connect to database
\c civic_sense

# Enable PostGIS extension
CREATE EXTENSION postgis;
```

### 5. AI Service Setup (Optional - to be done in Week 1 Day 4-6)
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
uvicorn app.main:app --reload --port 8000
```

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your_key_here
```

### Backend (.env)
```
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/civic_sense
JWT_SECRET=your_secret_key
CLOUDINARY_URL=your_cloudinary_url
AI_SERVICE_URL=http://localhost:8000
```

## Troubleshooting

### Port Already in Use
If you get a "port already in use" error, either:
- Kill the process using that port
- Change the port in the configuration

### Database Connection Issues
- Ensure PostgreSQL is running
- Check your database credentials in .env
- Verify the database exists

### Module Not Found
Run `npm install` in the respective directory (client or server)

## Next Steps

Once setup is complete, refer to [ROADMAP.md](../ROADMAP.md) for development tasks.
