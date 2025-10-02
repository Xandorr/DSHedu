const mongoose = require('mongoose');

const ProgramSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['summer', 'winter', 'spring', 'special'],
    required: true
  },
  location: {
    name: String,
    address: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'USA'
    }
  },
  ageRange: {
    min: Number,
    max: Number
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  originalPrice: {
    type: Number,
    required: true
  },
  discountPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  discountedPrice: {
    type: Number
  },
  price: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  capacity: {
    type: Number,
    required: true
  },
  enrolled: {
    type: Number,
    default: 0
  },
  instructors: [{
    name: String,
    bio: String,
    photo: String
  }],
  activities: [String],
  features: [String],
  photos: [String],
  featured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Program', ProgramSchema); 