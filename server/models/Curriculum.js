// models/Curriculum.js
const mongoose = require('mongoose');

const competencySchema = new mongoose.Schema({
  code: { type: String, required: true }, // e.g., "CC1", "DL2"
  name: { type: String, required: true },
  description: String,
  category: {
    type: String,
    enum: ['Core', 'Cross-Cutting', 'Digital'],
    required: true
  },
  levels: [{
    level: { type: Number, min: 1, max: 4, required: true },
    description: String,
    indicators: [String]
  }]
});

const learningAreaSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  description: String,
  stage: { // For CBC
    type: String,
    enum: ['Lower Primary', 'Upper Primary', 'Junior School', 'Senior School']
  },
  track: { // For Senior School
    type: String,
    enum: ['STEM', 'Social Sciences', 'Arts & Sports', 'All']
  }
});

const curriculumSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    enum: ['8-4-4', 'CBC', 'IGCSE', 'IB'],
    index: true
  },
  version: { type: String, default: '1.0' },
  description: String,
  
  // School Context
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  
  // CBC Specific
  competencies: [competencySchema],
  learningAreas: [learningAreaSchema],
  
  // Assessment Structure
  assessmentStructure: {
    '8-4-4': {
      assessments: [
        { name: 'CAT 1', weight: 30, maxMarks: 30 },
        { name: 'CAT 2', weight: 30, maxMarks: 30 },
        { name: 'End Term', weight: 40, maxMarks: 40 }
      ],
      gradingScale: { type: mongoose.Schema.Types.ObjectId, ref: 'GradingScale' }
    },
    'CBC': {
      assessments: [
        { name: 'Formative', weight: 40, type: 'continuous' },
        { name: 'Summative', weight: 60, type: 'project' }
      ],
      competencyBased: { type: Boolean, default: true }
    }
  },
  
  // Applicability
  applicableLevels: [{
    level: {
      type: String,
      enum: ['Pre-Primary', 'Primary', 'Junior Secondary', 'Senior Secondary']
    },
    grades: [String] // ["Grade 1", "Grade 2", ...]
  }],
  
  // Status
  isActive: { type: Boolean, default: true },
  implementationDate: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

curriculumSchema.index({ name: 1, school: 1 }, { unique: true });

module.exports = mongoose.model('Curriculum', curriculumSchema);