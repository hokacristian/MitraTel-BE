const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const wilayahRoutes = require('./routes/wilayahRoutes');
const towerRoutes = require('./routes/towerRoutes');
const kebersihanSiteRoutes = require('./routes/kebersihanSiteRoutes');
const perangkatAntennaRoutes = require('./routes/perangkatAntennaRoutes');
const teganganListrikRoutes = require('./routes/teganganListrikRoutes');
const historyRoutes = require('./routes/historyRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Routes
app.use('/auth', authRoutes);
app.use('/wilayah', wilayahRoutes);
app.use('/tower', towerRoutes);
app.use('/kebersihan', kebersihanSiteRoutes);
app.use('/perangkat', perangkatAntennaRoutes);
app.use('/tegangan', teganganListrikRoutes); 
app.use('/history', historyRoutes);


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message
  });
});

module.exports = app;