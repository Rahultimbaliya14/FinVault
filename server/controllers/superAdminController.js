const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');

const ADMIN_TOKEN_EXPIRES_IN = '12h';

const generateAdminToken = (admin) => {
  return jwt.sign({ adminId: admin._id, isAdmin: true }, process.env.JWT_SECRET, {
    expiresIn: ADMIN_TOKEN_EXPIRES_IN,
  });
};

exports.setupAdmin = async (req, res) => {
  try {
    const setupKey = req.headers['x-setup-key'];
    if (!setupKey || setupKey !== process.env.ADMIN_SETUP_SECRET) {
      return res.status(403).json({ message: 'Invalid or missing setup key' });
    }

    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const existing = await Admin.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'An admin with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const admin = await Admin.create({ email, passwordHash, name });

    res.status(201).json({
      message: 'Admin account created',
      admin: { id: admin._id, email: admin.email, name: admin.name },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create admin account', error: error.message });
  }
};

// POST /api/v1/superadmin/login
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateAdminToken(admin);

    res.status(200).json({
      message: 'Login successful',
      token,
      admin: { id: admin._id, email: admin.email, name: admin.name },
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// GET /api/v1/superadmin/dashboard
// Summary counts for the admin dashboard's top cards.
exports.getDashboardSummary = async (req, res) => {
  try {
    const [totalUsers, pendingApproval, approved] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: false }),
      User.countDocuments({ isActive: true }),
    ]);

    res.status(200).json({ totalUsers, pendingApproval, approved });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load dashboard summary', error: error.message });
  }
};

// GET /api/v1/superadmin/users
// Every registered user, newest first, so pending approvals are easy to spot.
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.status(200).json({ count: users.length, users });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

// PUT /api/v1/superadmin/users/:id/status
// Approve (isActive: true) or deactivate (isActive: false) a user account.
exports.updateUserApproval = async (req, res) => {
  try {
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true }).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: isActive ? 'User approved' : 'User deactivated', user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
};