require('dotenv').config();

const express = require('express');
const cors = require('cors');

// Import modularized components
const authRoutes = require('./src/routes/auth');
const syncRoutes = require('./src/routes/sync');
const { errorHandler } = require('./src/middleware/errorHandler');

// Environment variables validation
const port = process.env.PORT;

const app = express();

// CORS configuration for mobile app
app.use(cors({
  origin: true, // Allow all origins during development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

app.get('/', (req, res) => {
  res.send("Let's rock!");
});

// Use modularized routes
app.use('/auth', authRoutes);
app.use('/api/sync', syncRoutes);

// Error handling middleware (should be last)
app.use(errorHandler);

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});