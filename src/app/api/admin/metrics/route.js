// src/app/api/admin/metrics/route.js - FIXED: Time-Range Filtering for ALL Engagement Metrics
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/models/User';
import Conversation from '@/models/Conversation';

// Helper function to get authenticated user (JWT-based)
async function getAuthenticatedUser() {
  try {
    const headersList = headers();
    const authorization = headersList.get('authorization');

    if (!authorization || !authorization.startsWith('Bearer ')) {
      return null;
    }

    const token = authorization.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    await connectToDatabase();
    const userId = decoded.userId || decoded.id;
    const user = await User.findById(userId);

    return user ? { id: user._id, email: user.email, name: user.name } : null;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}


/**
 * Fetches real uptime percentage from UptimeRobot API
 * @returns {Promise<number>} Uptime percentage (e.g., 99.876)
 */
async function getUptimeFromUptimeRobot() {
  try {
    const API_KEY = process.env.UPTIMEROBOT_API_KEY;
    
    // Check if API key is configured
    if (!API_KEY) {
      console.warn('⚠️ UPTIMEROBOT_API_KEY not found in environment variables');
      console.warn('⚠️ Using default uptime value of 99.9%');
      return 99.9;
    }

    console.log('🔄 Fetching uptime from UptimeRobot API...');

    // Call UptimeRobot API
    const response = await fetch('https://api.uptimerobot.com/v2/getMonitors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        api_key: API_KEY,
        format: 'json',
        custom_uptime_ratios: '30', // Last 30 days uptime
        logs: 0 // Don't need detailed logs
      })
    });

    // Check if request was successful
    if (!response.ok) {
      throw new Error(`UptimeRobot API returned status ${response.status}`);
    }

    const data = await response.json();

    // Validate response structure
    if (data.stat !== 'ok') {
      console.error('❌ UptimeRobot API error:', data.error);
      return 99.9; // Fallback
    }

    // Check if monitors exist
    if (!data.monitors || data.monitors.length === 0) {
      console.warn('⚠️ No monitors found in UptimeRobot account');
      console.warn('⚠️ Please create a monitor at https://uptimerobot.com');
      return 99.9; // Fallback
    }

    // Get the first monitor (your API endpoint)
    const monitor = data.monitors[0];
    const uptimeRatio = monitor.custom_uptime_ratio;
    
    // Log success
    console.log('✅ UptimeRobot uptime fetched successfully:', uptimeRatio + '%');
    console.log('   Monitor:', monitor.friendly_name);
    console.log('   Status:', monitor.status === 2 ? 'UP' : 'DOWN');
    
    return parseFloat(uptimeRatio);

  } catch (error) {
    // Log error but don't crash the API
    console.error('❌ Error fetching UptimeRobot data:', error.message);
    console.warn('⚠️ Falling back to default uptime value of 99.9%');
    return 99.9; // Fallback to default on error
  }
}
// Helper function to calculate date range
function getDateRange(timeRange, customFrom = null, customTo = null) {
  const now = new Date();
  let startDate, endDate;

  if (timeRange === 'custom' && customFrom && customTo) {
    startDate = new Date(customFrom);
    endDate = new Date(customTo);
    endDate.setHours(23, 59, 59, 999);
  } else {
    endDate = now;
    
    switch (timeRange) {
      case 'day':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
    }
  }

  return { startDate, endDate };
}

export async function GET(request) {
  try {
    console.log('📊 Enhanced Admin metrics API called');

    // Authenticate user
    const currentUser = await getAuthenticatedUser();

    if (!currentUser) {
      console.log('❌ User not authenticated');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', currentUser.email);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || 'month';
    const customFrom = searchParams.get('customFrom');
    const customTo = searchParams.get('customTo');

    console.log('📅 Time range parameters:', { timeRange, customFrom, customTo });

    // Connect to database
    await connectToDatabase();

    // Calculate date range
    const { startDate, endDate } = getDateRange(timeRange, customFrom, customTo);

    console.log('📅 Calculated date range:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    // ========== ENGAGEMENT & RETENTION METRICS (TIME-RANGE FILTERED) ==========
    
    // Total users (active)
    const totalUsers = await User.countDocuments({ isDeleted: { $ne: true } });
    
    // Active users in time range (users who logged in during selected period)
    const activeUsersInRange = await User.countDocuments({
      isDeleted: { $ne: true },
      lastLogin: { $gte: startDate, $lte: endDate }
    });

    // User sign-ups (NEW REGISTRATIONS) for OVERVIEW tab - still use fixed periods
    const dayAgo = new Date();
    dayAgo.setDate(dayAgo.getDate() - 1);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const yearAgo = new Date();
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);

    // 🆕 USER SIGN-UPS (New Registrations - based on createdAt)
    const signUpsToday = await User.countDocuments({
      isDeleted: { $ne: true },
      createdAt: { $gte: dayAgo }
    });

    const signUpsThisWeek = await User.countDocuments({
      isDeleted: { $ne: true },
      createdAt: { $gte: weekAgo }
    });

    const signUpsThisMonth = await User.countDocuments({
      isDeleted: { $ne: true },
      createdAt: { $gte: monthAgo }
    });

    const signUpsThisYear = await User.countDocuments({
      isDeleted: { $ne: true },
      createdAt: { $gte: yearAgo }
    });

    // USER LOG-INS (Login Activity - based on lastLogin)
    const logInsToday = await User.countDocuments({
      isDeleted: { $ne: true },
      lastLogin: { $gte: dayAgo }
    });

    const logInsThisWeek = await User.countDocuments({
      isDeleted: { $ne: true },
      lastLogin: { $gte: weekAgo }
    });

    const logInsThisMonth = await User.countDocuments({
      isDeleted: { $ne: true },
      lastLogin: { $gte: monthAgo }
    });

    const logInsThisYear = await User.countDocuments({
      isDeleted: { $ne: true },
      lastLogin: { $gte: yearAgo }
    });

    // ========== 🔧 FIXED: USER RETENTION RATE (TIME-RANGE FILTERED) ==========
    // Calculate retention ONLY for users created in the selected time range
    const usersCreatedInRange = await User.find({ 
      isDeleted: { $ne: true },
      createdAt: { $gte: startDate, $lte: endDate }
    }).select('createdAt lastLogin').lean();

    let returnedUsers = 0;
    let newUsersInRange = 0;
    let returningUsersInRange = 0;

    for (const user of usersCreatedInRange) {
      // Check if user returned (lastLogin is different from createdAt by more than 1 hour)
      if (user.lastLogin && user.createdAt) {
        const timeDiff = Math.abs(new Date(user.lastLogin) - new Date(user.createdAt));
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        if (hoursDiff > 1) {
          returnedUsers++;
        }
      }

      // Count as new user (created in range)
      newUsersInRange++;
    }

    // Also count returning users (created before range, logged in during range)
    const returningUsers = await User.countDocuments({
      isDeleted: { $ne: true },
      createdAt: { $lt: startDate },
      lastLogin: { $gte: startDate, $lte: endDate }
    });
    returningUsersInRange = returningUsers;

    const retentionRate = usersCreatedInRange.length > 0 
      ? (returnedUsers / usersCreatedInRange.length) * 100 
      : 0;

    console.log('📊 Retention Rate:', {
      usersCreatedInRange: usersCreatedInRange.length,
      returnedUsers,
      retentionRate: retentionRate.toFixed(2) + '%'
    });

    // ========== 🔧 FIXED: SESSION FREQUENCY (TIME-RANGE FILTERED) ==========
    // Calculate average days between sessions for users active in selected range
    const activeUsersData = await User.find({
      isDeleted: { $ne: true },
      lastLogin: { $gte: startDate, $lte: endDate }
    }).select('createdAt lastLogin').lean();

    let totalDaysBetweenSessions = 0;
    let usersWithMultipleSessions = 0;

    for (const user of activeUsersData) {
      if (user.lastLogin && user.createdAt) {
        const daysSinceCreation = Math.abs(new Date(user.lastLogin) - new Date(user.createdAt)) / (1000 * 60 * 60 * 24);
        if (daysSinceCreation > 1) {
          totalDaysBetweenSessions += daysSinceCreation;
          usersWithMultipleSessions++;
        }
      }
    }

    const avgDaysBetweenSessions = usersWithMultipleSessions > 0 
      ? totalDaysBetweenSessions / usersWithMultipleSessions 
      : 0;

    console.log('📊 Session Frequency:', {
      activeUsersInRange: activeUsersData.length,
      usersWithMultipleSessions,
      avgDays: avgDaysBetweenSessions.toFixed(1)
    });

    // ========== 🔧 FIXED: CHURN RATE (TIME-RANGE AWARE) ==========
    // Users who were active BEFORE the range but NOT active DURING the range
    const usersActiveBeforeRange = await User.countDocuments({
      isDeleted: { $ne: true },
      createdAt: { $lt: startDate }
    });

    const usersActiveBeforeButNotDuring = await User.countDocuments({
      isDeleted: { $ne: true },
      createdAt: { $lt: startDate },
      $or: [
        { lastLogin: { $exists: false } },
        { lastLogin: null },
        { lastLogin: { $lt: startDate } }
      ]
    });

    const churnRate = usersActiveBeforeRange > 0 
      ? (usersActiveBeforeButNotDuring / usersActiveBeforeRange) * 100 
      : 0;

    console.log('📊 Churn Rate:', {
      usersActiveBeforeRange,
      usersChurned: usersActiveBeforeButNotDuring,
      churnRate: churnRate.toFixed(2) + '%'
    });

    // ========== 🔧 FIXED: DAU/WAU/MAU (RELATIVE TO END DATE) ==========
    // Calculate DAU/WAU/MAU relative to the END of the selected range
    
    // Calculate periods relative to endDate
    const oneDayBeforeEnd = new Date(endDate);
    oneDayBeforeEnd.setDate(endDate.getDate() - 1);
    
    const sevenDaysBeforeEnd = new Date(endDate);
    sevenDaysBeforeEnd.setDate(endDate.getDate() - 7);
    
    const thirtyDaysBeforeEnd = new Date(endDate);
    thirtyDaysBeforeEnd.setDate(endDate.getDate() - 30);

    const dau = await User.countDocuments({
      isDeleted: { $ne: true },
      lastLogin: { $gte: oneDayBeforeEnd, $lte: endDate }
    });

    const wau = await User.countDocuments({
      isDeleted: { $ne: true },
      lastLogin: { $gte: sevenDaysBeforeEnd, $lte: endDate }
    });

    const mau = await User.countDocuments({
      isDeleted: { $ne: true },
      lastLogin: { $gte: thirtyDaysBeforeEnd, $lte: endDate }
    });

    console.log('📊 Active Users (relative to endDate):', {
      endDate: endDate.toISOString(),
      dau,
      wau,
      mau
    });

    // ========== QUERY ANALYSIS METRICS ==========

    // Get all conversations in date range
    const conversationsInRange = await Conversation.find({
      'metadata.isArchived': { $ne: true },
      updatedAt: { $gte: startDate, $lte: endDate }
    }).lean();

    // Initialize counters
    let totalMessages = 0;
    let totalRegulationMessages = 0;
    let totalConfidence = 0;
    let totalResponseTime = 0;
    let helpfulCount = 0;
    let unhelpfulCount = 0;
    const regionCounts = { India: 0, Scotland: 0, Dubai: 0 };
    
    // 🆕 Track unique users per region (for "Region Usage by Users")
    const regionUserSets = { 
      India: new Set(), 
      Scotland: new Set(), 
      Dubai: new Set() 
    };
    
    // 🆕 Query Type Distribution
    const queryTypeDistribution = {
      building_codes: 0,
      not_available: 0,
      out_of_scope: 0,
      identity: 0,
      unknown: 0
    };

    // 🆕 Failed Queries
    let failedQueries = 0;

    // 🆕 Follow-up Questions Rate
    let conversationsWithFollowups = 0;

    // 🆕 Professional Use Cases
    const buildingTypeCounts = {};

    // 🆕 Edit/Regenerate Usage
    let totalEdits = 0;

    // Loop through conversations
    let totalConversationLength = 0;

    for (const conv of conversationsInRange) {
      if (!conv.messages || conv.messages.length === 0) continue;

      totalMessages += conv.messages.length;
      totalConversationLength += conv.messages.length;

      // Track region counts (by conversations/queries)
      if (conv.region && regionCounts.hasOwnProperty(conv.region)) {
        regionCounts[conv.region]++;
      }

      // 🆕 Track unique users per region
      if (conv.region && conv.userId && regionUserSets.hasOwnProperty(conv.region)) {
        regionUserSets[conv.region].add(conv.userId.toString());
      }

      // Track follow-up conversations (>2 messages = multi-turn)
      if (conv.messages.length > 2) {
        conversationsWithFollowups++;
      }

      // Process each message
      for (const msg of conv.messages) {
        // Track edits
        if (msg.isEdited === true) {
          totalEdits++;
        }

        // Track regulation messages (AI responses)
        if (msg.role === 'assistant' && msg.regulation) {
          totalRegulationMessages++;

          // Track confidence
          if (msg.regulation.confidence !== null && msg.regulation.confidence !== undefined) {
            totalConfidence += msg.regulation.confidence;
          }

          // Track response time
          if (msg.regulation.processingTime !== null && msg.regulation.processingTime !== undefined) {
            totalResponseTime += msg.regulation.processingTime;
          }

          // 🆕 Track query types
          const queryType = msg.regulation.query_type || 'unknown';
          if (queryTypeDistribution.hasOwnProperty(queryType)) {
            queryTypeDistribution[queryType]++;
          } else {
            queryTypeDistribution.unknown++;
          }

          // 🆕 Track failed queries
          if (queryType === 'not_available' || queryType === 'out_of_scope') {
            failedQueries++;
          }

          // 🆕 Track building types
          if (msg.regulation.queryMetadata && msg.regulation.queryMetadata.buildingType) {
            const buildingType = msg.regulation.queryMetadata.buildingType;
            buildingTypeCounts[buildingType] = (buildingTypeCounts[buildingType] || 0) + 1;
          }
        }

        // Track feedback (user votes)
        if (msg.feedback && msg.feedback.userVote) {
          if (msg.feedback.userVote === 'helpful') {
            helpfulCount++;
          } else if (msg.feedback.userVote === 'unhelpful') {
            unhelpfulCount++;
          }
        }
      }
    }

    // Calculate averages
    const avgMessagesPerUser = activeUsersInRange > 0 ? totalMessages / activeUsersInRange : 0;
    const avgConfidence = totalRegulationMessages > 0 ? totalConfidence / totalRegulationMessages : 0;
    const avgResponseTime = totalRegulationMessages > 0 ? totalResponseTime / totalRegulationMessages : 0;
    const avgConversationLength = conversationsInRange.length > 0 ? totalConversationLength / conversationsInRange.length : 0;

    // Calculate follow-up rate
    const followUpRate = conversationsInRange.length > 0 
      ? (conversationsWithFollowups / conversationsInRange.length) * 100 
      : 0;

    // Calculate feedback metrics
    const totalVotes = helpfulCount + unhelpfulCount;
    const helpfulRate = totalVotes > 0 ? (helpfulCount / totalVotes) * 100 : 0;

    // Calculate region usage percentages (by queries)
    const totalRegionQueries = regionCounts.India + regionCounts.Scotland + regionCounts.Dubai;
    const regionUsage = [
      {
        region: 'India',
        queries: regionCounts.India,
        percentage: totalRegionQueries > 0 ? (regionCounts.India / totalRegionQueries) * 100 : 0
      },
      {
        region: 'Scotland',
        queries: regionCounts.Scotland,
        percentage: totalRegionQueries > 0 ? (regionCounts.Scotland / totalRegionQueries) * 100 : 0
      },
      {
        region: 'Dubai',
        queries: regionCounts.Dubai,
        percentage: totalRegionQueries > 0 ? (regionCounts.Dubai / totalRegionQueries) * 100 : 0
      }
    ];

    // 🆕 Calculate region usage by unique users
    const totalRegionUsers = regionUserSets.India.size + regionUserSets.Scotland.size + regionUserSets.Dubai.size;
    const regionUsageByUsers = [
      {
        region: 'India',
        users: regionUserSets.India.size,
        percentage: totalRegionUsers > 0 ? (regionUserSets.India.size / totalRegionUsers) * 100 : 0
      },
      {
        region: 'Scotland',
        users: regionUserSets.Scotland.size,
        percentage: totalRegionUsers > 0 ? (regionUserSets.Scotland.size / totalRegionUsers) * 100 : 0
      },
      {
        region: 'Dubai',
        users: regionUserSets.Dubai.size,
        percentage: totalRegionUsers > 0 ? (regionUserSets.Dubai.size / totalRegionUsers) * 100 : 0
      }
    ];

    // ========== FEATURE USAGE METRICS ==========

    // Theme usage (Dark Mode vs Light Mode)
    const darkModeUsers = await User.countDocuments({
      isDeleted: { $ne: true },
      'preferences.theme': 'dark'
    });

    const lightModeUsers = await User.countDocuments({
      isDeleted: { $ne: true },
      'preferences.theme': 'light'
    });

    const totalThemeUsers = darkModeUsers + lightModeUsers;

    const themeUsage = {
      dark: darkModeUsers,
      light: lightModeUsers,
      darkPercentage: totalThemeUsers > 0 ? (darkModeUsers / totalThemeUsers) * 100 : 0,
      lightPercentage: totalThemeUsers > 0 ? (lightModeUsers / totalThemeUsers) * 100 : 0
    };

    // Region selection patterns (user profiles)
    const usersByRegion = await User.aggregate([
      {
        $match: {
          isDeleted: { $ne: true },
          'profile.primaryJurisdiction': { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$profile.primaryJurisdiction',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Convert usersByRegion array to simple object format
    const regionSelectionObject = {};
    usersByRegion.forEach(item => {
      regionSelectionObject[item._id] = item.count;
    });

    // ========== PERFORMANCE METRICS ==========

    // Error rate (queries with errors)
    const errorRate = totalRegulationMessages > 0 
      ? (failedQueries / totalRegulationMessages) * 100 
      : 0;

    // Uptime from UptimeRobot (real monitoring)
    const uptime = await getUptimeFromUptimeRobot();

    // Peak usage hours analysis
    const peakUsageData = Array(24).fill(0);
    let peakHour = 0;
    let maxQueries = 0;

    for (const conv of conversationsInRange) {
      if (conv.createdAt) {
        const hour = new Date(conv.createdAt).getHours();
        peakUsageData[hour]++;
        
        if (peakUsageData[hour] > maxQueries) {
          maxQueries = peakUsageData[hour];
          peakHour = hour;
        }
      }
    }

    // Professional use cases (building types)
    const professionalUseCases = Object.entries(buildingTypeCounts)
      .map(([type, count]) => ({
        buildingType: type,
        queries: count,
        percentage: totalRegulationMessages > 0 ? (count / totalRegulationMessages) * 100 : 0
      }))
      .sort((a, b) => b.queries - a.queries);

    // ========== BUILD RESPONSE ==========

    const metricsData = {
      // 🆕 User Sign-ups (New Registrations - based on createdAt)
      userSignUps: {
        today: signUpsToday,
        thisWeek: signUpsThisWeek,
        thisMonth: signUpsThisMonth,
        thisYear: signUpsThisYear,
        trend: '+0%'
      },

      // User Log-ins (Login Activity - based on lastLogin)
      userLogIns: {
        today: logInsToday,
        thisWeek: logInsThisWeek,
        thisMonth: logInsThisMonth,
        thisYear: logInsThisYear,
        trend: '+0%'
      },
      
      // 🔧 FIXED: All engagement metrics now time-range filtered
      engagement: {
        dau,
        wau,
        mau,
        retentionRate: parseFloat(retentionRate.toFixed(2)),
        sessionFrequency: parseFloat(avgDaysBetweenSessions.toFixed(1)),
        churnRate: parseFloat(churnRate.toFixed(2)),
        newUsers: newUsersInRange,
        returningUsers: returningUsersInRange,
        trend: '+0%'
      },

      // Messages
      messages: {
        total: totalMessages,
        avgPerDay: Math.round(totalMessages / Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)))),
        avgPerWeek: Math.round(totalMessages / Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 7)))),
        avgPerMonth: Math.round(totalMessages / Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 30)))),
        avgPerYear: Math.round(totalMessages / Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 365)))),
        trend: '+0%'
      },

      messagesPerUser: {
        avgPerDay: parseFloat((avgMessagesPerUser / Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)))).toFixed(1)),
        avgPerWeek: parseFloat((avgMessagesPerUser / Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 7)))).toFixed(1)),
        avgPerMonth: parseFloat((avgMessagesPerUser / Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 30)))).toFixed(1)),
        avgPerYear: parseFloat((avgMessagesPerUser / Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 365)))).toFixed(1)),
        trend: '+0%'
      },

      // Query Analysis
      queryAnalysis: {
        queryTypeDistribution,
        failedQueries,
        failedQueryRate: totalRegulationMessages > 0 ? parseFloat((failedQueries / totalRegulationMessages * 100).toFixed(2)) : 0,
        followUpRate: parseFloat(followUpRate.toFixed(2)),
        avgConversationLength: parseFloat(avgConversationLength.toFixed(1))
      },

      // Feature Usage
      featureUsage: {
        edits: totalEdits,
        editRate: totalMessages > 0 ? parseFloat((totalEdits / totalMessages * 100).toFixed(2)) : 0,
        themeUsage,
        regionSelection: regionSelectionObject
      },

      // Feedback
      feedback: {
        helpful: helpfulCount,
        unhelpful: unhelpfulCount,
        helpfulRate: parseFloat(helpfulRate.toFixed(1)),
        avgHelpfulPerDay: Math.round(helpfulCount / Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)))),
        avgHelpfulPerMonth: Math.round(helpfulCount / Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 30)))),
        avgHelpfulPerYear: Math.round(helpfulCount / Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 365)))),
        avgUnhelpfulPerDay: parseFloat((unhelpfulCount / Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)))).toFixed(1)),
        avgUnhelpfulPerMonth: Math.round(unhelpfulCount / Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 30)))),
        avgUnhelpfulPerYear: Math.round(unhelpfulCount / Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 365)))),
        trend: '+0%'
      },

      // Region Usage (by queries)
      regionUsage,
      
      // 🆕 Region Usage (by unique users)
      regionUsageByUsers,

      // Active Users
      activeUsers: {
        dau,
        wau,
        mau,
        trend: '+0%'
      },

      // Peak Usage Hours
      peakUsageHours: {
        peakHour,
        peakHourLabel: `${peakHour}:00`,
        hourlyData: peakUsageData
      },

      // Professional Use Cases
      professionalUseCases,

      // Technical Performance
      technicalPerformance: {
        avgResponseTime: parseFloat(avgResponseTime.toFixed(2)),
        errorRate: parseFloat(errorRate.toFixed(2)),
        uptime: parseFloat(uptime.toFixed(3))
      },

      // Metadata
      metadata: {
        timeRange,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalUsers,
        activeUsersInRange,
        avgConfidence: parseFloat(avgConfidence.toFixed(3)),
        avgResponseTime: parseFloat(avgResponseTime.toFixed(2))
      }
    };

    console.log('✅ Enhanced metrics calculated successfully (TIME-RANGE FILTERED)');

    return NextResponse.json(metricsData);

  } catch (error) {
    console.error('❌ Enhanced admin metrics API error:', error);

    return NextResponse.json(
      { 
        error: 'An error occurred while fetching metrics',
        details: error.message 
      },
      { status: 500 }
    );
  }
}