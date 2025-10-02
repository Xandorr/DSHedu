const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const { requireAuthJson } = require('../middlewares/auth');

// Get user enrollments (protected)
router.get('/my-enrollments', requireAuthJson, enrollmentController.getUserEnrollments);

// Get single enrollment (protected)
router.get('/:id', requireAuthJson, enrollmentController.getEnrollment);

// Create enrollment (protected)
router.post('/', requireAuthJson, enrollmentController.createEnrollment);

// Cancel enrollment (protected)
router.put('/:id/cancel', requireAuthJson, enrollmentController.cancelEnrollment);

// Update enrollment status (admin only) - temporarily disabled
// router.put('/:id/status', requireAuthJson, enrollmentController.updateEnrollmentStatus);

// Update payment status (admin only) - temporarily disabled  
// router.put('/:id/payment', requireAuthJson, enrollmentController.updatePaymentStatus);

module.exports = router; 