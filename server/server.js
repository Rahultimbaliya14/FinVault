require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const bankAccountRoutes = require('./routes/bankAccount');
const transactionRoutes = require('./routes/transaction');
const creditCardRoutes = require('./routes/creditCard');
const sipRoutes = require('./routes/sip');
const emiRoutes = require('./routes/emi');
const lendBorrowRoutes = require('./routes/lendBorrow');
const duesRoutes = require('./routes/dues');
const dashboardRoutes = require('./routes/dashboard');
const adminRoutes = require('./routes/admin');

const app = express();

// Connect to MongoDB
connectDB();

app.use((req, res, next) => {

  const isDev = process.env.DEVELOPMENT === 'true';
  if (!isDev) {
    const origin = req.headers.origin;
    if (!origin) {
      return res.status(403).send('Direct browser access not allowed');
    }
  }
  
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});


const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['https://rahultimbaliya14.github.io'];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like Postman or browser direct access)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Requested-With', 'Authorization'],
};

app.use(cors(corsOptions));

app.use(express.json());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/accounts', bankAccountRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/cards', creditCardRoutes);
app.use('/api/v1/sips', sipRoutes);
app.use('/api/v1/emis', emiRoutes);
app.use('/api/v1/lend-borrow', lendBorrowRoutes);
app.use('/api/v1/dues', duesRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/admin', adminRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'FinVault API is running' });
});

// Basic error handler (fallback)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong' });
});

const PORT = process.env.PORT || 5000;

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;