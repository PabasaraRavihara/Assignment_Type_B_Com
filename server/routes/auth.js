const express = require('express');
const router = express.Router();
const { signToken, verifyPassword, hashPassword } = require('../utils/jwt');
const { getAdmin, updateAdmin, resetToDefaultPassword, DEFAULT_PASSWORD } = require('../data/adminStore');
const { requireAdminAuth } = require('../middleware/auth');

/**
 * POST /api/auth/login
 * Authenticate admin with username/email and password, issue JWT
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username (or Email) and Password are required.' });
    }

    const admin = getAdmin();
    if (!admin) {
      return res.status(500).json({ error: 'Admin account system not initialized.' });
    }

    const trimmedUser = username.trim().toLowerCase();
    const isUserMatch = (
      trimmedUser === admin.username.toLowerCase() ||
      trimmedUser === admin.email.toLowerCase()
    );

    if (!isUserMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const isPasswordValid = verifyPassword(password, admin.salt, admin.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // 24-hour token expiry (86400 seconds)
    const token = signToken({
      id: admin.id,
      username: admin.username,
      email: admin.email,
      name: admin.name,
      role: admin.role
    }, 86400);

    // Update last login
    await updateAdmin({ lastLogin: new Date().toISOString() });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        lastLogin: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
});

/**
 * GET /api/auth/me
 * Validate existing JWT and return current admin profile
 */
router.get('/me', requireAdminAuth, (req, res) => {
  const admin = getAdmin();
  if (!admin) {
    return res.status(404).json({ error: 'Admin account not found.' });
  }

  res.status(200).json({
    id: admin.id,
    username: admin.username,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    lastLogin: admin.lastLogin
  });
});

/**
 * POST /api/auth/change-password
 * Change admin password (requires active session token)
 */
router.post('/change-password', requireAdminAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const admin = getAdmin();
    const isCurrentValid = verifyPassword(currentPassword, admin.salt, admin.passwordHash);

    if (!isCurrentValid) {
      return res.status(401).json({ error: 'Incorrect current password.' });
    }

    const { salt, hash } = hashPassword(newPassword);
    await updateAdmin({ salt, passwordHash: hash });

    res.status(200).json({
      success: true,
      message: 'Admin password changed successfully. Please keep it safe!'
    });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to update password.' });
  }
});

/**
 * POST /api/auth/reset-default
 * Emergency endpoint to reset admin password to factory default
 */
router.post('/reset-default', async (req, res) => {
  try {
    await resetToDefaultPassword();
    res.status(200).json({
      success: true,
      message: 'Password reset to factory default (ashadi@admin2026).'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

module.exports = router;
