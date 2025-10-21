// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phoneNumber: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // Role and Profile
  role: {
    type: String,
    enum: ['admin', 'teacher', 'student', 'parent', 'support_staff'],
    required: true
  },
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'profileModel'
  },
  profileModel: {
    type: String,
    enum: ['Teacher', 'Student', 'Parent', 'SupportStaff']
  },
  
  // School Context
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  
  // Permissions (Granular access control)
  permissions: {
    academic: {
      canViewGrades: { type: Boolean, default: false },
      canEnterGrades: { type: Boolean, default: false },
      canPublishResults: { type: Boolean, default: false },
      canViewAllClasses: { type: Boolean, default: false },
      allowedSubjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
      allowedClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }]
    },
    administrative: {
      canManageUsers: { type: Boolean, default: false },
      canManageClasses: { type: Boolean, default: false },
      canViewReports: { type: Boolean, default: false },
      canManageCalendar: { type: Boolean, default: false }
    },
    financial: {
      canViewFees: { type: Boolean, default: false },
      canProcessPayments: { type: Boolean, default: false }
    }
  },
  
  // Preferences
  preferences: {
    language: { type: String, default: 'en' },
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'light' },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    }
  },
  
  // Security
  lastLogin: Date,
  loginAttempts: { type: Number, default: 0 },
  accountLocked: { type: Boolean, default: false },
  lockUntil: Date,
  
  // Status
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: false }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

userSchema.index({ email: 1, school: 1 }, { unique: true });
userSchema.index({ phoneNumber: 1, school: 1 }, { unique: true });
userSchema.index({ role: 1, school: 1 });

// Virtuals
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`.trim();
});

// Password hashing
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Methods
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.hasPermission = function(category, permission) {
  return this.permissions[category] && this.permissions[category][permission];
};

module.exports = mongoose.model('User', userSchema);