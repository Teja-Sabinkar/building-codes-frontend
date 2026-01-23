// models/User.js - ENHANCED with Recently Viewed PDFs Feature
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
  },

  // ============================================================================
  // 🆕 NEW FEATURE: RECENTLY VIEWED PDFs
  // ============================================================================
  // Stores recently viewed PDFs per region (cross-conversation)
  // Maximum 10 PDFs per region, sorted by most recent first
  recentlyViewedPdfs: {
    India: [{
      documentName: {
        type: String,
        required: true
      },
      displayName: {
        type: String,
        required: true
      },
      pdfFilename: {
        type: String,
        required: true
      },
      page: {
        type: Number,
        required: true,
        min: 1
      },
      viewedAt: {
        type: Date,
        required: true,
        default: Date.now
      },
      country: {
        type: String,
        required: true,
        enum: ['India']
      }
    }],
    Scotland: [{
      documentName: {
        type: String,
        required: true
      },
      displayName: {
        type: String,
        required: true
      },
      pdfFilename: {
        type: String,
        required: true
      },
      page: {
        type: Number,
        required: true,
        min: 1
      },
      viewedAt: {
        type: Date,
        required: true,
        default: Date.now
      },
      country: {
        type: String,
        required: true,
        enum: ['Scotland']
      }
    }],
    Dubai: [{
      documentName: {
        type: String,
        required: true
      },
      displayName: {
        type: String,
        required: true
      },
      pdfFilename: {
        type: String,
        required: true
      },
      page: {
        type: Number,
        required: true,
        min: 1
      },
      viewedAt: {
        type: Date,
        required: true,
        default: Date.now
      },
      country: {
        type: String,
        required: true,
        enum: ['Dubai']
      }
    }]
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
  console.log(`🔐 Creating email verification token for user: ${this._id}`);
  
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
  console.log(`🔐 Creating password reset token for user: ${this._id}`);
  
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

// ============================================================================
// 🆕 RECENTLY VIEWED PDFs METHODS
// ============================================================================

/**
 * Add or update a recently viewed PDF for a specific region
 * @param {Object} pdfData - PDF viewing data
 * @param {String} pdfData.documentName - Document name (e.g., "NBC 2016-VOL.1")
 * @param {String} pdfData.displayName - Display name for UI
 * @param {String} pdfData.pdfFilename - PDF filename
 * @param {Number} pdfData.page - Last viewed page number
 * @param {String} pdfData.country - Region (India, Scotland, Dubai)
 * @returns {Promise<User>} Updated user document
 */
userSchema.methods.addRecentlyViewedPdf = async function (pdfData) {
  const { documentName, displayName, pdfFilename, page, country } = pdfData;

  console.log(`📄 Adding recently viewed PDF for user ${this._id}:`, {
    documentName,
    country,
    page
  });

  // Validate region
  const validRegions = ['India', 'Scotland', 'Dubai'];
  if (!validRegions.includes(country)) {
    throw new Error(`Invalid region: ${country}. Must be one of: ${validRegions.join(', ')}`);
  }

  // Initialize region array if it doesn't exist
  if (!this.recentlyViewedPdfs) {
    this.recentlyViewedPdfs = {
      India: [],
      Scotland: [],
      Dubai: []
    };
  }

  if (!this.recentlyViewedPdfs[country]) {
    this.recentlyViewedPdfs[country] = [];
  }

  // Get region-specific array
  const regionPdfs = this.recentlyViewedPdfs[country];

  // Check if document already exists in region history
  const existingIndex = regionPdfs.findIndex(
    pdf => pdf.documentName === documentName
  );

  const newPdfEntry = {
    documentName,
    displayName,
    pdfFilename,
    page: parseInt(page, 10),
    viewedAt: new Date(),
    country
  };

  if (existingIndex !== -1) {
    // Update existing entry (update page and timestamp)
    console.log(`📝 Updating existing PDF entry at index ${existingIndex}`);
    regionPdfs[existingIndex] = newPdfEntry;
  } else {
    // Add new entry at the beginning (most recent first)
    console.log(`📝 Adding new PDF entry to ${country} history`);
    regionPdfs.unshift(newPdfEntry);
  }

  // Keep only the 10 most recent PDFs per region
  if (regionPdfs.length > 10) {
    console.log(`✂️ Trimming ${country} history from ${regionPdfs.length} to 10 items`);
    this.recentlyViewedPdfs[country] = regionPdfs.slice(0, 10);
  }

  // Mark as modified (important for nested objects)
  this.markModified('recentlyViewedPdfs');

  console.log(`✅ Recently viewed updated for ${country}:`, {
    totalInRegion: this.recentlyViewedPdfs[country].length,
    latestDocument: documentName,
    latestPage: page
  });

  return this.save();
};

/**
 * Get recently viewed PDFs for a specific region
 * @param {String} country - Region (India, Scotland, Dubai)
 * @returns {Array} Array of recently viewed PDFs (max 10, sorted by most recent)
 */
userSchema.methods.getRecentlyViewedPdfs = function (country) {
  console.log(`📚 Retrieving recently viewed PDFs for region: ${country}`);

  // Validate region
  const validRegions = ['India', 'Scotland', 'Dubai'];
  if (!validRegions.includes(country)) {
    throw new Error(`Invalid region: ${country}. Must be one of: ${validRegions.join(', ')}`);
  }

  // Initialize if doesn't exist
  if (!this.recentlyViewedPdfs || !this.recentlyViewedPdfs[country]) {
    console.log(`📭 No recently viewed PDFs for ${country}`);
    return [];
  }

  const regionPdfs = this.recentlyViewedPdfs[country] || [];

  // Sort by viewedAt (most recent first) and return
  const sortedPdfs = regionPdfs
    .sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt))
    .slice(0, 10); // Ensure maximum 10

  console.log(`✅ Retrieved ${sortedPdfs.length} recently viewed PDFs for ${country}`);

  return sortedPdfs;
};

/**
 * Clear recently viewed PDFs for a specific region
 * @param {String} country - Region (India, Scotland, Dubai)
 * @returns {Promise<User>} Updated user document
 */
userSchema.methods.clearRecentlyViewedPdfs = async function (country) {
  console.log(`🗑️ Clearing recently viewed PDFs for region: ${country}`);

  // Validate region
  const validRegions = ['India', 'Scotland', 'Dubai'];
  if (!validRegions.includes(country)) {
    throw new Error(`Invalid region: ${country}. Must be one of: ${validRegions.join(', ')}`);
  }

  // Initialize if doesn't exist
  if (!this.recentlyViewedPdfs) {
    this.recentlyViewedPdfs = {
      India: [],
      Scotland: [],
      Dubai: []
    };
  }

  // Clear the specific region
  this.recentlyViewedPdfs[country] = [];
  this.markModified('recentlyViewedPdfs');

  console.log(`✅ Cleared recently viewed PDFs for ${country}`);

  return this.save();
};

// ============================================================================
// END OF RECENTLY VIEWED PDFs METHODS
// ============================================================================

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