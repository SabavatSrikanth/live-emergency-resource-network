const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken 
} = require('../utils/token');
const logger = require('../utils/logger');

// In-memory fallback database for development if MongoDB is disconnected
const mockUsers = [];

// Helper to extract cookies manually
const getCookie = (req, name) => {
  if (!req.headers.cookie) return null;
  const cookies = req.headers.cookie.split(';').map(c => c.trim().split('='));
  const match = cookies.find(c => c[0] === name);
  return match ? decodeURIComponent(match[1]) : null;
};

// Check if MongoDB is connected
const isConnected = () => mongoose.connection.readyState === 1;

// Register User
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const dbActive = isConnected();

    logger.debug(`Register request. Database active: ${dbActive}`);

    if (dbActive) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered.' });
      }

      const user = new User({
        name,
        email,
        password,
        role: role || 'Citizen',
      });

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      user.refreshToken = refreshToken;
      await user.save();

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(201).json({
        message: 'Registration successful',
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } else {
      // In-memory fallback
      const existingUser = mockUsers.find(u => u.email === email.toLowerCase());
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered.' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = {
        _id: `mock_${Date.now()}`,
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: role || 'Citizen',
        isActive: true,
        refreshToken: '',
      };

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      user.refreshToken = refreshToken;
      mockUsers.push(user);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(201).json({
        message: 'Registration successful (In-Memory Fallback)',
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    next(error);
  }
};

// Login User
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const dbActive = isConnected();

    logger.debug(`Login request. Database active: ${dbActive}`);

    if (dbActive) {
      let user = await User.findOne({ email });

      // Auto-create demo preset account if DB is active but unseeded
      if (!user) {
        const demoPresets = {
          'dispatcher@lern.org': { name: 'Dispatcher Dave', role: 'Dispatcher' },
          'hospital@lern.org': { name: 'Hospital Admin Sarah', role: 'Hospital Admin' },
          'volunteer@lern.org': { name: 'Volunteer Alex', role: 'Volunteer' },
          'citizen@lern.org': { name: 'Citizen Jane', role: 'Citizen' },
        };
        const lowerEmail = (email || '').toLowerCase();
        if (demoPresets[lowerEmail]) {
          const preset = demoPresets[lowerEmail];
          user = new User({
            name: preset.name,
            email: lowerEmail,
            password: password || 'password123',
            role: preset.role
          });
          await user.save();
        }
      }

      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      if (!user.isActive) {
        return res.status(403).json({ error: 'Account has been deactivated.' });
      }

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      user.refreshToken = refreshToken;
      await user.save();

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        message: 'Login successful',
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } else {
      // In-memory fallback
      const user = mockUsers.find(u => u.email === email.toLowerCase());
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const validPass = await bcrypt.compare(password, user.password);
      if (!validPass) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      if (!user.isActive) {
        return res.status(403).json({ error: 'Account has been deactivated.' });
      }

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      user.refreshToken = refreshToken;

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        message: 'Login successful (In-Memory Fallback)',
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    next(error);
  }
};

// Refresh Access Token
const refresh = async (req, res, next) => {
  try {
    const token = getCookie(req, 'refreshToken') || req.body.refreshToken;
    const dbActive = isConnected();

    if (!token) {
      return res.status(401).json({ error: 'Refresh token not found.' });
    }

    const decoded = verifyRefreshToken(token);

    if (dbActive) {
      const user = await User.findById(decoded.id);

      if (!user || user.refreshToken !== token) {
        return res.status(401).json({ error: 'Invalid refresh token.' });
      }

      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      user.refreshToken = newRefreshToken;
      await user.save();

      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } else {
      // In-memory fallback
      const user = mockUsers.find(u => u._id === decoded.id);

      if (!user || user.refreshToken !== token) {
        return res.status(401).json({ error: 'Invalid refresh token.' });
      }

      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      user.refreshToken = newRefreshToken;

      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    }
  } catch (error) {
    logger.error(`Token refresh error: ${error.message}`);
    return res.status(401).json({ error: 'Expired or invalid refresh token.' });
  }
};

// Logout User
const logout = async (req, res, next) => {
  try {
    const token = getCookie(req, 'refreshToken') || req.body.refreshToken;
    const dbActive = isConnected();

    if (token) {
      if (dbActive) {
        const user = await User.findOne({ refreshToken: token });
        if (user) {
          user.refreshToken = undefined;
          await user.save();
        }
      } else {
        const user = mockUsers.find(u => u.refreshToken === token);
        if (user) {
          user.refreshToken = '';
        }
      }
    }

    res.clearCookie('refreshToken');
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    next(error);
  }
};

// Get current user details
const me = async (req, res, next) => {
  try {
    const dbActive = isConnected();

    if (dbActive) {
      const user = await User.findById(req.user.id).select('-password -refreshToken');
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }
      return res.status(200).json({ user });
    } else {
      const user = mockUsers.find(u => u._id === req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }
      // Return a copy without sensitive fields
      const { password, refreshToken, ...publicUser } = user;
      return res.status(200).json({ user: publicUser });
    }
  } catch (error) {
    logger.error(`Get profile error: ${error.message}`);
    next(error);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  me,
};
