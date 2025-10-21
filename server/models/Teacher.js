// models/Teacher.js
const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  // Personal Information
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  otherNames: { type: String, trim: true },
  
  // Professional Information
  staffId: { type: String, required: true },
  tscNumber: String, // Teachers Service Commission number
  idNumber: { type: String, required: true },
  
  // Personal Details
  dateOfBirth: Date,
  gender: { 
    type: String, 
    enum: ['Male', 'Female', 'Other'], 
    required: true 
  },
  phoneNumber: { type: String, required: true },
  email: { type: String, lowercase: true },
  
  // School Context
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  
  // Professional Details
  employmentType: {
    type: String,
    enum: ['Permanent', 'Contract', 'Part-time', 'Intern'],
    required: true
  },
  designation: {
    type: String,
    enum: [
      'Teacher', 
      'Senior Teacher', 
      'Head of Department', 
      'Deputy Principal', 
      'Principal'
    ],
    default: 'Teacher'
  },
  department: String,
  
  // Subjects and Classes
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  curricula: [{ type: String, enum: ['8-4-4', 'CBC'] }],
  
  // Class Teacher Assignment
  classTeacherFor: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  
  // Employment Details
  employmentDate: Date,
  qualification: {
    highest: String,
    institution: String,
    year: Number
  },
  
  // Contact Information
  address: {
    county: String,
    subCounty: String,
    town: String,
    postalAddress: String
  },
  
  // Emergency Contact
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  
  // System Reference
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true },
  photo: String,
  
  // Status
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended', 'Transferred'],
    default: 'Active'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

teacherSchema.index({ staffId: 1, school: 1 }, { unique: true });
teacherSchema.index({ tscNumber: 1 }, { sparse: true });
teacherSchema.index({ designation: 1, school: 1 });

// Virtuals
teacherSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`.trim();
});

teacherSchema.virtual('currentClasses').get(async function() {
  const ClassSubject = mongoose.model('ClassSubject');
  const school = await mongoose.model('School').findById(this.school);
  
  return await ClassSubject.find({
    teacher: this.user,
    academicYear: school.academicStructure.currentAcademicYear,
    status: 'active'
  }).populate('class subject');
});

// Methods
teacherSchema.methods.getWorkload = async function() {
  const ClassSubject = mongoose.model('ClassSubject');
  const school = await mongoose.model('School').findById(this.school);
  
  return await ClassSubject.aggregate([
    {
      $match: {
        teacher: this.user,
        academicYear: school.academicStructure.currentAcademicYear,
        status: 'active'
      }
    },
    {
      $lookup: {
        from: 'classes',
        localField: 'class',
        foreignField: '_id',
        as: 'classInfo'
      }
    },
    {
      $unwind: '$classInfo'
    },
    {
      $group: {
        _id: null,
        totalClasses: { $sum: 1 },
        totalStudents: { $sum: '$classInfo.currentEnrollment' },
        subjects: { $addToSet: '$subject' }
      }
    }
  ]);
};

module.exports = mongoose.model('Teacher', teacherSchema);