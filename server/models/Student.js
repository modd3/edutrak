// models/Student.js
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  // Personal Information
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  otherNames: { type: String, trim: true },
  
  // Kenyan Education Identifiers
  admissionNumber: { type: String, required: true, index: true },
  upiNumber: { type: String, unique: true, sparse: true }, // CBC Unique Personal Identifier
  knecNumber: String, // For 8-4-4 national exams
  
  // Personal Details
  dateOfBirth: { type: Date, required: true },
  gender: { 
    type: String, 
    enum: ['Male', 'Female', 'Other'], 
    required: true 
  },
  birthCertificateNumber: String,
  nationality: { type: String, default: 'Kenyan' },
  
  // School Context
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  currentCurriculum: {
    type: String,
    enum: ['8-4-4', 'CBC'],
    required: true
  },
  
  // Contact Information
  phoneNumber: String,
  email: String,
  address: {
    county: { type: String, required: true },
    subCounty: { type: String, required: true },
    ward: String,
    location: String,
    subLocation: String,
    village: String,
    postalCode: String
  },
  
  // Parent/Guardian Information
  parents: [{
    relationship: { 
      type: String, 
      enum: ['Mother', 'Father', 'Guardian'], 
      required: true 
    },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent', required: true }
  }],
  
  // Medical Information
  medicalInfo: {
    bloodGroup: String,
    allergies: [String],
    chronicConditions: [String],
    disabilities: [String],
    doctorName: String,
    doctorPhone: String,
    insuranceProvider: String,
    policyNumber: String
  },
  
  // CBC Specific Data
  cbcProfile: {
    portfolioId: String,
    learningStyles: [String],
    talents: [String],
    interests: [String],
    specialNeeds: [String],
    parentEngagementLevel: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium'
    }
  },
  
  // Enrollment History
  enrollmentHistory: [{
    academicYear: String,
    school: String,
    grade: String,
    status: String,
    reason: String,
    date: Date
  }],
  
  // Status
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Transferred', 'Graduated', 'Suspended'],
    default: 'Active'
  },
  enrollmentDate: { type: Date, default: Date.now },
  graduationDate: Date,
  
  // System References
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true },
  photo: String,
  
  // Audit
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

studentSchema.index({ admissionNumber: 1, school: 1 }, { unique: true });
studentSchema.index({ upiNumber: 1 }, { sparse: true });
studentSchema.index({ 'parents.parent': 1 });
studentSchema.index({ status: 1, school: 1 });

// Virtuals
studentSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`.trim();
});

studentSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

studentSchema.virtual('currentClass').get(async function() {
  const StudentClass = mongoose.model('StudentClass');
  const school = await mongoose.model('School').findById(this.school);
  return await StudentClass.findOne({
    student: this._id,
    academicYear: school.academicStructure.currentAcademicYear,
    status: 'Active'
  }).populate('class');
});

// Methods
studentSchema.methods.getAcademicSummary = async function() {
  const Result = mongoose.model('Result');
  const school = await mongoose.model('School').findById(this.school);
  
  return await Result.aggregate([
    {
      $match: {
        student: this._id,
        academicYear: school.academicStructure.currentAcademicYear,
        isPublished: true
      }
    },
    {
      $group: {
        _id: '$termNumber',
        averageScore: { $avg: '$overallPercentage' },
        subjectsCount: { $sum: 1 },
        bestSubject: { $max: '$overallPercentage' },
        totalPoints: { $sum: '$overallPoints' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

module.exports = mongoose.model('Student', studentSchema);