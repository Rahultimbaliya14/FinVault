const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');

const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN_DAYS = 30;

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, tenantId: user.tenantId || user._id },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );
};

const generateRefreshToken = async (user) => {
  const token = crypto.randomBytes(48).toString('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);

  await RefreshToken.create({ userId: user._id, token, expiresAt });
  return token;
};

const ADMIN_CONTACT_MESSAGE =
  'Your account is not active yet. Please contact Rahul Timbaliya (rahultimbaliya555@gmail.com) for approval.';

// POST /api/v1/auth/register
exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      email,
      passwordHash,
      role: 'user',
   
    });

    // A user acts as the root of their own tenant by default
    user.tenantId = user._id;
    await user.save();

    res.status(201).json({
      message: 'Registration successful. Your account is pending admin approval before you can log in.',
      pendingApproval: true,
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

// POST /api/v1/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: ADMIN_CONTACT_MESSAGE });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    res.status(200).json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: { id: user._id, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'refreshToken is required' });
    }

    const storedToken = await RefreshToken.findOne({ token: refreshToken });
    if (!storedToken) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    if (storedToken.expiresAt < new Date()) {
      await RefreshToken.findByIdAndDelete(storedToken._id);
      return res.status(401).json({ message: 'Refresh token has expired, please log in again' });
    }

    const user = await User.findById(storedToken.userId);
    if (!user || !user.isActive) {
      await RefreshToken.findByIdAndDelete(storedToken._id);
      return res.status(401).json({ message: 'Account no longer active' });
    }

    // Rotate: delete the old token, issue a new access + refresh pair
    await RefreshToken.findByIdAndDelete(storedToken._id);
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = await generateRefreshToken(user);

    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to refresh token', error: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await RefreshToken.deleteOne({ token: refreshToken });
    }
    res.status(200).json({ message: 'Logged out' });
  } catch (error) {
    res.status(500).json({ message: 'Logout failed', error: error.message });
  }
};