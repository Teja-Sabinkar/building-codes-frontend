// src/models/Conversation.js - Building Codes Assistant - UPDATED WITH DUBAI SUPPORT
import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    enum: ['user', 'assistant']
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  // Edit tracking
  isEdited: {
    type: Boolean,
    default: false
  },
  originalContent: {
    type: String,
    default: null
  },
  editedAt: {
    type: Date,
    default: null
  },
  // REPLACED: plan → regulation for building codes
  regulation: {
    answer: {
      type: String,
      default: null
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: null
    },
    processingTime: {
      type: Number,
      default: null
    },
    // 🆕 CRITICAL FIX: Added query_type field
    query_type: {
      type: String,
      default: null,
      enum: ['building_codes', 'not_available', 'out_of_scope', 'identity', null]
    },
    references: [{
      id: Number,
      document: String,
      section: String,
      page: String,
      confidence: Number,
      relevanceScore: Number
    }],
    relatedRegulations: [{
      title: String,
      code: String,
      section: String,
      relevanceScore: Number
    }],
    queryMetadata: {
      searchTerms: [String],
      buildingType: String,
      occupancyGroup: String,
      codeType: String, // IBC, IRC, ADA, etc.
      jurisdiction: String,
      lastUpdated: Date
    }
  },
  // 🆕 USER FEEDBACK FIELD - Real user votes (thumbs up/down) with detailed feedback
  feedback: {
    userVote: {
      type: String,
      enum: ['helpful', 'unhelpful', null],
      default: null
    },
    votedAt: {
      type: Date,
      default: null
    },
    // 🆕 Detailed feedback fields (from feedback modal)
    issueType: {
      type: String,
      enum: [
        'UI bug',
        'Did not fully follow my request',
        'Not factually correct',
        'Incomplete response',
        'Report content',
        'Other',
        null
      ],
      default: null
    },
    details: {
      type: String,
      default: null,
      maxlength: 2000 // Limit detailed feedback to 2000 characters
    }
  }
}, { _id: true });

const ConversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    default: 'New Regulation Query'
  },
  region: {
    type: String,
    required: true,
    enum: ['India', 'Scotland', 'Dubai'], // 🔥 UPDATED: Added Dubai
    default: 'India'
  },
  regionDisplayName: {
    type: String,
    required: true,
    default: '🇮🇳 Indian Building Codes'
  },
  // REMOVED: units (not needed for building codes)
  messages: [MessageSchema],
  metadata: {
    lastRegulationQuery: {
      type: Date,
      default: null
    },
    totalQueries: {
      type: Number,
      default: 0
    },
    // Building codes specific metadata
    buildingTypes: [{
      type: String,
      count: Number
    }],
    occupancyGroups: [{
      type: String,
      count: Number
    }],
    codeTypes: [{
      type: String,
      count: Number
    }],
    averageConfidence: {
      type: Number,
      default: null
    },
    isArchived: {
      type: Boolean,
      default: false
    },
    tags: [{
      type: String
    }],
    // Track user's regulation focus areas
    focusAreas: {
      type: Map,
      of: Number,
      default: new Map()
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
ConversationSchema.index({ userId: 1, createdAt: -1 });
ConversationSchema.index({ userId: 1, 'metadata.isArchived': 1, updatedAt: -1 });

// Virtual for message count
ConversationSchema.virtual('messageCount').get(function () {
  return this.messages ? this.messages.length : 0;
});

// Virtual for regulation query count
ConversationSchema.virtual('regulationCount').get(function () {
  return this.messages ? this.messages.filter(msg => msg.regulation && msg.regulation.answer).length : 0;
});

// Virtual for latest regulation
ConversationSchema.virtual('latestRegulation').get(function () {
  if (!this.messages) return null;

  // Find the most recent message with a regulation
  for (let i = this.messages.length - 1; i >= 0; i--) {
    if (this.messages[i].regulation && this.messages[i].regulation.answer) {
      return this.messages[i].regulation;
    }
  }
  return null;
});

// Virtual for all regulations (query history)
ConversationSchema.virtual('allRegulations').get(function () {
  if (!this.messages) return [];

  return this.messages
    .filter(msg => msg.regulation && msg.regulation.answer)
    .map((msg, index) => ({
      id: msg._id,
      regulation: msg.regulation,
      timestamp: msg.timestamp,
      messageIndex: this.messages.indexOf(msg),
      queryIndex: index
    }))
    .reverse(); // Most recent first
});

// Virtual for conversation statistics
ConversationSchema.virtual('conversationStats').get(function () {
  if (!this.messages) return null;

  const regulations = this.allRegulations;
  if (regulations.length === 0) return null;

  const confidences = regulations
    .map(r => r.regulation.confidence)
    .filter(c => c !== null && c !== undefined);

  const avgConfidence = confidences.length > 0
    ? confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length
    : null;

  // Extract focus areas from regulations
  const focusAreas = new Map();
  regulations.forEach(r => {
    const metadata = r.regulation.queryMetadata;
    if (metadata) {
      if (metadata.buildingType) {
        const count = focusAreas.get(metadata.buildingType) || 0;
        focusAreas.set(metadata.buildingType, count + 1);
      }
      if (metadata.codeType) {
        const count = focusAreas.get(metadata.codeType) || 0;
        focusAreas.set(metadata.codeType, count + 1);
      }
    }
  });

  return {
    totalQueries: regulations.length,
    averageConfidence: avgConfidence,
    focusAreas: Object.fromEntries(focusAreas),
    lastQueryTime: regulations[0]?.timestamp
  };
});

// Helper method to categorize regulation queries
ConversationSchema.methods.categorizeQuery = function (queryText) {
  const buildingTypes = {
    'residential': ['residential', 'house', 'home', 'dwelling', 'apartment'],
    'commercial': ['commercial', 'office', 'retail', 'store', 'business'],
    'institutional': ['school', 'hospital', 'church', 'institutional'],
    'industrial': ['industrial', 'factory', 'warehouse', 'manufacturing'],
    'mixed-use': ['mixed', 'multi-use', 'mixed-use']
  };

  const codeTypes = {
    'IBC': ['ibc', 'international building code', 'building code'],
    'IRC': ['irc', 'residential code', 'international residential'],
    'ADA': ['ada', 'accessibility', 'americans with disabilities'],
    'NFPA': ['nfpa', 'fire', 'fire safety', 'sprinkler'],
    'Energy': ['energy', 'iecc', 'efficiency', 'insulation'],
    'Plumbing': ['plumbing', 'ipc', 'water', 'sewer'],
    'Mechanical': ['mechanical', 'imc', 'hvac', 'ventilation'],
    'Electrical': ['electrical', 'nec', 'wiring', 'circuit']
  };

  const queryLower = queryText.toLowerCase();

  // Determine building type
  let buildingType = 'general';
  for (const [type, keywords] of Object.entries(buildingTypes)) {
    if (keywords.some(keyword => queryLower.includes(keyword))) {
      buildingType = type;
      break;
    }
  }

  // Determine code type
  let codeType = 'general';
  for (const [type, keywords] of Object.entries(codeTypes)) {
    if (keywords.some(keyword => queryLower.includes(keyword))) {
      codeType = type;
      break;
    }
  }

  // Extract search terms (remove common words)
  const commonWords = ['what', 'are', 'the', 'for', 'in', 'of', 'and', 'or', 'is', 'requirements', 'minimum', 'maximum'];
  const searchTerms = queryText
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(' ')
    .filter(word => word.length > 2 && !commonWords.includes(word));

  return {
    buildingType,
    codeType,
    searchTerms: [...new Set(searchTerms)] // Remove duplicates
  };
};

// Instance Methods
ConversationSchema.methods.addMessage = function (messageData) {
  console.log('📄 addMessage called for regulation query');
  try {
    // Process regulation metadata if this message contains a regulation
    if (messageData.regulation && messageData.regulation.answer) {
      // Categorize the original user query
      const userMessage = this.messages[this.messages.length - 1];
      if (userMessage && userMessage.role === 'user') {
        const queryMetadata = this.categorizeQuery(userMessage.content);
        messageData.regulation.queryMetadata = {
          ...queryMetadata,
          lastUpdated: new Date()
        };
      }

      // Update conversation metadata
      this.metadata.lastRegulationQuery = new Date();
      this.metadata.totalQueries = (this.metadata.totalQueries || 0) + 1;

      // Update focus areas
      if (messageData.regulation.queryMetadata) {
        const focusAreas = this.metadata.focusAreas || new Map();
        const { buildingType, codeType } = messageData.regulation.queryMetadata;

        if (buildingType && buildingType !== 'general') {
          const count = focusAreas.get(buildingType) || 0;
          focusAreas.set(buildingType, count + 1);
        }

        if (codeType && codeType !== 'general') {
          const count = focusAreas.get(codeType) || 0;
          focusAreas.set(codeType, count + 1);
        }

        this.metadata.focusAreas = focusAreas;
      }

      // Update average confidence
      const allRegulations = this.messages
        .filter(msg => msg.regulation && msg.regulation.confidence !== null)
        .map(msg => msg.regulation.confidence);

      allRegulations.push(messageData.regulation.confidence);

      const avgConfidence = allRegulations.reduce((sum, conf) => sum + conf, 0) / allRegulations.length;
      this.metadata.averageConfidence = avgConfidence;
    }

    this.messages.push(messageData);

    // Update conversation title based on first user message if still default
    if (this.title === 'New Regulation Query' && messageData.role === 'user' && this.messages.length === 1) {
      // Generate title from first message (truncate to 50 chars)
      const title = messageData.content.length > 50
        ? messageData.content.substring(0, 47) + '...'
        : messageData.content;
      this.title = title;
    }

    this.markModified('messages');
    this.markModified('metadata');
    return this.save();
  } catch (error) {
    console.error('Error in addMessage:', error);
    throw error;
  }
};

ConversationSchema.methods.updateMessage = function (messageIndex, updates) {
  console.log('📄 updateMessage called:', { messageIndex, updates });
  try {
    if (messageIndex < 0 || messageIndex >= this.messages.length) {
      throw new Error(`Invalid message index: ${messageIndex}. Message count: ${this.messages.length}`);
    }

    const message = this.messages[messageIndex];

    // If content is being updated, track the edit
    if (updates.content && updates.content !== message.content) {
      if (!message.isEdited) {
        message.originalContent = message.content;
        message.isEdited = true;
      }
      message.editedAt = new Date();
    }

    Object.assign(message, updates);
    this.markModified('messages');

    return this.save();
  } catch (error) {
    console.error('❌ Error in updateMessage:', error);
    throw error;
  }
};

ConversationSchema.methods.editMessageAndRegenerate = function (messageIndex, newContent) {
  console.log('✂️ editMessageAndRegenerate called:', {
    messageIndex,
    newContent: newContent?.substring(0, 50) + '...',
    currentMessageCount: this.messages.length
  });

  try {
    // Validate inputs
    if (typeof messageIndex !== 'number' || messageIndex < 0) {
      throw new Error(`Invalid messageIndex: ${messageIndex}`);
    }

    if (!newContent || typeof newContent !== 'string') {
      throw new Error(`Invalid newContent: ${newContent}`);
    }

    if (messageIndex >= this.messages.length) {
      throw new Error(`Message index ${messageIndex} out of bounds. Message count: ${this.messages.length}`);
    }

    const message = this.messages[messageIndex];

    if (!message) {
      throw new Error(`Message at index ${messageIndex} not found`);
    }

    // Only allow editing user messages
    if (message.role !== 'user') {
      throw new Error(`Cannot edit ${message.role} message. Only user messages can be edited.`);
    }

    console.log('🔍 Editing regulation query:', {
      originalContent: message.content?.substring(0, 50) + '...',
      newContent: newContent.substring(0, 50) + '...',
      messageRole: message.role
    });

    // Store original content if first edit
    if (!message.isEdited) {
      message.originalContent = message.content;
      message.isEdited = true;
    }

    // Update message content
    message.content = newContent.trim();
    message.editedAt = new Date();

    // Remove all messages after the edited message (they need to be regenerated)
    const originalMessageCount = this.messages.length;
    this.messages = this.messages.slice(0, messageIndex + 1);

    console.log('✂️ Messages truncated:', {
      originalCount: originalMessageCount,
      newCount: this.messages.length,
      removedCount: originalMessageCount - this.messages.length
    });

    // Mark the document as modified to ensure save works
    this.markModified('messages');

    console.log('💾 Saving conversation...');
    return this.save();

  } catch (error) {
    console.error('❌ Error in editMessageAndRegenerate:', error);
    throw new Error(`Failed to edit message: ${error.message}`);
  }
};

ConversationSchema.methods.deleteMessage = function (messageIndex) {
  try {
    if (messageIndex >= 0 && messageIndex < this.messages.length) {
      this.messages.splice(messageIndex, 1);
      this.markModified('messages');
      return this.save();
    }
    throw new Error('Invalid message index');
  } catch (error) {
    console.error('Error in deleteMessage:', error);
    throw error;
  }
};

ConversationSchema.methods.getAllRegulations = function () {
  return this.allRegulations;
};

ConversationSchema.methods.getRegulationByIndex = function (regulationIndex) {
  const regulations = this.allRegulations;
  return regulations[regulationIndex] || null;
};

ConversationSchema.methods.archive = function () {
  // Check if already archived to avoid redundant operations
  if (this.metadata?.isArchived === true) {
    console.log(`⭐️ Conversation ${this._id} already archived, skipping`);
    return Promise.resolve(this); // Return resolved promise without save
  }

  console.log(`📦 Archiving conversation: ${this._id} - "${this.title}"`);
  this.metadata.isArchived = true;
  this.markModified('metadata');
  return this.save();
};

ConversationSchema.methods.unarchive = function () {
  // Check if already unarchived
  if (this.metadata?.isArchived !== true) {
    console.log(`⭐️ Conversation ${this._id} already active, skipping unarchive`);
    return Promise.resolve(this);
  }

  console.log(`📂 Unarchiving conversation: ${this._id} - "${this.title}"`);
  this.metadata.isArchived = false;
  this.markModified('metadata');
  return this.save();
};

// Method to get regulation statistics across all queries
ConversationSchema.methods.getRegulationStatistics = function () {
  const stats = {
    totalQueriesAsked: 0,
    codeTypeBreakdown: new Map(),
    buildingTypeBreakdown: new Map(),
    averageConfidence: 0,
    mostCommonCodeType: null,
    mostCommonBuildingType: null
  };

  const regulations = this.allRegulations;
  if (regulations.length === 0) return stats;

  stats.totalQueriesAsked = regulations.length;

  let totalConfidence = 0;
  let confidenceCount = 0;

  regulations.forEach(regulationItem => {
    const regulation = regulationItem.regulation;

    // Track confidence
    if (regulation.confidence !== null && regulation.confidence !== undefined) {
      totalConfidence += regulation.confidence;
      confidenceCount++;
    }

    // Track code types and building types
    if (regulation.queryMetadata) {
      const { codeType, buildingType } = regulation.queryMetadata;

      if (codeType && codeType !== 'general') {
        const currentCount = stats.codeTypeBreakdown.get(codeType) || 0;
        stats.codeTypeBreakdown.set(codeType, currentCount + 1);
      }

      if (buildingType && buildingType !== 'general') {
        const currentCount = stats.buildingTypeBreakdown.get(buildingType) || 0;
        stats.buildingTypeBreakdown.set(buildingType, currentCount + 1);
      }
    }
  });

  stats.averageConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;

  // Find most common code type
  let maxCodeCount = 0;
  let mostCommonCode = null;
  for (const [codeType, count] of stats.codeTypeBreakdown) {
    if (count > maxCodeCount) {
      maxCodeCount = count;
      mostCommonCode = codeType;
    }
  }
  stats.mostCommonCodeType = mostCommonCode;

  // Find most common building type
  let maxBuildingCount = 0;
  let mostCommonBuilding = null;
  for (const [buildingType, count] of stats.buildingTypeBreakdown) {
    if (count > maxBuildingCount) {
      maxBuildingCount = count;
      mostCommonBuilding = buildingType;
    }
  }
  stats.mostCommonBuildingType = mostCommonBuilding;

  return stats;
};

// Static methods
ConversationSchema.statics.findByUserId = function (userId, options = {}) {
  const query = {
    userId,
    'metadata.isArchived': { $ne: true }
  };

  return this.find(query)
    .sort({ updatedAt: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

ConversationSchema.statics.findActiveByUserId = function (userId) {
  return this.findByUserId(userId, { limit: 1 });
};

ConversationSchema.statics.createNew = function (userId, title = 'New Regulation Query') {
  return this.create({
    userId,
    title,
    messages: [],
    metadata: {
      totalQueries: 0,
      isArchived: false,
      tags: [],
      focusAreas: new Map(),
      buildingTypes: [],
      occupancyGroups: [],
      codeTypes: []
    }
  });
};

// Pre-save middleware
ConversationSchema.pre('save', function (next) {
  try {
    // Update the updatedAt timestamp when messages are modified
    if (this.isModified('messages')) {
      this.set({ updatedAt: new Date() });
      console.log('📅 Conversation messages modified, updating timestamp');
    }
    next();
  } catch (error) {
    console.error('❌ Error in pre-save middleware:', error);
    next(error);
  }
});

// Create the model
let ConversationModel;

try {
  // Try to get existing model
  ConversationModel = mongoose.model('Conversation');
  console.log('✅ Using existing Conversation model');
} catch (error) {
  // Create new model if it doesn't exist
  ConversationModel = mongoose.model('Conversation', ConversationSchema);
  console.log('✅ Created new Conversation model');
}

export default ConversationModel;