import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import authRoutes from './routes/authRoutes.js';
import issueRoutes from './routes/issueRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';

// Socket.io initialization
const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});

app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Ensure uploads folder exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Socket.io events
io.on('connection', (socket) => {
  console.log(`🔌 Client connected to CityFix Live Stream: ${socket.id}`);

  // Join user room for targeted notifications
  socket.on('join:user', (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`👤 Socket ${socket.id} joined personal alert room: user_${userId}`);
    }
  });

  // Join admin channel for dispatch live stream
  socket.on('join:admin', () => {
    socket.join('admin_dispatch');
    console.log(`🛡️ Socket ${socket.id} joined municipal admin room`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'CityFix Core API & Real-time Dispatch Gateway',
    version: '2.0.0-expo'
  });
});

server.listen(PORT, () => {
  console.log(`
  ======================================================
  🚀 CityFix Civic API & Socket Gateway running!
  📡 Port: http://localhost:${PORT}
  🗄️ Database: Persistent SQLite (server/data/cityfix.db)
  🗺️ PostGIS Geo Service: Ready
  🔔 Socket.io Real-time Bus: Connected
  ======================================================
  `);
});
