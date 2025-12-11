const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const app = express();

// Middleware - CORS MUST come before routes
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:3002',
    'https://pr-manager-frontend.vercel.app',
    'https://*.vercel.app',
    'https://*.railway.app',
    /\.vercel\.app$/,
    /\.railway\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware - FIXED: Changed backticks to parentheses
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/prs', require('./routes/prRoutes'));
app.use('/api/activities', require('./routes/activityRoutes'));

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'PR Flow Manager API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      prs: '/api/prs',
      activities: '/api/activities',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {},
  });
});

const PORT = process.env.PORT || 5001;

// Start server FIRST, then connect to DB
app.listen(PORT, () => {
  // FIXED: Changed all backticks to parentheses with template literals inside
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📍 API URL: http://localhost:${PORT}`);
  console.log(`🔗 Endpoints:`);
  console.log(`   - PRs: http://localhost:${PORT}/api/prs`);
  console.log(`   - Activities: http://localhost:${PORT}/api/activities`);
  console.log(`\n✨ Ready to handle requests!\n`);
  
  // Connect to database after server starts
  connectDB();
});