// models/Parent.js
const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema({
  // Personal Information
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  otherNames: { type: String, trim: true },
  
  // Contact Information
  phoneNumber: { type: String, required: true },
  email: { type: String, lowercase: true },
  occupation: String,
  employer: String,
  
  // Address
  address: {
    county: String,
    subCounty: String,
    town: String,
    postalAddress: String
  },
  
  // School Context
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  
  // Children
  children: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    relationship: { 
      type: String, 
      enum: ['Mother', 'Father', 'Guardian'], 
      required: true 
    },
    isPrimary: { type: Boolean, default: false }
  }],
  
  // Communication Preferences
  preferences: {
    receiveSMS: { type: Boolean, default: true },
    receiveEmail: { type: Boolean, default: true },
    receivePush: { type: Boolean, default: true },
    language: { type: String, default: 'en' }
  },
  
  // Parent Engagement (CBC)
  engagement: {
    attendance: {
      meetingsAttended: { type: Number, default: 0 },
      lastMeeting: Date
    },
    activities: {
      completed: { type: Number, default: 0 },
      pending: { type: Number, default: 0 }
    }
  },
  
  // System Reference
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true },
  
  // Status
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

parentSchema.index({ phoneNumber: 1, school: 1 }, { unique: true });
parentSchema.index({ 'children.student': 1 });

// Virtuals
parentSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`.trim();
});

parentSchema.virtual('primaryChildren').get(function() {
  return this.children.filter(child => child.isPrimary);
});

// Methods
parentSchema.methods.getChildrenPerformance = async function() {
  const Result = mongoose.model('Result');
  const school = await mongoose.model('School').findById(this.school);
  
  const childrenIds = this.children.map(child => child.student);
  
  return await Result.aggregate([
    {
      $match: {
        student: { $in: childrenIds },
        academicYear: school.academicStructure.currentAcademicYear,
        isPublished: true
      }
    },
    {
      $group: {
        _id: '$student',
        averagePerformance: { $avg: '$overallPercentage' },
        termPerformance: {
          $push: {
            term: '$termNumber',
            average: '$overallPercentage'
          }
        }
      }
    },
    {
      $lookup: {
        from: 'students',
        localField: '_id',
        foreignField: '_id',
        as: 'studentInfo'
      }
    },
    {
      $unwind: '$studentInfo'
    },
    {
      $project: {
        studentName: { $concat: ['$studentInfo.firstName', ' ', '$studentInfo.lastName'] },
        averagePerformance: 1,
        termPerformance: 1
      }
    }
  ]);
};

module.exports = mongoose.model('Parent', parentSchema);