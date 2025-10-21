// models/Subject.js
const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  // Basic Information
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, uppercase: true, unique: true },
  shortCode: { type: String, uppercase: true }, // e.g., "MTH" for Mathematics
  
  // Classification
  category: {
    type: String,
    enum: ['Core', 'Elective', 'Optional', 'Practical'],
    required: true
  },
  group: String, // For elective groups e.g., "Sciences", "Humanities"
  
  // Curriculum Information
  curriculum: {
    type: String,
    enum: ['8-4-4', 'CBC', 'Both'],
    required: true,
    default: 'Both'
  },
  learningArea: String, // For CBC subjects
  
  // Academic Details
  level: {
    type: String,
    enum: ['Primary', 'Junior Secondary', 'Senior Secondary', 'All'],
    required: true
  },
  creditUnits: { type: Number, default: 1 },
  periodsPerWeek: { type: Number, default: 5 },
  
  // Assessment
  assessmentType: {
    type: String,
    enum: ['Theory', 'Practical', 'Both'],
    default: 'Theory'
  },
  practicalWeight: { type: Number, default: 0 }, // Percentage for practicals
  
  // School Context
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  
  // Description
  description: String,
  objectives: [String],
  
  // Status
  isActive: { type: Boolean, default: true },
  
  // Metadata
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

subjectSchema.index({ code: 1 }, { unique: true });
subjectSchema.index({ category: 1, level: 1, school: 1 });
subjectSchema.index({ curriculum: 1, school: 1 });

// Virtual for teachers currently teaching this subject
subjectSchema.virtual('currentTeachers', {
  ref: 'ClassSubject',
  localField: '_id',
  foreignField: 'subject',
  match: { 
    academicYear: function() { 
      // Get current academic year from school
      return this.school?.academicStructure?.currentAcademicYear 
    },
    status: 'active'
  }
});

module.exports = mongoose.model('Subject', subjectSchema);