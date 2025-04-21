const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const { protect, adminOnly } = require('../middlewares/auth');

// Get user enrollments (protected)
router.get('/my-enrollments', protect, enrollmentController.getUserEnrollments);

// Get single enrollment (protected)
router.get('/:id', protect, enrollmentController.getEnrollment);

// Create enrollment (protected)
router.post('/', protect, enrollmentController.createEnrollment);

// Cancel enrollment (protected)
router.put('/:id/cancel', protect, enrollmentController.cancelEnrollment);

// Update enrollment status (admin only)
router.put('/:id/status', protect, adminOnly, enrollmentController.updateEnrollmentStatus);

// Update payment status (admin only)
router.put('/:id/payment', protect, adminOnly, enrollmentController.updatePaymentStatus);

module.exports = router; 