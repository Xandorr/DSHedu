const Enrollment = require('../models/Enrollment');
const Program = require('../models/Program');
const nodemailer = require('nodemailer');

// Get user enrollments
exports.getUserEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user.id })
      .populate('program', 'title category startDate endDate location')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: enrollments.length,
      data: enrollments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get single enrollment
exports.getEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('program')
      .populate('user', 'name email phone');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check if user is authorized to access this enrollment
    if (enrollment.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this enrollment'
      });
    }

    res.status(200).json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Create enrollment
exports.createEnrollment = async (req, res) => {
  try {
    const { programId, student, emergencyContact } = req.body;

    // Check if program exists
    const program = await Program.findById(programId);
    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Program not found'
      });
    }

    // Check if program is full
    if (program.enrolled >= program.capacity) {
      return res.status(400).json({
        success: false,
        message: 'Program is full'
      });
    }

    // Create enrollment
    const enrollment = new Enrollment({
      user: req.user.id,
      program: programId,
      student,
      emergencyContact
    });

    await enrollment.save();

    // Update program enrolled count
    await Program.findByIdAndUpdate(programId, {
      $inc: { enrolled: 1 }
    });

    // Send confirmation email
    sendEnrollmentConfirmation(req.user.email, enrollment, program);

    res.status(201).json({
      success: true,
      message: 'Enrollment created successfully',
      data: enrollment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update enrollment status
exports.updateEnrollmentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Only admin can update enrollment status
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Enrollment status updated successfully',
      data: enrollment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, paymentDetails } = req.body;

    // Only admin can update payment status
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      { paymentStatus, paymentDetails },
      { new: true, runValidators: true }
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: enrollment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Cancel enrollment
exports.cancelEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check if user is authorized to cancel this enrollment
    if (enrollment.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this enrollment'
      });
    }

    // Update enrollment status to cancelled
    enrollment.status = 'cancelled';
    await enrollment.save();

    // Decrement program enrolled count
    await Program.findByIdAndUpdate(enrollment.program, {
      $inc: { enrolled: -1 }
    });

    res.status(200).json({
      success: true,
      message: 'Enrollment cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Helper function to send confirmation email
const sendEnrollmentConfirmation = async (email, enrollment, program) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Enrollment Confirmation - ${program.title}`,
      html: `
        <h1>Enrollment Confirmation</h1>
        <p>Thank you for enrolling in our program!</p>
        <h2>Program Details:</h2>
        <p><strong>Program:</strong> ${program.title}</p>
        <p><strong>Category:</strong> ${program.category}</p>
        <p><strong>Dates:</strong> ${new Date(program.startDate).toLocaleDateString()} - ${new Date(program.endDate).toLocaleDateString()}</p>
        <p><strong>Location:</strong> ${program.location.name}, ${program.location.city}, ${program.location.state}</p>
        <h2>Enrollment Status:</h2>
        <p>Your enrollment is currently <strong>${enrollment.status}</strong>.</p>
        <p>Payment Status: <strong>${enrollment.paymentStatus}</strong></p>
        <p>Please keep this email for your records. You can also view your enrollments on your dashboard.</p>
        <p>If you have any questions, please contact us.</p>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Email sending failed:', error);
  }
}; 