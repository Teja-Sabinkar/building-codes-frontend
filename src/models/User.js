// models/User.js - ENHANCED with Better Email Verification Handling
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/\S+@\S+\.\S+/, 'Please provide a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false, // Don't return password by default
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: Date,

  // SOFT DELETION FIELDS
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
    type: Date,
    default: null
  },
  originalEmail: {
    type: String,
    default: null,
    trim: true
  },
  originalName: {
    type: String,
    default: null,
    trim: true
  },
  deletionReason: {
    type: String,
    enum: ['user_requested', 'admin_action', 'policy_violation', 'data_cleanup'],
    default: null
  },

  // Email verification tracking
  emailVerificationAttempts: {
    type: Number,
    default: 0
  },
  lastVerificationEmailSent: {
    type: Date,
    default: null
  },

  // Building Codes Assistant specific fields
  profile: {
    company: {
      type: String,
      trim: true,
      default: null
    },
    jobTitle: {
      type: String,
      trim: true,
      default: null
    },
    profession: {
      type: String,
      enum: ['architect', 'contractor', 'engineer', 'designer', 'inspector', 'developer', 'other'],
      default: null
    },
    primaryJurisdiction: {
      type: String,
      trim: true,
      default: null
    },
    specializations: [{
      type: String,
      enum: ['residential', 'commercial', 'institutional', 'industrial', 'mixed-use', 'healthcare', 'education', 'hospitality']
    }],
    licenseNumber: {
      type: String,
      trim: true,
      default: null
    },
    licenseState: {
      type: String,
      trim: true,
      default: null
    }
  },
  
  usageStats: {
    totalRegulationQueries: {
      type: Number,
      default: 0
    },
    totalConversations: {
      type: Number,
      default: 0
    },
    averageQueriesPerSession: {
      type: Number,
      default: 0
    },
    mostUsedCodeTypes: [{
      codeType: String,
      count: Number
    }],
    mostQueriedBuildingTypes: [{
      buildingType: String,
      count: Number
    }],
    averageConfidenceScore: {
      type: Number,
      default: null
    },
    lastQueryDate: {
      type: Date,
      default: null
    },
    expertiseLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner'
    }
  },
  
  preferences: {
    defaultCodeType: {
      type: String,
      enum: ['IBC', 'IRC', 'ADA', 'NFPA', 'IECC', 'IPC', 'IMC', 'NEC'],
      default: 'IBC'
    },
    preferredBuildingTypes: [{
      type: String,
      enum: ['residential', 'commercial', 'institutional', 'industrial', 'mixed-use']
    }],
    autoSpeakResponses: {
      type: Boolean,
      default: false
    },
    enableVoiceInput: {
      type: Boolean,
      default: true
    },
    showConfidenceScores: {
      type: Boolean,
      default: true
    },
    detailedReferences: {
      type: Boolean,
      default: true
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'dark'
    }
  }
}, { timestamps: true });

// INDEXES FOR PERFORMANCE
userSchema.index({ email: 1, isDeleted: 1 });
userSchema.index({ isDeleted: 1, deletedAt: 1 });
userSchema.index({ emailVerificationToken: 1, emailVerificationExpires: 1 });

// Hash the password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check if password is correct
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// ENHANCED: Method to generate email verification token with logging
userSchema.methods.createEmailVerificationToken = function () {
  console.log(`🔑 Creating email verification token for user: ${this._id}`);
  
  // Create a random token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  console.log(`✅ Generated verification token: ${verificationToken.substring(0, 8)}...`);

  // Hash the token and set it to emailVerificationToken field
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  // Set token expiry (24 hours)
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
  
  // Track verification attempts
  this.emailVerificationAttempts = (this.emailVerificationAttempts || 0) + 1;
  this.lastVerificationEmailSent = new Date();

  console.log(`✅ Token expires at: ${new Date(this.emailVerificationExpires)}`);
  console.log(`📊 Verification attempt #${this.emailVerificationAttempts}`);

  return verificationToken;
};

// Method to generate password reset token
userSchema.methods.createPasswordResetToken = function () {
  console.log(`🔑 Creating password reset token for user: ${this._id}`);
  
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set token expiry (10 minutes)
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  
  console.log(`✅ Reset token expires at: ${new Date(this.passwordResetExpires)}`);

  return resetToken;
};

// ENHANCED: Check if user can request new verification email
userSchema.methods.canRequestVerificationEmail = function () {
  // Allow if no previous attempt
  if (!this.lastVerificationEmailSent) {
    return { canRequest: true, reason: 'first_attempt' };
  }
  
  // Check if enough time has passed (5 minutes minimum between requests)
  const timeSinceLastEmail = Date.now() - this.lastVerificationEmailSent.getTime();
  const minimumWaitTime = 5 * 60 * 1000; // 5 minutes
  
  if (timeSinceLastEmail < minimumWaitTime) {
    const remainingTime = Math.ceil((minimumWaitTime - timeSinceLastEmail) / 1000 / 60);
    return { 
      canRequest: false, 
      reason: 'rate_limited',
      waitMinutes: remainingTime
    };
  }
  
  // Check if too many attempts (max 5 per day)
  const attemptsToday = this.emailVerificationAttempts || 0;
  if (attemptsToday >= 5) {
    return { 
      canRequest: false, 
      reason: 'daily_limit_exceeded',
      maxAttempts: 5,
      currentAttempts: attemptsToday
    };
  }
  
  return { canRequest: true, reason: 'retry_allowed' };
};

// THEME PREFERENCE METHODS
userSchema.methods.updateThemePreference = function (theme) {
  console.log(`🎨 Updating theme preference for user ${this._id}: ${theme}`);

  if (!['light', 'dark'].includes(theme)) {
    throw new Error('Invalid theme. Must be "light" or "dark"');
  }

  this.preferences.theme = theme;
  return this.save();
};

userSchema.methods.getThemePreference = function () {
  return this.preferences?.theme || 'dark';
};

// SOFT DELETION METHODS
userSchema.methods.softDelete = function (reason = 'user_requested') {
  console.log(`🗑️ Soft deleting user: ${this._id} - ${this.email}`);

  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletionReason = reason;
  this.originalEmail = this.email;
  this.originalName = this.name;
  this.email = `deleted_${this._id}@deleted.regGPT.local`;

  return this.save();
};

userSchema.methods.restore = function () {
  console.log(`🔄 Restoring user: ${this._id}`);

  if (!this.isDeleted) {
    throw new Error('User is not deleted');
  }

  if (this.originalEmail) {
    this.email = this.originalEmail;
  }
  if (this.originalName) {
    this.name = this.originalName;
  }

  this.isDeleted = false;
  this.deletedAt = null;
  this.deletionReason = null;
  this.originalEmail = null;
  this.originalName = null;

  return this.save();
};

userSchema.methods.isAccountDeleted = function () {
  return this.isDeleted === true;
};

// STATIC METHODS FOR ADMIN OPERATIONS
userSchema.statics.findDeleted = function (options = {}) {
  return this.find({
    isDeleted: true
  })
    .sort({ deletedAt: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

userSchema.statics.findByOriginalEmail = function (email) {
  return this.findOne({
    originalEmail: email,
    isDeleted: true
  });
};

userSchema.statics.getActiveUsersCount = function () {
  return this.countDocuments({ isDeleted: { $ne: true } });
};

userSchema.statics.getDeletedUsersCount = function () {
  return this.countDocuments({ isDeleted: true });
};

// Method to update usage statistics
userSchema.methods.updateUsageStats = function (regulationData) {
  const stats = this.usageStats;
  stats.totalRegulationQueries = (stats.totalRegulationQueries || 0) + 1;
  stats.lastQueryDate = new Date();

  if (regulationData.queryMetadata && regulationData.queryMetadata.codeType) {
    const codeType = regulationData.queryMetadata.codeType;
    const codeTypeIndex = stats.mostUsedCodeTypes.findIndex(item => item.codeType === codeType);

    if (codeTypeIndex >= 0) {
      stats.mostUsedCodeTypes[codeTypeIndex].count += 1;
    } else {
      stats.mostUsedCodeTypes.push({ codeType, count: 1 });
    }

    stats.mostUsedCodeTypes.sort((a, b) => b.count - a.count);
    stats.mostUsedCodeTypes = stats.mostUsedCodeTypes.slice(0, 10);
  }

  if (regulationData.queryMetadata && regulationData.queryMetadata.buildingType) {
    const buildingType = regulationData.queryMetadata.buildingType;
    const buildingTypeIndex = stats.mostQueriedBuildingTypes.findIndex(item => item.buildingType === buildingType);

    if (buildingTypeIndex >= 0) {
      stats.mostQueriedBuildingTypes[buildingTypeIndex].count += 1;
    } else {
      stats.mostQueriedBuildingTypes.push({ buildingType, count: 1 });
    }

    stats.mostQueriedBuildingTypes.sort((a, b) => b.count - a.count);
    stats.mostQueriedBuildingTypes = stats.mostQueriedBuildingTypes.slice(0, 10);
  }

  if (regulationData.confidence !== null && regulationData.confidence !== undefined) {
    if (stats.averageConfidenceScore === null) {
      stats.averageConfidenceScore = regulationData.confidence;
    } else {
      const totalQueries = stats.totalRegulationQueries;
      stats.averageConfidenceScore = ((stats.averageConfidenceScore * (totalQueries - 1)) + regulationData.confidence) / totalQueries;
    }
  }

  this._updateExpertiseLevel();
  this.markModified('usageStats');
  return this.save();
};

// Method to update expertise level
userSchema.methods._updateExpertiseLevel = function () {
  const stats = this.usageStats;
  const queryCount = stats.totalRegulationQueries || 0;
  const codeTypeDiversity = stats.mostUsedCodeTypes.length;
  const buildingTypeDiversity = stats.mostQueriedBuildingTypes.length;

  if (queryCount >= 500 || (queryCount >= 200 && codeTypeDiversity >= 5 && buildingTypeDiversity >= 4)) {
    stats.expertiseLevel = 'expert';
  } else if (queryCount >= 100 || (queryCount >= 50 && codeTypeDiversity >= 3 && buildingTypeDiversity >= 3)) {
    stats.expertiseLevel = 'advanced';
  } else if (queryCount >= 25 || (queryCount >= 10 && codeTypeDiversity >= 2)) {
    stats.expertiseLevel = 'intermediate';
  } else {
    stats.expertiseLevel = 'beginner';
  }
};

// Method to get user's professional summary
userSchema.methods.getProfessionalSummary = function () {
  const profile = this.profile || {};
  const stats = this.usageStats || {};

  return {
    name: this.name,
    profession: profile.profession,
    company: profile.company,
    jobTitle: profile.jobTitle,
    jurisdiction: profile.primaryJurisdiction,
    specializations: profile.specializations || [],
    expertiseLevel: stats.expertiseLevel || 'beginner',
    totalQueries: stats.totalRegulationQueries || 0,
    mostUsedCode: stats.mostUsedCodeTypes[0]?.codeType || null,
    preferredBuildingType: stats.mostQueriedBuildingTypes[0]?.buildingType || null,
    joinedDate: this.createdAt,
    lastActive: stats.lastQueryDate || this.lastLogin,
    theme: this.preferences?.theme || 'dark'
  };
};

// Prevent mongoose from creating a new model if it already exists
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;