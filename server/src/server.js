const path = require('path');
// Load environment variables from project root
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Attach io instance to express app
app.set('socketio', io);

// Socket.IO real-time crisis room events
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  socket.on('join:channel', (channel) => {
    socket.join(channel);
    logger.info(`Socket ${socket.id} joined channel: ${channel}`);
  });

  socket.on('leave:channel', (channel) => {
    socket.leave(channel);
    logger.info(`Socket ${socket.id} left channel: ${channel}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Start listening
server.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
