// models/User.js
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
  // NEW: Building Codes Assistant specific fields
  profile: {
    // Professional information for building codes context
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
      default: null // e.g., "California", "New York City", "International"
    },
    specializations: [{
      type: String,
      enum: ['residential', 'commercial', 'institutional', 'industrial', 'mixed-use', 'healthcare', 'education', 'hospitality']
    }],
    // License information (optional)
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
  // Usage analytics for building codes
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
    // Track user's expertise level based on query patterns
    expertiseLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner'
    }
  },
  // User preferences for building codes
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
    }
  }
}, { timestamps: true });

// Hash the password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) return next();
  
  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    // Hash the password along with the new salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check if password is correct
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate email verification token
userSchema.methods.createEmailVerificationToken = function() {
  // Create a random token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  // Hash the token and set it to emailVerificationToken field
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  // Set token expiry (24 hours)
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
  
  return verificationToken;
};

// Method to generate password reset token
userSchema.methods.createPasswordResetToken = function() {
  // Create a random token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash the token and set it to passwordResetToken field
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Set token expiry (10 minutes)
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  
  return resetToken;
};

// NEW: Method to update usage statistics
userSchema.methods.updateUsageStats = function(regulationData) {
  const stats = this.usageStats;
  
  // Increment total queries
  stats.totalRegulationQueries = (stats.totalRegulationQueries || 0) + 1;
  stats.lastQueryDate = new Date();
  
  // Update code type usage
  if (regulationData.queryMetadata && regulationData.queryMetadata.codeType) {
    const codeType = regulationData.queryMetadata.codeType;
    const codeTypeIndex = stats.mostUsedCodeTypes.findIndex(item => item.codeType === codeType);
    
    if (codeTypeIndex >= 0) {
      stats.mostUsedCodeTypes[codeTypeIndex].count += 1;
    } else {
      stats.mostUsedCodeTypes.push({ codeType, count: 1 });
    }
    
    // Sort by count (descending)
    stats.mostUsedCodeTypes.sort((a, b) => b.count - a.count);
    // Keep only top 10
    stats.mostUsedCodeTypes = stats.mostUsedCodeTypes.slice(0, 10);
  }
  
  // Update building type usage
  if (regulationData.queryMetadata && regulationData.queryMetadata.buildingType) {
    const buildingType = regulationData.queryMetadata.buildingType;
    const buildingTypeIndex = stats.mostQueriedBuildingTypes.findIndex(item => item.buildingType === buildingType);
    
    if (buildingTypeIndex >= 0) {
      stats.mostQueriedBuildingTypes[buildingTypeIndex].count += 1;
    } else {
      stats.mostQueriedBuildingTypes.push({ buildingType, count: 1 });
    }
    
    // Sort by count (descending)
    stats.mostQueriedBuildingTypes.sort((a, b) => b.count - a.count);
    // Keep only top 10
    stats.mostQueriedBuildingTypes = stats.mostQueriedBuildingTypes.slice(0, 10);
  }
  
  // Update average confidence score
  if (regulationData.confidence !== null && regulationData.confidence !== undefined) {
    if (stats.averageConfidenceScore === null) {
      stats.averageConfidenceScore = regulationData.confidence;
    } else {
      // Running average
      const totalQueries = stats.totalRegulationQueries;
      stats.averageConfidenceScore = ((stats.averageConfidenceScore * (totalQueries - 1)) + regulationData.confidence) / totalQueries;
    }
  }
  
  // Update expertise level based on query count and diversity
  this._updateExpertiseLevel();
  
  this.markModified('usageStats');
  return this.save();
};

// NEW: Method to update expertise level
userSchema.methods._updateExpertiseLevel = function() {
  const stats = this.usageStats;
  const queryCount = stats.totalRegulationQueries || 0;
  const codeTypeDiversity = stats.mostUsedCodeTypes.length;
  const buildingTypeDiversity = stats.mostQueriedBuildingTypes.length;
  
  // Calculate expertise based on usage patterns
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

// NEW: Method to get user's professional summary
userSchema.methods.getProfessionalSummary = function() {
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
    lastActive: stats.lastQueryDate || this.lastLogin
  };
};

// NEW: Method to get personalized recommendations
userSchema.methods.getPersonalizedRecommendations = function() {
  const stats = this.usageStats || {};
  const profile = this.profile || {};
  const preferences = this.preferences || {};
  
  const recommendations = [];
  
  // Recommend based on profession
  if (profile.profession === 'architect' && !stats.mostUsedCodeTypes.find(item => item.codeType === 'ADA')) {
    recommendations.push({
      type: 'code_exploration',
      title: 'Explore ADA Requirements',
      description: 'As an architect, familiarizing yourself with ADA accessibility requirements is essential.',
      suggestedQuery: 'ADA door width requirements for commercial buildings'
    });
  }
  
  // Recommend based on usage patterns
  if (stats.expertiseLevel === 'beginner' && stats.totalRegulationQueries < 10) {
    recommendations.push({
      type: 'getting_started',
      title: 'Common Building Code Questions',
      description: 'Start with these frequently asked building code questions.',
      suggestedQuery: 'What are the minimum ceiling heights for residential buildings?'
    });
  }
  
  // Recommend based on specializations
  if (profile.specializations.includes('residential') && !stats.mostUsedCodeTypes.find(item => item.codeType === 'IRC')) {
    recommendations.push({
      type: 'specialization',
      title: 'International Residential Code (IRC)',
      description: 'Since you work with residential projects, explore IRC requirements.',
      suggestedQuery: 'IRC bedroom window requirements for egress'
    });
  }
  
  return recommendations.slice(0, 3); // Return top 3 recommendations
};

// Prevent mongoose from creating a new model if it already exists
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;