import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server as SocketIO } from 'socket.io';
import connectDB from './config/db.js';
import routes from './routes/index.js';

dotenv.config();

// Warn early if the Groq API key is missing — chat responses will be basic template answers without it.
if (!process.env.GROQ_API_KEY) {
  console.warn('⚠️  WARNING: GROQ_API_KEY is not set. Chat assistant will return basic template answers instead of AI-polished responses.');
}

// Connect to MongoDB
connectDB();

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 5000;

// CORS config — FRONTEND_URL may be a comma-separated list of origins
const prodOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((u) => u.trim()).filter(Boolean)
  : [];
const allowedOrigins = [...new Set([...prodOrigins, 'http://localhost:3000', 'http://localhost:5173'])];

app.use(cors({ origin: allowedOrigins, credentials: true }));

// Socket.io — attached to the same HTTP server
export const io = new SocketIO(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Department staff join their department room for live queue updates
  socket.on('join-department', (deptId) => {
    if (deptId) {
      socket.join(`dept:${deptId}`);
      console.log(`Socket ${socket.id} joined dept:${deptId}`);
    }
  });

  socket.on('leave-department', (deptId) => {
    if (deptId) socket.leave(`dept:${deptId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root — redirect browsers to /api so visiting the naked URL isn't confusing
app.get('/', (_req, res) => res.redirect('/api'));

// Basic health check route
app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Civic Sense Portal API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.get('/api', (_req, res) => {
  res.json({ 
    message: 'Welcome to Civic Sense Portal API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      issues: '/api/issues',
      admin: '/api/admin',
      analytics: '/api/analytics',
      chat: '/api/chat',
    }
  });
});

// Mount all routes under /api
app.use('/api', routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API available at http://localhost:${PORT}/api`);
});

export default app;
