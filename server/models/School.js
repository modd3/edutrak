// models/School.js
const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  // Basic Information
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  motto: String,
  logo: String,
  
  // Contact Information
  contact: {
    phone: { type: String, required: true },
    email: { type: String, required: true },
    website: String,
    address: {
      county: { type: String, required: true },
      subCounty: { type: String, required: true },
      ward: String,
      town: String,
      postalCode: String,
      postalAddress: String
    }
  },
  
  // Administration
  principal: {
    name: String,
    phone: String,
    email: String
  },
  deputyPrincipal: {
    name: String,
    phone: String,
    email: String
  },
  
  // School Classification
  type: {
    type: String,
    enum: ['Public', 'Private', 'International'],
    required: true
  },
  level: {
    type: String,
    enum: ['Primary', 'Secondary', 'Composite', 'TVET'],
    required: true
  },
  curriculum: [{
    type: String,
    enum: ['8-4-4', 'CBC', 'IGCSE', 'IB'],
    required: true
  }],
  
  // Academic Structure
  academicStructure: {
    termsPerYear: { type: Number, default: 3 },
    currentAcademicYear: { type: String, required: true },
    gradingSystem: { type: String, default: '8-4-4' }
  },
  
  // School Sessions
  sessions: {
    morning: { start: String, end: String }, // "08:00", "13:00"
    afternoon: { start: String, end: String } // "14:00", "17:00"
  },
  
  // Settings
  settings: {
    autoPromotion: { type: Boolean, default: true },
    requireParentApproval: { type: Boolean, default: false },
    allowSubjectChanges: { type: Boolean, default: true },
    maxAbsencePercentage: { type: Number, default: 25 },
    feeSettings: {
      currency: { type: String, default: 'KES' },
      paymentMethods: [{ type: String, enum: ['MPESA', 'Bank', 'Cash'] }]
    }
  },
  
  // Status
  isActive: { type: Boolean, default: true },
  registrationDate: { type: Date, default: Date.now },
  
  // Metadata
  established: Number, // Year
  enrollment: {
    totalStudents: { type: Number, default: 0 },
    totalTeachers: { type: Number, default: 0 },
    capacity: { type: Number, default: 500 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

schoolSchema.index({ code: 1 }, { unique: true });
schoolSchema.index({ 'contact.county': 1, 'contact.subCounty': 1 });

// Virtuals
schoolSchema.virtual('currentTerm').get(async function() {
  const AcademicCalendar = mongoose.model('AcademicCalendar');
  const calendar = await AcademicCalendar.findOne({
    school: this._id,
    academicYear: this.academicStructure.currentAcademicYear,
    'terms.status': 'active'
  });
  return calendar ? calendar.terms.find(term => term.status === 'active') : null;
});

module.exports = mongoose.model('School', schoolSchema);