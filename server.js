const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();

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

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.use('/api/prs', require('./routes/prRoutes'));
app.use('/api/activities', require('./routes/activityRoutes'));

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

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {},
  });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`\nCongrats, Server running on port ${PORT}`);
  console.log(`API URL: http://localhost:${PORT}`);
  console.log(`The Endpoints are:`);
  console.log(`   - PRs: http://localhost:${PORT}/api/prs`);
  console.log(`   - Activities: http://localhost:${PORT}/api/activities`);
  console.log(`\n✨ Ready to handle requests!\n`);
  
  connectDB();
});