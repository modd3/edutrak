// models/Class.js
const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  // Identification
  name: { type: String, required: true, trim: true }, // "Grade 5 East"
  code: { type: String, required: true, uppercase: true, trim: true },
  
  // Academic Information
  grade: { type: String, required: true }, // "Grade 5", "Form 2"
  stream: { type: String, required: true }, // "East", "West", "North"
  level: {
    type: String,
    enum: ['Pre-Primary', 'Primary', 'Junior Secondary', 'Senior Secondary'],
    required: true
  },
  
  // Curriculum
  curriculum: {
    type: String,
    enum: ['8-4-4', 'CBC'],
    required: true
  },
  track: { // For Senior Secondary CBC
    type: String,
    enum: ['STEM', 'Social Sciences', 'Arts & Sports', null],
    default: null
  },
  
  // School Context
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  academicYear: { type: String, required: true },
  
  // Class Details
  capacity: { type: Number, default: 45, min: 1, max: 60 },
  currentEnrollment: { type: Number, default: 0 },
  room: String,
  color: String, // For visual identification
  
  // Staff
  classTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assistantTeachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // Academic Resources
  timetable: { type: mongoose.Schema.Types.ObjectId, ref: 'Timetable' },
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'graduated', 'archived'],
    default: 'active'
  },
  
  // Metadata
  description: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

classSchema.index({ grade: 1, stream: 1, academicYear: 1, school: 1 }, { unique: true });
classSchema.index({ level: 1, curriculum: 1, school: 1 });
classSchema.index({ classTeacher: 1 });

// Virtuals
classSchema.virtual('students', {
  ref: 'StudentClass',
  localField: '_id',
  foreignField: 'class',
  match: { status: 'Active' }
});

classSchema.virtual('attendanceToday').get(async function() {
  const Attendance = mongoose.model('Attendance');
  const today = new Date().toISOString().split('T')[0];
  
  const attendance = await Attendance.aggregate([
    {
      $match: {
        class: this._id,
        date: new Date(today)
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  return attendance;
});

// Update enrollment count automatically
classSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('status')) {
    const StudentClass = mongoose.model('StudentClass');
    this.currentEnrollment = await StudentClass.countDocuments({
      class: this._id,
      status: 'Active'
    });
  }
  next();
});

module.exports = mongoose.model('Class', classSchema);