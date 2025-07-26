// backend/server.js
import 'dotenv/config'; // Load environment variables from .env file
import express from 'express';
import http from 'http';
import { Server as SocketIoServer } from 'socket.io'; // Rename to avoid conflict with express.Server
import mongoose from 'mongoose';
import cors from 'cors';

// Import routes
import studentRoutes from './routes/studentRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import tvSettingsRoutes from './routes/tvSettingsRoutes.js';
import exportStudentsRoute from "./routes/studentImportExportRoutes.js"
const app = express();
const server = http.createServer(app); // Create HTTP server for Express and Socket.IO

// Initialize Socket.IO server
const io = new SocketIoServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // Allow your frontend origin
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Store io instance on app locals so it can be accessed in controllers
app.set('socketio', io);

// MongoDB Connection
// admin-dashboard';
//const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/auction'
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://assessmenthisan:tOgbBkQfqjTCGfsv@cluster0.5ytn9tw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined in environment variables.");
  process.exit(1); // Exit if no DB URI
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully!'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit process on DB connection failure
  });

// Middleware
app.use(cors({
  origin: "http://localhost:5173", // ✅ Your frontend's origin
  credentials: true
}))
app.use(express.json()); // Parse JSON request bodies

// API Routes
app.use('/api/students', studentRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/tv-settings', tvSettingsRoutes);
app.use('/api', exportStudentsRoute);
// Basic route for health check
app.get('/', (req, res) => {
  res.send('Student Auction Backend API is running!');
});

// Socket.IO Connection Handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });


});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});