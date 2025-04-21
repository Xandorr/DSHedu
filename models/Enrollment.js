const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  program: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
    required: true
  },
  student: {
    name: {
      type: String,
      required: true
    },
    age: {
      type: Number,
      required: true
    },
    gender: String,
    gradeLevel: String,
    specialNeeds: String,
    allergies: String,
    medicalInfo: String
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
    email: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'bank_transfer', 'paypal', 'other'],
    default: 'credit_card'
  },
  paymentDetails: {
    transactionId: String,
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    date: Date
  },
  notes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Enrollment', EnrollmentSchema); 