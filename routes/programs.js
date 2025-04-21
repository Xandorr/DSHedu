const express = require('express');
const router = express.Router();
const programController = require('../controllers/programController');
const { protect, adminOnly } = require('../middlewares/auth');

// Get all programs
router.get('/', programController.getAllPrograms);

// Get featured programs
router.get('/featured', programController.getFeaturedPrograms);

// Get single program
router.get('/:id', programController.getProgram);

// Create program (admin only)
router.post('/', protect, adminOnly, programController.createProgram);

// Update program (admin only)
router.put('/:id', protect, adminOnly, programController.updateProgram);

// Delete program (admin only)
router.delete('/:id', protect, adminOnly, programController.deleteProgram);

module.exports = router; 