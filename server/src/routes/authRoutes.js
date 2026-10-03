import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../db/store.js';

const router = express.Router();
export const JWT_SECRET = process.env.JWT_SECRET || 'cityfix-super-secret-jwt-key-expo-2026';

// Middleware to authenticate JWT tokens
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please sign in.' });
  }

  jwt.verify(token, JWT_SECRET, (err, userPayload) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    const fullUser = db.findUserById(userPayload.id);
    if (!fullUser) {
      return res.status(404).json({ error: 'User no longer exists.' });
    }
    req.user = fullUser;
    next();
  });
}

// Middleware to enforce Admin role
export function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Admin privileges required for this action.' });
  }
}

// Sign JWT Token helper
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { phone, email, identifier, password } = req.body;
  const userIdentifier = phone || identifier || email;

  if (!userIdentifier || !password) {
    return res.status(400).json({ error: 'Phone number (or email) and password are required.' });
  }

  const user = db.findUserByIdentifier(userIdentifier);
  if (!user) {
    return res.status(401).json({ error: 'Account not found with this mobile number/email.' });
  }

  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ error: 'Incorrect password. Please try again.' });
  }

  const token = generateToken(user);
  const { password: _, ...userWithoutPassword } = user;

  res.json({
    token,
    user: userWithoutPassword,
    message: `Welcome back, ${user.name}!`
  });
});

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, phone, email, password, ward } = req.body;
  const primaryContact = (phone || email || '').trim();

  if (!name || !primaryContact || !password) {
    return res.status(400).json({ error: 'Name, phone number, and password are required.' });
  }

  if (db.findUserByIdentifier(primaryContact)) {
    return res.status(409).json({ error: 'An account with this phone number already exists.' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = db.createUser({
    name,
    phone: phone || primaryContact,
    email: email || `${primaryContact.replace(/[^0-9a-zA-Z]/g, '')}@cityfix.org`,
    password: hashedPassword,
    ward: ward || 'General Ward',
    role: 'citizen'
  });

  const token = generateToken(newUser);
  const { password: _, ...userWithoutPassword } = newUser;

  res.status(201).json({
    token,
    user: userWithoutPassword,
    message: 'Citizen account registered successfully!'
  });
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  const { password: _, ...userWithoutPassword } = req.user;
  const userNotifs = db.getNotifications(req.user.id);
  const unreadCount = userNotifs.filter(n => !n.read).length;

  res.json({
    user: userWithoutPassword,
    unreadNotificationsCount: unreadCount
  });
});

// PUT /api/auth/profile
router.put('/profile', authenticateToken, (req, res) => {
  const { name, email, phone, avatar, badge, ward } = req.body;

  const updatedUser = db.updateUser(req.user.id, {
    name,
    email,
    phone,
    avatar,
    badge,
    ward
  });

  if (!updatedUser) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const { password: _, ...userWithoutPassword } = updatedUser;

  res.json({
    user: userWithoutPassword,
    message: 'Profile updated successfully!'
  });
});

export default router;
