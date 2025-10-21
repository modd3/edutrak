// models/StudentClass.js
const mongoose = require('mongoose');

const studentClassSchema = new mongoose.Schema({
  // Core References
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student', 
    required: true 
  },
  class: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Class', 
    required: true 
  },
  
  // Academic Context
  academicYear: { type: String, required: true },
  termNumber: { type: Number, required: true, min: 1, max: 3 },
  
  // Enrollment Information
  enrollmentDate: { type: Date, default: Date.now },
  rollNumber: { type: Number, required: true },
  
  // Status
  status: {
    type: String,
    enum: ['Active', 'Transferred', 'Repeated', 'Dropped', 'Graduated'],
    default: 'Active'
  },
  promotionStatus: {
    type: String,
    enum: ['Promoted', 'Repeated', 'Pending', 'New'],
    default: 'New'
  },
  
  // Class Role
  isClassRepresentative: { type: Boolean, default: false },
  leadershipRole: String, // e.g., "Sports Captain", "Library Prefect"
  
  // Academic Performance Tracking
  performance: {
    averageScore: Number,
    classPosition: Number,
    streamPosition: Number,
    attendancePercentage: Number,
    lastUpdated: Date
  },
  
  // Subjects (for senior secondary with electives)
  selectedSubjects: [{
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    selectionType: {
      type: String,
      enum: ['Core', 'Elective', 'Optional']
    },
    selectionDate: { type: Date, default: Date.now }
  }],
  
  // Metadata
  remarks: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

studentClassSchema.index({ student: 1, academicYear: 1 }, { unique: true });
studentClassSchema.index({ class: 1, academicYear: 1 });
studentClassSchema.index({ rollNumber: 1, class: 1, academicYear: 1 }, { unique: true });

// Virtual for current term results
studentClassSchema.virtual('currentResults', {
  ref: 'Result',
  localField: ['student', 'academicYear', 'termNumber'],
  foreignField: ['student', 'academicYear', 'termNumber'],
  justOne: false
});

// Update performance metrics
studentClassSchema.methods.updatePerformance = async function() {
  const Result = mongoose.model('Result');
  const Attendance = mongoose.model('Attendance');
  
  // Calculate average score
  const results = await Result.find({
    student: this.student,
    academicYear: this.academicYear,
    termNumber: this.termNumber,
    isPublished: true
  });
  
  if (results.length > 0) {
    const totalPercentage = results.reduce((sum, result) => sum + (result.overallPercentage || 0), 0);
    this.performance.averageScore = totalPercentage / results.length;
  }
  
  // Calculate attendance
  const attendance = await Attendance.findOne({
    student: this.student,
    academicYear: this.academicYear,
    termNumber: this.termNumber
  });
  
  if (attendance && attendance.summary) {
    this.performance.attendancePercentage = attendance.summary.attendancePercentage;
  }
  
  this.performance.lastUpdated = new Date();
  await this.save();
};

module.exports = mongoose.model('StudentClass', studentClassSchema);