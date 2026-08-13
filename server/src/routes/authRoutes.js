const express = require('express');
const { 
  register, 
  login, 
  refresh, 
  logout, 
  me 
} = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { registerValidator, loginValidator } = require('../validators/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.post('/register', registerValidator, validate, register);
router.post('/login', loginValidator, validate, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

module.exports = router;
