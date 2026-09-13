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

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
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
  res.json({ message: 'Cash Ledger API is running' });
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