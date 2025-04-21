const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

// User registration
router.post('/register', authController.register);

// User login
router.post('/login', authController.login);

// Get current user (protected route)
router.get('/me', protect, authController.getCurrentUser);

// Update profile (protected route)
router.put('/update-profile', protect, authController.updateProfile);

module.exports = router; 