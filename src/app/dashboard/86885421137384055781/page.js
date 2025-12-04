// src/app/dashboard/7384055781/page.js - ENHANCED User Metrics Dashboard
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function EnhancedUserMetricsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [timeRange, setTimeRange] = useState('month');
  const [isLoading, setIsLoading] = useState(true);
  const [metricsData, setMetricsData] = useState(null);
  const [error, setError] = useState(null);
  
  // Custom date range state
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [isCustomRange, setIsCustomRange] = useState(false);

  // Query log state
  const [queriesData, setQueriesData] = useState(null);
  const [queriesLoading, setQueriesLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const queriesPerPage = 20;

  // Tooltip state for engagement metrics
  const [activeTooltip, setActiveTooltip] = useState(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [feedbackFilter, setFeedbackFilter] = useState('all');
  const [responseTimeFilter, setResponseTimeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Applied filters state
  const [appliedFilters, setAppliedFilters] = useState({
    searchTerm: '',
    regionFilter: 'all',
    feedbackFilter: 'all',
    responseTimeFilter: 'all',
    dateFrom: '',
    dateTo: ''
  });

  // Quick date filter state
  const [activeQuickFilter, setActiveQuickFilter] = useState(null);

  // Sorting state
  const [sortColumn, setSortColumn] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');

  // Tab state for new sections
  const [activeTab, setActiveTab] = useState('overview'); // overview, engagement, query-analysis, features, performance


  // Tooltip definitions for engagement metrics
  const tooltipData = {
    retention: {
      title: "User Retention Rate",
      description: "Percentage of new users who came back for a second visit.",
      formula: "Retention Rate = (Users who returned / Total new users) × 100",
      example: "If 4 users signed up and 3 came back → 75% retention",
      goal: "Higher is better (aim for 60-80%)"
    },
    sessionFrequency: {
      title: "Session Frequency",
      description: "Average number of days between user sessions (how often users return).",
      formula: "Session Frequency = Average days between logins for active users",
      example: "User logs in every 5 days → Session frequency is 5.0 days",
      goal: "Lower is better (aim for 3-7 days)"
    },
    churn: {
      title: "Churn Rate",
      description: "Percentage of users who stopped using your app (became inactive).",
      formula: "Churn Rate = (Users active before period but NOT during / Users active before) × 100",
      example: "5 old users, 2 stopped using → 40% churn rate",
      goal: "Lower is better (aim for under 20%)"
    },
    newReturning: {
      title: "New vs Returning Users",
      description: "Comparison of brand new users versus existing users who logged in.",
      formula: "New: Created account in period | Returning: Created before, logged in during period",
      example: "4 users signed up + 3 old users logged in → 4 / 3",
      goal: "Balanced mix shows healthy growth + retention"
    },
    activeUsers: {
      title: "Active Users",
      description: "Number of users who used the app during the selected time range.",
      formula: "Day: DAU (1 day) | Week: WAU (7 days) | Month: MAU (30 days) | Year: YAU (365 days)",
      example: "5 users logged in this month → MAU = 5",
      goal: "Growing trend indicates healthy engagement"
    },
    // TAB 1: OVERVIEW metrics
    userSignups: {
      title: "User Sign-ups",
      description: "Number of new user accounts created (registrations) in the selected time period.",
      formula: "Count of users where createdAt falls within the selected time range",
      example: "4 users registered this month → User Sign-ups = 4",
      goal: "Growing trend shows successful user acquisition"
    },
    userLogins: {
      title: "User Log-ins",
      description: "Number of login events (user authentication) in the selected time period.",
      formula: "Count of login events (lastLogin) within the selected time range",
      example: "8 login sessions this week → User Log-ins = 8",
      goal: "Higher than sign-ups shows existing users are active"
    },
    totalMessages: {
      title: "Total Messages",
      description: "Cumulative count of all queries/conversations ever submitted by all users.",
      formula: "Total count of all conversation documents in database",
      example: "Users have submitted 150 total queries → Total Messages = 150",
      goal: "Steady growth indicates ongoing platform usage"
    },
    responseFeedback: {
      title: "Response Feedback",
      description: "User satisfaction ratings showing helpful vs unhelpful responses.",
      formula: "Success Rate = (Helpful / (Helpful + Unhelpful)) × 100",
      example: "3 helpful, 1 unhelpful → 75% success rate",
      goal: "Higher is better (aim for 70%+ success rate)"
    },
    messagesPerUser: {
      title: "Messages Per User",
      description: "Average number of queries submitted per user in the selected time period.",
      formula: "Messages Per User = Total messages in period / Active users in period",
      example: "10 messages from 4 users → 2.5 messages per user",
      goal: "Higher indicates more engaged users (aim for 3+ per month)"
    },
    regionUsage: {
      title: "Region Usage",
      description: "Geographic distribution showing which regions generate the most activity.",
      formula: "Percentage = (Region activity / Total activity) × 100",
      example: "45 India queries out of 100 total → India 45%",
      goal: "Understand geographic reach and focus expansion efforts"
    },
    regionUsageByQueries: {
      title: "Region Usage by Queries",
      description: "Shows which regions (India, Scotland, Dubai) generate the most conversations/queries.",
      formula: "Percentage = (Region conversations / Total conversations) × 100",
      example: "60 India queries, 30 Scotland, 10 Dubai → India 60%, Scotland 30%, Dubai 10%",
      goal: "Identify which regions need more content or marketing focus"
    },
    regionUsageByUsers: {
      title: "Region Usage by Users",
      description: "Shows how many unique users are active in each region (India, Scotland, Dubai).",
      formula: "Percentage = (Unique users in region / Total unique users) × 100",
      example: "15 users in India, 8 in Scotland, 2 in Dubai → India 60%, Scotland 32%, Dubai 8%",
      goal: "Understand user distribution and regional growth opportunities"
    },
    // TAB 3: QUERY ANALYSIS metrics
    queryTypeDistribution: {
      title: "Query Type Distribution",
      description: "Breakdown of queries by how the AI classified them (successful vs failed vs out-of-scope).",
      formula: "Building Codes: Successfully answered | Not Available: Info not in database | Out of Scope: Unrelated questions | Identity: System questions",
      example: "50 building codes, 10 not available, 5 out of scope, 2 identity queries",
      goal: "Higher building_codes percentage shows better query quality (aim for 80%+)"
    },
    failedQueries: {
      title: "Failed Queries",
      description: "Number of queries that couldn't be answered (not_available + out_of_scope).",
      formula: "Failed Queries = not_available + out_of_scope | Failure Rate = (Failed / Total) × 100",
      example: "10 failed out of 100 queries → 10% failure rate",
      goal: "Lower is better (aim for under 15% failure rate)"
    },
    followUpRate: {
      title: "Follow-up Questions Rate",
      description: "Percentage of conversations with multiple back-and-forth messages (multi-turn conversations).",
      formula: "Follow-up Rate = (Conversations with >2 messages / Total conversations) × 100",
      example: "8 conversations, 5 have follow-ups → 62.5% follow-up rate",
      goal: "Higher indicates engaged users exploring topics deeply (aim for 50%+)"
    },
    professionalUseCases: {
      title: "Professional Use Cases",
      description: "Distribution of queries by building type (residential, commercial, industrial, etc.).",
      formula: "Tracked from query metadata | Percentage = (Building type queries / Total) × 100",
      example: "35 residential, 20 commercial, 15 industrial queries",
      goal: "Understand which building types need more content coverage"
    },
    avgConversationLength: {
      title: "Average Conversation Length",
      description: "Average number of messages (questions + answers) per conversation.",
      formula: "Avg Length = Total messages across all conversations / Number of conversations",
      example: "100 messages across 25 conversations → 4.0 avg length",
      goal: "Higher indicates deeper engagement (aim for 3.5+ messages per conversation)"
    },
    // TAB 4: FEATURES metrics
    editRegenerateUsage: {
      title: "Edit/Regenerate Usage",
      description: "Number of times users edited or regenerated AI responses (messages marked as isEdited).",
      formula: "Edit Rate = (Edited messages / Total messages) × 100",
      example: "12 edits out of 100 messages → 12% edit rate",
      goal: "Moderate rate (5-15%) shows users refining responses for accuracy"
    },
    darkModeUsers: {
      title: "Dark Mode Users",
      description: "Percentage of users who have dark theme enabled in their preferences.",
      formula: "Dark % = (Dark mode users / Total users with theme preference) × 100",
      example: "15 dark mode users out of 20 total → 75% dark mode",
      goal: "Higher percentage often preferred for developer/power users"
    },
    lightModeUsers: {
      title: "Light Mode Users",
      description: "Percentage of users who have light theme enabled in their preferences.",
      formula: "Light % = (Light mode users / Total users with theme preference) × 100",
      example: "5 light mode users out of 20 total → 25% light mode",
      goal: "Balanced theme distribution shows diverse user preferences"
    },
    themePreference: {
      title: "Theme Preference Distribution",
      description: "Visual comparison showing the split between dark mode and light mode users.",
      formula: "Bar width represents percentage of users for each theme",
      example: "75% dark mode users = 75% width dark bar, 25% light = 25% width light bar",
      goal: "Understand user interface preferences for design decisions"
    }
,
    // TAB 5: PERFORMANCE metrics
    apiResponseTime: {
      title: "API Response Time",
      description: "Average time taken by the AI to process and respond to building code queries.",
      formula: "Avg Response Time = Sum of all processing times / Total AI responses",
      example: "100 queries with 642 seconds total → 6.42s average response time",
      goal: "Lower is better (aim for under 3 seconds for good user experience)"
    },
    errorRate: {
      title: "Error Rate",
      description: "Percentage of queries that failed (couldn't be answered due to missing data or out-of-scope questions).",
      formula: "Error Rate = (Failed queries / Total queries) × 100 | Failed = 'not_available' + 'out_of_scope'",
      example: "10 failed queries out of 100 total → 10% error rate",
      goal: "Lower is better (aim for under 15% - indicates good content coverage)"
    },
    systemUptime: {
      title: "System Uptime",
      description: "Percentage of time the system has been operational and available to users.",
      formula: "Uptime % = (Total operational time / Total time period) × 100",
      example: "System down 1 hour in a month (720 hours) → 99.86% uptime",
      goal: "Higher is better (aim for 99.9%+ for production systems)"
    },
    peakUsageHours: {
      title: "Peak Usage Hours",
      description: "24-hour breakdown showing when users are most active (helps optimize server resources and support coverage).",
      formula: "Count of conversations started during each hour (0-23)",
      example: "Hour 14 (2pm) has 25 queries, Hour 3 (3am) has 2 queries → Peak at 2pm",
      goal: "Identify peak hours for capacity planning and support scheduling"
    },
    overallStatus: {
      title: "Overall System Status",
      description: "综合 health indicator showing if all performance metrics are within acceptable ranges.",
      formula: "Healthy: Response time < 3s AND Error rate < 15% AND Uptime > 99% | Otherwise: Needs Attention",
      example: "All metrics good → 'Healthy' | Any metric failing → 'Needs Attention'",
      goal: "Maintain 'Healthy' status by keeping all individual metrics within target ranges"
    }
  };
  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Fetch metrics data
  useEffect(() => {
    if (!user) return;
    
    const loadMetrics = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
          throw new Error('No authentication token found');
        }

        const params = new URLSearchParams({
          timeRange: timeRange === 'custom' ? 'custom' : timeRange
        });

        if (timeRange === 'custom' && customDateFrom && customDateTo) {
          params.append('customFrom', customDateFrom);
          params.append('customTo', customDateTo);
        }

        const response = await fetch(`/api/admin/metrics?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch metrics: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📊 Enhanced metrics data received:', data);
        setMetricsData(data);
        
      } catch (err) {
        console.error('❌ Error loading metrics:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMetrics();
  }, [timeRange, customDateFrom, customDateTo, user]);

  // Fetch queries data
  useEffect(() => {
    if (!user) return;
    
    const loadQueries = async () => {
      setQueriesLoading(true);
      
      try {
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
          throw new Error('No authentication token found');
        }

        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: queriesPerPage.toString()
        });

        if (appliedFilters.searchTerm) {
          params.append('search', appliedFilters.searchTerm);
        }
        if (appliedFilters.regionFilter !== 'all') {
          params.append('region', appliedFilters.regionFilter);
        }
        if (appliedFilters.feedbackFilter !== 'all') {
          params.append('feedback', appliedFilters.feedbackFilter);
        }
        if (appliedFilters.responseTimeFilter !== 'all') {
          params.append('responseTime', appliedFilters.responseTimeFilter);
        }
        if (appliedFilters.dateFrom) {
          params.append('dateFrom', appliedFilters.dateFrom);
        }
        if (appliedFilters.dateTo) {
          params.append('dateTo', appliedFilters.dateTo);
        }

        const response = await fetch(`/api/admin/queries?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch queries: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📋 Queries data received:', data);
        setQueriesData(data);
        
      } catch (err) {
        console.error('❌ Error loading queries:', err);
      } finally {
        setQueriesLoading(false);
      }
    };
    
    loadQueries();
  }, [currentPage, appliedFilters, user]);

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num?.toString() || '0';
  };

  const handleApplyCustomDates = () => {
    if (customDateFrom && customDateTo) {
      setIsCustomRange(true);
      setTimeRange('custom');
      setShowCustomDatePicker(false);
    }
  };

  const handleQuickDateFilter = (filter) => {
    const today = new Date();
    let from, to;

    switch (filter) {
      case 'today':
        from = new Date(today.setHours(0, 0, 0, 0));
        to = new Date();
        break;
      case 'last7days':
        from = new Date(today.setDate(today.getDate() - 7));
        to = new Date();
        break;
      case 'last30days':
        from = new Date(today.setDate(today.getDate() - 30));
        to = new Date();
        break;
      case 'thisMonth':
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        to = new Date();
        break;
    }

    setDateFrom(from.toISOString().split('T')[0]);
    setDateTo(to.toISOString().split('T')[0]);
    setActiveQuickFilter(filter);
  };

  const handleApplyFilters = () => {
    setAppliedFilters({
      searchTerm,
      regionFilter,
      feedbackFilter,
      responseTimeFilter,
      dateFrom,
      dateTo
    });
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setRegionFilter('all');
    setFeedbackFilter('all');
    setResponseTimeFilter('all');
    setDateFrom('');
    setDateTo('');
    setActiveQuickFilter(null);
    setAppliedFilters({
      searchTerm: '',
      regionFilter: 'all',
      feedbackFilter: 'all',
      responseTimeFilter: 'all',
      dateFrom: '',
      dateTo: ''
    });
    setCurrentPage(1);
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-GB', { month: 'short' });
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return `${day} ${month} ${year}, ${time}`;
  };

  const handleExportCSV = () => {
    if (!queriesData || !queriesData.queries || queriesData.queries.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = ['Timestamp', 'Query', 'Region', 'Feedback', 'Response Time'];
    const csvContent = [
      headers.join(','),
      ...queriesData.queries.map(query => [
        `"${formatDate(query.timestamp)}"`,
        `"${query.query.replace(/"/g, '""')}"`,
        query.region,
        query.feedback,
        `${query.responseTime}s`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `query-log-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (authLoading || !user) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            <h1 className={styles.pageTitle}>User Metrics Dashboard</h1>
            <p className={styles.pageSubtitle}>REG-GPT Analytics & User Engagement Insights</p>
          </div>
          <div className={styles.timeRangeSelectorWrapper}>
            <div className={styles.timeRangeSelector}>
              <button
                className={`${styles.timeRangeButton} ${timeRange === 'day' ? styles.active : ''}`}
                onClick={() => { setTimeRange('day'); setIsCustomRange(false); }}
              >
                Day
              </button>
              <button
                className={`${styles.timeRangeButton} ${timeRange === 'week' ? styles.active : ''}`}
                onClick={() => { setTimeRange('week'); setIsCustomRange(false); }}
              >
                Week
              </button>
              <button
                className={`${styles.timeRangeButton} ${timeRange === 'month' ? styles.active : ''}`}
                onClick={() => { setTimeRange('month'); setIsCustomRange(false); }}
              >
                Month
              </button>
              <button
                className={`${styles.timeRangeButton} ${timeRange === 'year' ? styles.active : ''}`}
                onClick={() => { setTimeRange('year'); setIsCustomRange(false); }}
              >
                Year
              </button>
              <button
                className={`${styles.calendarButton} ${showCustomDatePicker || isCustomRange ? styles.active : ''}`}
                onClick={() => setShowCustomDatePicker(!showCustomDatePicker)}
                title="Custom date range"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={styles.calendarIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            </div>

            {showCustomDatePicker && (
              <div className={styles.customDatePickerDropdown}>
                <div className={styles.customDatePickerHeader}>
                  <h4>Custom Date Range</h4>
                  <button className={styles.closeButton} onClick={() => setShowCustomDatePicker(false)}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className={styles.customDatePickerContent}>
                  <div className={styles.dateInputGroup}>
                    <label>From Date</label>
                    <input
                      type="date"
                      className={styles.customDateInput}
                      value={customDateFrom}
                      onChange={(e) => setCustomDateFrom(e.target.value)}
                    />
                  </div>
                  <div className={styles.dateInputGroup}>
                    <label>To Date</label>
                    <input
                      type="date"
                      className={styles.customDateInput}
                      value={customDateTo}
                      onChange={(e) => setCustomDateTo(e.target.value)}
                      min={customDateFrom}
                    />
                  </div>
                </div>
                <div className={styles.customDatePickerActions}>
                  <button className={styles.cancelButton} onClick={() => setShowCustomDatePicker(false)}>
                    Cancel
                  </button>
                  <button
                    className={styles.applyButton}
                    onClick={handleApplyCustomDates}
                    disabled={!customDateFrom || !customDateTo}
                  >
                    Apply Range
                  </button>
                </div>
              </div>
            )}

            {isCustomRange && customDateFrom && customDateTo && (
              <div className={styles.activeCustomRange}>
                <svg xmlns="http://www.w3.org/2000/svg" className={styles.infoIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Custom range: {new Date(customDateFrom).toLocaleDateString()} - {new Date(customDateTo).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabNavigation}>
        <button
          className={`${styles.tabButton} ${activeTab === 'overview' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 13a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />
          </svg>
          Overview
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'engagement' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('engagement')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Engagement
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'queries' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('queries')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Query Analysis
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'features' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('features')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Features
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'performance' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Performance
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading metrics...</p>
        </div>
      ) : error ? (
        <div className={styles.errorState}>
          <h3>Error Loading Metrics</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      ) : (
        <>
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <>
              {/* Top 3 Metrics Grid - User Sign-ups, User Log-ins, Total Messages */}
              <div className={styles.topMetricsGrid}>
                {/* User Sign-ups (New Registrations) */}
                <div className={styles.metricCard}>
                  <div 
                    className={styles.metricIcon} 
                    style={{ background: '#dbeafe', position: 'relative', cursor: 'help' }}
                    onMouseEnter={() => setActiveTooltip('userSignups')}
                    onMouseLeave={() => setActiveTooltip(null)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#3b82f6">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    {activeTooltip === 'userSignups' && (
                      <div className={styles.tooltip}>
                        <div className={styles.tooltipTitle}>{tooltipData.userSignups.title}</div>
                        <div className={styles.tooltipDescription}>{tooltipData.userSignups.description}</div>
                        <div className={styles.tooltipFormula}><strong>Formula:</strong> {tooltipData.userSignups.formula}</div>
                        <div className={styles.tooltipExample}><strong>Example:</strong> {tooltipData.userSignups.example}</div>
                        <div className={styles.tooltipGoal}><strong>Goal:</strong> {tooltipData.userSignups.goal}</div>
                      </div>
                    )}
                  </div>
                  <div className={styles.metricContent}>
                    <div className={styles.metricLabel}>User Sign-ups</div>
                    <div className={styles.metricValue}>
                      {formatNumber(
                        timeRange === 'day' ? metricsData?.userSignUps?.today :
                        timeRange === 'week' ? metricsData?.userSignUps?.thisWeek :
                        timeRange === 'month' ? metricsData?.userSignUps?.thisMonth :
                        metricsData?.userSignUps?.thisYear
                      )}
                    </div>
                    <div className={styles.metricFooter}>
                      <span className={styles.metricSubtext}>
                        Registered {timeRange === 'day' ? 'today' :
                         timeRange === 'week' ? 'this week' :
                         timeRange === 'month' ? 'this month' :
                         'this year'}
                      </span>
                      <span className={styles.trendBadge} style={{ color: '#059669' }}>
                        {metricsData?.userSignUps?.trend || '+0%'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* User Log-ins (Login Activity) */}
                <div className={styles.metricCard}>
                  <div 
                    className={styles.metricIcon} 
                    style={{ background: '#fce7f3', position: 'relative', cursor: 'help' }}
                    onMouseEnter={() => setActiveTooltip('userLogins')}
                    onMouseLeave={() => setActiveTooltip(null)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#ec4899">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    {activeTooltip === 'userLogins' && (
                      <div className={styles.tooltip}>
                        <div className={styles.tooltipTitle}>{tooltipData.userLogins.title}</div>
                        <div className={styles.tooltipDescription}>{tooltipData.userLogins.description}</div>
                        <div className={styles.tooltipFormula}><strong>Formula:</strong> {tooltipData.userLogins.formula}</div>
                        <div className={styles.tooltipExample}><strong>Example:</strong> {tooltipData.userLogins.example}</div>
                        <div className={styles.tooltipGoal}><strong>Goal:</strong> {tooltipData.userLogins.goal}</div>
                      </div>
                    )}
                  </div>
                  <div className={styles.metricContent}>
                    <div className={styles.metricLabel}>User Log-ins</div>
                    <div className={styles.metricValue}>
                      {formatNumber(
                        timeRange === 'day' ? metricsData?.userLogIns?.today :
                        timeRange === 'week' ? metricsData?.userLogIns?.thisWeek :
                        timeRange === 'month' ? metricsData?.userLogIns?.thisMonth :
                        metricsData?.userLogIns?.thisYear
                      )}
                    </div>
                    <div className={styles.metricFooter}>
                      <span className={styles.metricSubtext}>
                        Logged in {timeRange === 'day' ? 'today' :
                         timeRange === 'week' ? 'this week' :
                         timeRange === 'month' ? 'this month' :
                         'this year'}
                      </span>
                      <span className={styles.trendBadge} style={{ color: '#059669' }}>
                        {metricsData?.userLogIns?.trend || '+0%'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Total Messages */}
                <div className={styles.metricCard}>
                  <div 
                    className={styles.metricIcon} 
                    style={{ background: '#dcfce7', position: 'relative', cursor: 'help' }}
                    onMouseEnter={() => setActiveTooltip('totalMessages')}
                    onMouseLeave={() => setActiveTooltip(null)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#16a34a">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {activeTooltip === 'totalMessages' && (
                      <div className={styles.tooltip}>
                        <div className={styles.tooltipTitle}>{tooltipData.totalMessages.title}</div>
                        <div className={styles.tooltipDescription}>{tooltipData.totalMessages.description}</div>
                        <div className={styles.tooltipFormula}><strong>Formula:</strong> {tooltipData.totalMessages.formula}</div>
                        <div className={styles.tooltipExample}><strong>Example:</strong> {tooltipData.totalMessages.example}</div>
                        <div className={styles.tooltipGoal}><strong>Goal:</strong> {tooltipData.totalMessages.goal}</div>
                      </div>
                    )}
                  </div>
                  <div className={styles.metricContent}>
                    <div className={styles.metricLabel}>Total Messages</div>
                    <div className={styles.metricValue}>
                      {formatNumber(metricsData?.messages?.total)}
                    </div>
                    <div className={styles.metricFooter}>
                      <span className={styles.metricSubtext}>All-time queries</span>
                      <span className={styles.trendBadge} style={{ color: '#059669' }}>
                        {metricsData?.messages?.trend || '+0%'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom 2 Metrics Grid - Response Feedback, Messages Per User */}
              <div className={styles.bottomTwoGrid}>
                {/* Response Feedback Card - Compact Version */}
                <div className={styles.metricCard}>
                  <div 
                    className={styles.metricIcon} 
                    style={{ background: '#fef3c7', position: 'relative', cursor: 'help' }}
                    onMouseEnter={() => setActiveTooltip('responseFeedback')}
                    onMouseLeave={() => setActiveTooltip(null)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#f59e0b">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                    {activeTooltip === 'responseFeedback' && (
                      <div className={styles.tooltip}>
                        <div className={styles.tooltipTitle}>{tooltipData.responseFeedback.title}</div>
                        <div className={styles.tooltipDescription}>{tooltipData.responseFeedback.description}</div>
                        <div className={styles.tooltipFormula}><strong>Formula:</strong> {tooltipData.responseFeedback.formula}</div>
                        <div className={styles.tooltipExample}><strong>Example:</strong> {tooltipData.responseFeedback.example}</div>
                        <div className={styles.tooltipGoal}><strong>Goal:</strong> {tooltipData.responseFeedback.goal}</div>
                      </div>
                    )}
                  </div>
                  <div className={styles.metricContent}>
                    <div className={styles.metricLabel}>Response Feedback</div>
                    <div className={styles.metricValue}>
                      {(() => {
                        const helpful = metricsData?.feedback?.helpful || 0;
                        const unhelpful = metricsData?.feedback?.unhelpful || 0;
                        const total = helpful + unhelpful;
                        const successRate = total > 0 ? ((helpful / total) * 100).toFixed(1) : '0.0';
                        return `${successRate}%`;
                      })()}
                    </div>
                    <div className={styles.metricFooter}>
                      <span className={styles.metricSubtext}>
                        {formatNumber(metricsData?.feedback?.helpful || 0)} helpful / {formatNumber(metricsData?.feedback?.unhelpful || 0)} unhelpful
                      </span>
                      <span className={styles.trendBadge} style={{ color: '#059669' }}>
                        {metricsData?.feedback?.trend || '+0%'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Messages Per User */}
                <div className={styles.metricCard}>
                  <div 
                    className={styles.metricIcon} 
                    style={{ background: '#fed7aa', position: 'relative', cursor: 'help' }}
                    onMouseEnter={() => setActiveTooltip('messagesPerUser')}
                    onMouseLeave={() => setActiveTooltip(null)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#f59e0b">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {activeTooltip === 'messagesPerUser' && (
                      <div className={styles.tooltip}>
                        <div className={styles.tooltipTitle}>{tooltipData.messagesPerUser.title}</div>
                        <div className={styles.tooltipDescription}>{tooltipData.messagesPerUser.description}</div>
                        <div className={styles.tooltipFormula}><strong>Formula:</strong> {tooltipData.messagesPerUser.formula}</div>
                        <div className={styles.tooltipExample}><strong>Example:</strong> {tooltipData.messagesPerUser.example}</div>
                        <div className={styles.tooltipGoal}><strong>Goal:</strong> {tooltipData.messagesPerUser.goal}</div>
                      </div>
                    )}
                  </div>
                  <div className={styles.metricContent}>
                    <div className={styles.metricLabel}>Messages Per User</div>
                    <div className={styles.metricValue}>
                      {metricsData?.messagesPerUser?.[`avgPer${timeRange === 'day' ? 'Day' : timeRange === 'week' ? 'Week' : timeRange === 'month' ? 'Month' : 'Year'}`]?.toFixed(1) || '0'}
                    </div>
                    <div className={styles.metricFooter}>
                      <span className={styles.metricSubtext}>
                        Average per {timeRange === 'year' ? 'year' : timeRange}
                      </span>
                      <span className={styles.trendBadge} style={{ color: '#059669' }}>
                        {metricsData?.messagesPerUser?.trend || '+0%'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Region Usage Grid - Side by Side */}
              <div className={styles.regionUsageGrid}>
                  {/* Region Usage by Queries */}
                  <div className={styles.wideCard}>
                    <div className={styles.cardHeader}>
                      <div className={styles.cardHeaderLeft}>
                        <div 
                          className={styles.cardIcon} 
                          style={{ background: '#fce7f3', position: 'relative', cursor: 'help' }}
                          onMouseEnter={() => setActiveTooltip('regionUsageByQueries')}
                          onMouseLeave={() => setActiveTooltip(null)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#ec4899">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {activeTooltip === 'regionUsageByQueries' && (
                            <div className={styles.tooltip}>
                              <div className={styles.tooltipTitle}>{tooltipData.regionUsageByQueries.title}</div>
                              <div className={styles.tooltipDescription}>{tooltipData.regionUsageByQueries.description}</div>
                              <div className={styles.tooltipFormula}><strong>Formula:</strong> {tooltipData.regionUsageByQueries.formula}</div>
                              <div className={styles.tooltipExample}><strong>Example:</strong> {tooltipData.regionUsageByQueries.example}</div>
                              <div className={styles.tooltipGoal}><strong>Goal:</strong> {tooltipData.regionUsageByQueries.goal}</div>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className={styles.cardTitle}>Region Usage by Queries</div>
                          <div className={styles.cardSubtitle}>Number of conversations per region</div>
                        </div>
                      </div>
                    </div>
                    <div className={styles.regionList}>
                      {metricsData?.regionUsage?.map((region, index) => (
                        <div key={index} className={styles.regionItem}>
                          <div className={styles.regionHeader}>
                            <span className={styles.regionName}>{region.region}</span>
                            <span className={styles.regionCount}>{formatNumber(region.queries)}</span>
                          </div>
                          <div className={styles.regionBar}>
                            <div
                              className={styles.regionBarFill}
                              style={{
                                width: `${region.percentage}%`,
                                background: region.region === 'India' ? '#f59e0b' :
                                           region.region === 'Scotland' ? '#3b82f6' : '#ec4899'
                              }}
                            ></div>
                          </div>
                          <div className={styles.regionPercentage}>{region.percentage.toFixed(1)}% of queries</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Region Usage by Users */}
                  <div className={styles.wideCard}>
                    <div className={styles.cardHeader}>
                      <div className={styles.cardHeaderLeft}>
                        <div 
                          className={styles.cardIcon} 
                          style={{ background: '#dbeafe', position: 'relative', cursor: 'help' }}
                          onMouseEnter={() => setActiveTooltip('regionUsageByUsers')}
                          onMouseLeave={() => setActiveTooltip(null)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#3b82f6">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          {activeTooltip === 'regionUsageByUsers' && (
                            <div className={styles.tooltip}>
                              <div className={styles.tooltipTitle}>{tooltipData.regionUsageByUsers.title}</div>
                              <div className={styles.tooltipDescription}>{tooltipData.regionUsageByUsers.description}</div>
                              <div className={styles.tooltipFormula}><strong>Formula:</strong> {tooltipData.regionUsageByUsers.formula}</div>
                              <div className={styles.tooltipExample}><strong>Example:</strong> {tooltipData.regionUsageByUsers.example}</div>
                              <div className={styles.tooltipGoal}><strong>Goal:</strong> {tooltipData.regionUsageByUsers.goal}</div>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className={styles.cardTitle}>Region Usage by Users</div>
                          <div className={styles.cardSubtitle}>Number of unique users per region</div>
                        </div>
                      </div>
                    </div>
                    <div className={styles.regionList}>
                      {metricsData?.regionUsageByUsers?.map((region, index) => (
                        <div key={index} className={styles.regionItem}>
                          <div className={styles.regionHeader}>
                            <span className={styles.regionName}>{region.region}</span>
                            <span className={styles.regionCount}>{formatNumber(region.users)}</span>
                          </div>
                          <div className={styles.regionBar}>
                            <div
                              className={styles.regionBarFill}
                              style={{
                                width: `${region.percentage}%`,
                                background: region.region === 'India' ? '#f59e0b' :
                                           region.region === 'Scotland' ? '#3b82f6' : '#ec4899'
                              }}
                            ></div>
                          </div>
                          <div className={styles.regionPercentage}>{region.percentage.toFixed(1)}% of users</div>
                        </div>
                      ))}
                    </div>
                  </div>
              </div>
            </>
          )}

          {/* ENGAGEMENT TAB */}
          {activeTab === 'engagement' && (
            <div className={styles.engagementSection}>
              {/* Engagement Metrics Grid */}
              <div className={styles.metricsGrid}>
                {/* Retention Rate */}
                <div className={styles.metricCard}>
                  <div 
                    className={styles.metricIcon} 
                    style={{ background: '#dcfce7', position: 'relative', cursor: 'help' }}
                    onMouseEnter={() => setActiveTooltip('retention')}
                    onMouseLeave={() => setActiveTooltip(null)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#16a34a">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {activeTooltip === 'retention' && (
                      <div className={styles.tooltip}>
                        <div className={styles.tooltipTitle}>{tooltipData.retention.title}</div>
                        <div className={styles.tooltipDescription}>{tooltipData.retention.description}</div>
                        <div className={styles.tooltipFormula}><strong>Formula:</strong> {tooltipData.retention.formula}</div>
                        <div className={styles.tooltipExample}><strong>Example:</strong> {tooltipData.retention.example}</div>
                        <div className={styles.tooltipGoal}><strong>Goal:</strong> {tooltipData.retention.goal}</div>
                      </div>
                    )}
                  </div>
                  <div className={styles.metricContent}>
                    <div className={styles.metricLabel}>User Retention Rate</div>
                    <div className={styles.metricValue}>
                      {metricsData?.engagement?.retentionRate?.toFixed(1) || '0'}%
                    </div>
                    <div className={styles.metricFooter}>
                      <span className={styles.metricSubtext}>Users who returned</span>
                      <span className={styles.trendBadge} style={{ color: '#059669' }}>
                        {metricsData?.engagement?.trend || '+0%'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Session Frequency */}
                <div className={styles.metricCard}>
                  <div 
                    className={styles.metricIcon} 
                    style={{ background: '#e0e7ff', position: 'relative', cursor: 'help' }}
                    onMouseEnter={() => setActiveTooltip('sessionFrequency')}
                    onMouseLeave={() => setActiveTooltip(null)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#4f46e5">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {activeTooltip === 'sessionFrequency' && (
                      <div className={styles.tooltip}>
                        <div className={styles.tooltipTitle}>{tooltipData.sessionFrequency.title}</div>
                        <div className={styles.tooltipDescription}>{tooltipData.sessionFrequency.description}</div>
                        <div className={styles.tooltipFormula}><strong>Formula:</strong> {tooltipData.sessionFrequency.formula}</div>
                        <div className={styles.tooltipExample}><strong>Example:</strong> {tooltipData.sessionFrequency.example}</div>
                        <div className={styles.tooltipGoal}><strong>Goal:</strong> {tooltipData.sessionFrequency.goal}</div>
                      </div>
                    )}
                  </div>
                  <div className={styles.metricContent}>
                    <div className={styles.metricLabel}>Session Frequency</div>
                    <div className={styles.metricValue}>
                      {metricsData?.engagement?.sessionFrequency?.toFixed(1) || '0'}
                    </div>
                    <div className={styles.metricFooter}>
                      <span className={styles.metricSubtext}>Avg days between sessions</span>
                      <span className={styles.trendBadge} style={{ color: '#4f46e5' }}>
                        {metricsData?.engagement?.trend || '0%'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Churn Rate */}
                <div className={styles.metricCard}>
                  <div 
                    className={styles.metricIcon} 
                    style={{ background: '#fee2e2', position: 'relative', cursor: 'help' }}
                    onMouseEnter={() => setActiveTooltip('churn')}
                    onMouseLeave={() => setActiveTooltip(null)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#dc2626">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                    </svg>
                    {activeTooltip === 'churn' && (
                      <div className={styles.tooltip}>
                        <div className={styles.tooltipTitle}>{tooltipData.churn.title}</div>
                        <div className={styles.tooltipDescription}>{tooltipData.churn.description}</div>
                        <div className={styles.tooltipFormula}><strong>Formula:</strong> {tooltipData.churn.formula}</div>
                        <div className={styles.tooltipExample}><strong>Example:</strong> {tooltipData.churn.example}</div>
                        <div className={styles.tooltipGoal}><strong>Goal:</strong> {tooltipData.churn.goal}</div>
                      </div>
                    )}
                  </div>
                  <div className={styles.metricContent}>
                    <div className={styles.metricLabel}>Churn Rate</div>
                    <div className={styles.metricValue}>
                      {metricsData?.engagement?.churnRate?.toFixed(2) || '0'}%
                    </div>
                    <div className={styles.metricFooter}>
                      <span className={styles.metricSubtext}>Inactive users</span>
                      <span className={styles.trendBadge} style={{ color: '#dc2626' }}>
                        {metricsData?.engagement?.trend || '0%'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* New vs Returning Users */}
                <div className={styles.metricCard}>
                  <div 
                    className={styles.metricIcon} 
                    style={{ background: '#fef3c7', position: 'relative', cursor: 'help' }}
                    onMouseEnter={() => setActiveTooltip('newReturning')}
                    onMouseLeave={() => setActiveTooltip(null)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#f59e0b">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {activeTooltip === 'newReturning' && (
                      <div className={styles.tooltip}>
                        <div className={styles.tooltipTitle}>{tooltipData.newReturning.title}</div>
                        <div className={styles.tooltipDescription}>{tooltipData.newReturning.description}</div>
                        <div className={styles.tooltipFormula}><strong>Definition:</strong> {tooltipData.newReturning.formula}</div>
                        <div className={styles.tooltipExample}><strong>Example:</strong> {tooltipData.newReturning.example}</div>
                        <div className={styles.tooltipGoal}><strong>Goal:</strong> {tooltipData.newReturning.goal}</div>
                      </div>
                    )}
                  </div>
                  <div className={styles.metricContent}>
                    <div className={styles.metricLabel}>New vs Returning</div>
                    <div className={styles.metricValue}>
                      <span style={{ color: '#059669' }}>{formatNumber(metricsData?.engagement?.newUsers || 0)}</span>
                      {' / '}
                      <span style={{ color: '#3b82f6' }}>{formatNumber(metricsData?.engagement?.returningUsers || 0)}</span>
                    </div>
                    <div className={styles.metricFooter}>
                      <span className={styles.metricSubtext}>New / Returning users</span>
                      <span className={styles.trendBadge} style={{ color: '#059669' }}>
                        {metricsData?.engagement?.trend || '+0%'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Active Users - Dynamic based on time range */}
                <div className={styles.metricCard}>
                  <div 
                    className={styles.metricIcon} 
                    style={{ background: '#d1fae5', position: 'relative', cursor: 'help' }}
                    onMouseEnter={() => setActiveTooltip('activeUsers')}
                    onMouseLeave={() => setActiveTooltip(null)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#059669">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    {activeTooltip === 'activeUsers' && (
                      <div className={styles.tooltip}>
                        <div className={styles.tooltipTitle}>{tooltipData.activeUsers.title}</div>
                        <div className={styles.tooltipDescription}>{tooltipData.activeUsers.description}</div>
                        <div className={styles.tooltipFormula}><strong>Time Ranges:</strong> {tooltipData.activeUsers.formula}</div>
                        <div className={styles.tooltipExample}><strong>Example:</strong> {tooltipData.activeUsers.example}</div>
                        <div className={styles.tooltipGoal}><strong>Goal:</strong> {tooltipData.activeUsers.goal}</div>
                      </div>
                    )}
                  </div>
                  <div className={styles.metricContent}>
                    <div className={styles.metricLabel}>Active Users</div>
                    <div className={styles.metricValue}>
                      {formatNumber(
                        timeRange === 'day' ? metricsData?.engagement?.dau :
                        timeRange === 'week' ? metricsData?.engagement?.wau :
                        timeRange === 'month' ? metricsData?.engagement?.mau :
                        metricsData?.engagement?.mau || 0
                      )}
                    </div>
                    <div className={styles.metricFooter}>
                      <span className={styles.metricSubtext}>
                        Active in selected {timeRange === 'year' ? 'year' : timeRange}
                      </span>
                      <span className={styles.trendBadge} style={{ color: '#059669' }}>
                        {metricsData?.engagement?.trend || '+0%'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
{/* QUERY ANALYSIS TAB */}
{activeTab === 'queries' && (
  <div className={styles.queryAnalysisSection}>
    {/* Query Analysis Metrics Grid */}
    <div className={styles.metricsGrid}>
      {/* Query Type Distribution Card - Larger */}
      <div className={styles.metricCard} style={{ gridColumn: 'span 2' }}>
        <div 
          className={styles.metricIcon} 
          style={{ background: '#e0e7ff', position: 'relative', cursor: 'help' }}
          onMouseEnter={() => setActiveTooltip('queryTypeDistribution')}
          onMouseLeave={() => setActiveTooltip(null)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#4f46e5">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          {activeTooltip === 'queryTypeDistribution' && (
            <div className={styles.tooltip}>
              <div className={styles.tooltipTitle}>{tooltipData.queryTypeDistribution.title}</div>
              <div className={styles.tooltipDescription}>{tooltipData.queryTypeDistribution.description}</div>
              <div className={styles.tooltipFormula}><strong>Categories:</strong> {tooltipData.queryTypeDistribution.formula}</div>
              <div className={styles.tooltipExample}><strong>Example:</strong> {tooltipData.queryTypeDistribution.example}</div>
              <div className={styles.tooltipGoal}><strong>Goal:</strong> {tooltipData.queryTypeDistribution.goal}</div>
            </div>
          )}
        </div>
        <div className={styles.metricContent}>
          <div className={styles.metricLabel}>Query Type Distribution</div>
          <div className={styles.queryTypeGrid}>
            <div className={styles.queryTypeStat}>
              <div className={styles.queryTypeLabel}>Building Codes</div>
              <div className={styles.queryTypeValue} style={{ color: '#059669' }}>
                {metricsData?.queryAnalysis?.queryTypeDistribution?.building_codes || 0}
              </div>
            </div>
            <div className={styles.queryTypeStat}>
              <div className={styles.queryTypeLabel}>Not Available</div>
              <div className={styles.queryTypeValue} style={{ color: '#f59e0b' }}>
                {metricsData?.queryAnalysis?.queryTypeDistribution?.not_available || 0}
              </div>
            </div>
            <div className={styles.queryTypeStat}>
              <div className={styles.queryTypeLabel}>Out of Scope</div>
              <div className={styles.queryTypeValue} style={{ color: '#dc2626' }}>
                {metricsData?.queryAnalysis?.queryTypeDistribution?.out_of_scope || 0}
              </div>
            </div>
            <div className={styles.queryTypeStat}>
              <div className={styles.queryTypeLabel}>Identity/Greeting</div>
              <div className={styles.queryTypeValue} style={{ color: '#3b82f6' }}>
                {metricsData?.queryAnalysis?.queryTypeDistribution?.identity || 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Failed Queries */}
      <div className={styles.metricCard}>
        <div 
          className={styles.metricIcon} 
          style={{ background: '#fee2e2', position: 'relative', cursor: 'help' }}
          onMouseEnter={() => setActiveTooltip('failedQueries')}
          onMouseLeave={() => setActiveTooltip(null)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#dc2626">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {activeTooltip === 'failedQueries' && (
            <div className={styles.tooltip}>
              <div className={styles.tooltipTitle}>{tooltipData.failedQueries.title}</div>
              <div className={styles.tooltipDescription}>{tooltipData.failedQueries.description}</div>
              <div className={styles.tooltipFormula}><strong>Formula:</strong> {tooltipData.failedQueries.formula}</div>
              <div className={styles.tooltipExample}><strong>Example:</strong> {tooltipData.failedQueries.example}</div>
              <div className={styles.tooltipGoal}><strong>Goal:</strong> {tooltipData.failedQueries.goal}</div>
            </div>
          )}
        </div>
        <div className={styles.metricContent}>
          <div className={styles.metricLabel}>Failed Queries</div>
          <div className={styles.metricValue}>
            {metricsData?.queryAnalysis?.failedQueries || 0}
          </div>
          <div className={styles.metricFooter}>
            <span className={styles.metricSubtext}>
              {metricsData?.queryAnalysis?.failedQueryRate?.toFixed(1) || '0'}% failure rate
            </span>
          </div>
        </div>
      </div>

      {/* Follow-up Questions Rate */}
      <div className={styles.metricCard}>
        <div 
          className={styles.metricIcon} 
          style={{ background: '#dbeafe', position: 'relative', cursor: 'help' }}
          onMouseEnter={() => setActiveTooltip('followUpRate')}
          onMouseLeave={() => setActiveTooltip(null)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#3b82f6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {activeTooltip === 'followUpRate' && (
            <div className={styles.tooltip}>
              <div className={styles.tooltipTitle}>{tooltipData.followUpRate.title}</div>
              <div className={styles.tooltipDescription}>{tooltipData.followUpRate.description}</div>
              <div className={styles.tooltipFormula}><strong>Formula:</strong> {tooltipData.followUpRate.formula}</div>
              <div className={styles.tooltipExample}><strong>Example:</strong> {tooltipData.followUpRate.example}</div>
              <div className={styles.tooltipGoal}><strong>Goal:</strong> {tooltipData.followUpRate.goal}</div>
            </div>
          )}
        </div>
        <div className={styles.metricContent}>
          <div className={styles.metricLabel}>Follow-up Rate</div>
          <div className={styles.metricValue}>
            {metricsData?.queryAnalysis?.followUpRate?.toFixed(1) || '0'}%
          </div>
          <div className={styles.metricFooter}>
            <span className={styles.metricSubtext}>Multi-turn conversations</span>
          </div>
        </div>
      </div>
    </div>

    {/* Professional Use Cases & Average Conversation Length */}
    <div className={styles.bottomGrid}>
      {/* Professional Use Cases */}
      <div className={styles.wideCard}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <div 
              className={styles.cardIcon} 
              style={{ background: '#fef3c7', position: 'relative', cursor: 'help' }}
              onMouseEnter={() => setActiveTooltip('professionalUseCases')}
              onMouseLeave={() => setActiveTooltip(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#f59e0b">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {activeTooltip === 'professionalUseCases' && (
                <div className={styles.tooltip}>
                  <div className={styles.tooltipTitle}>{tooltipData.professionalUseCases.title}</div>
                  <div className={styles.tooltipDescription}>{tooltipData.professionalUseCases.description}</div>
                  <div className={styles.tooltipFormula}><strong>Tracking:</strong> {tooltipData.professionalUseCases.formula}</div>
                  <div className={styles.tooltipExample}><strong>Example:</strong> {tooltipData.professionalUseCases.example}</div>
                  <div className={styles.tooltipGoal}><strong>Goal:</strong> {tooltipData.professionalUseCases.goal}</div>
                </div>
              )}
            </div>
            <div>
              <div className={styles.cardTitle}>Professional Use Cases</div>
              <div className={styles.cardSubtitle}>Queries by building type</div>
            </div>
          </div>
        </div>
        <div className={styles.useCasesList}>
          {metricsData?.professionalUseCases?.slice(0, 5).map((useCase, index) => (
            <div key={index} className={styles.useCaseItem}>
              <div className={styles.useCaseHeader}>
                <span className={styles.useCaseName}>
                  {useCase.buildingType.charAt(0).toUpperCase() + useCase.buildingType.slice(1)}
                </span>
                <span className={styles.useCaseCount}>{useCase.queries} queries</span>
              </div>
              <div className={styles.useCaseBar}>
                <div 
                  className={styles.useCaseBarFill} 
                  style={{ width: `${useCase.percentage}%` }}
                ></div>
              </div>
              <div className={styles.useCasePercentage}>{useCase.percentage.toFixed(1)}% of total</div>
            </div>
          )) || <p className={styles.noData}>No professional use case data available</p>}
        </div>
      </div>

      {/* Conversation Metrics */}
      <div className={styles.wideCard}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <div 
              className={styles.cardIcon} 
              style={{ background: '#fce7f3', position: 'relative', cursor: 'help' }}
              onMouseEnter={() => setActiveTooltip('avgConversationLength')}
              onMouseLeave={() => setActiveTooltip(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#ec4899">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
              {activeTooltip === 'avgConversationLength' && (
                <div className={styles.tooltip}>
                  <div className={styles.tooltipTitle}>{tooltipData.avgConversationLength.title}</div>
                  <div className={styles.tooltipDescription}>{tooltipData.avgConversationLength.description}</div>
                  <div className={styles.tooltipFormula}><strong>Formula:</strong> {tooltipData.avgConversationLength.formula}</div>
                  <div className={styles.tooltipExample}><strong>Example:</strong> {tooltipData.avgConversationLength.example}</div>
                  <div className={styles.tooltipGoal}><strong>Goal:</strong> {tooltipData.avgConversationLength.goal}</div>
                </div>
              )}
            </div>
            <div>
              <div className={styles.cardTitle}>Conversation Metrics</div>
              <div className={styles.cardSubtitle}>User interaction patterns</div>
            </div>
          </div>
        </div>
        <div className={styles.conversationMetricsGrid}>
          <div className={styles.conversationMetric}>
            <div className={styles.conversationLabel}>Average Conversation Length</div>
            <div className={styles.conversationValue}>
              {metricsData?.queryAnalysis?.avgConversationLength?.toFixed(1) || '0'}
            </div>
            <div className={styles.conversationSubtext}>messages per conversation</div>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

{/* FEATURES TAB */}
{activeTab === 'features' && (
  <div className={styles.featuresSection}>
    {/* Feature Usage Metrics Grid */}
    <div className={styles.metricsGrid}>
      {/* Edit/Regenerate Usage */}
      <div className={styles.metricCard}>
        <div 
          className={styles.metricIcon} 
          style={{ background: '#e0e7ff', position: 'relative', cursor: 'help' }}
          onMouseEnter={() => setActiveTooltip('editRegenerateUsage')}
          onMouseLeave={() => setActiveTooltip(null)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#4f46e5">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          {activeTooltip === 'editRegenerateUsage' && (
            <div className={styles.tooltip}>
              <div className={styles.tooltipTitle}>{tooltipData.editRegenerateUsage.title}</div>
              <div className={styles.tooltipDescription}>{tooltipData.editRegenerateUsage.description}</div>
              <div className={styles.tooltipFormula}><strong>Formula:</strong> {tooltipData.editRegenerateUsage.formula}</div>
              <div className={styles.tooltipExample}><strong>Example:</strong> {tooltipData.editRegenerateUsage.example}</div>
              <div className={styles.tooltipGoal}><strong>Goal:</strong> {tooltipData.editRegenerateUsage.goal}</div>
            </div>
          )}
        </div>
        <div className={styles.metricContent}>
          <div className={styles.metricLabel}>Edit/Regenerate Usage</div>
          <div className={styles.metricValue}>
            {metricsData?.featureUsage?.edits || 0}
          </div>
          <div className={styles.metricFooter}>
            <span className={styles.metricSubtext}>
              {metricsData?.featureUsage?.editRate?.toFixed(1) || '0'}% of messages edited
            </span>
          </div>
        </div>
      </div>

      {/* Dark Mode Usage */}
      <div className={styles.metricCard}>
        <div 
          className={styles.metricIcon} 
          style={{ background: '#1f2937', position: 'relative', cursor: 'help' }}
          onMouseEnter={() => setActiveTooltip('darkModeUsers')}
          onMouseLeave={() => setActiveTooltip(null)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#ffffff">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
          {activeTooltip === 'darkModeUsers' && (
            <div className={styles.tooltip}>
              <div className={styles.tooltipTitle}>{tooltipData.darkModeUsers.title}</div>
              <div className={styles.tooltipDescription}>{tooltipData.darkModeUsers.description}</div>
              <div className={styles.tooltipFormula}><strong>Formula:</strong> {tooltipData.darkModeUsers.formula}</div>
              <div className={styles.tooltipExample}><strong>Example:</strong> {tooltipData.darkModeUsers.example}</div>
              <div className={styles.tooltipGoal}><strong>Goal:</strong> {tooltipData.darkModeUsers.goal}</div>
            </div>
          )}
        </div>
        <div className={styles.metricContent}>
          <div className={styles.metricLabel}>Dark Mode Users</div>
          <div className={styles.metricValue}>
            {metricsData?.featureUsage?.themeUsage?.darkPercentage?.toFixed(0) || '0'}%
          </div>
          <div className={styles.metricFooter}>
            <span className={styles.metricSubtext}>
              {metricsData?.featureUsage?.themeUsage?.dark || 0} users
            </span>
          </div>
        </div>
      </div>

      {/* Light Mode Usage */}
      <div className={styles.metricCard}>
        <div 
          className={styles.metricIcon} 
          style={{ background: '#fef3c7', position: 'relative', cursor: 'help' }}
          onMouseEnter={() => setActiveTooltip('lightModeUsers')}
          onMouseLeave={() => setActiveTooltip(null)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#f59e0b">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          {activeTooltip === 'lightModeUsers' && (
            <div className={styles.tooltip}>
              <div className={styles.tooltipTitle}>{tooltipData.lightModeUsers.title}</div>
              <div className={styles.tooltipDescription}>{tooltipData.lightModeUsers.description}</div>
              <div className={styles.tooltipFormula}><strong>Formula:</strong> {tooltipData.lightModeUsers.formula}</div>
              <div className={styles.tooltipExample}><strong>Example:</strong> {tooltipData.lightModeUsers.example}</div>
              <div className={styles.tooltipGoal}><strong>Goal:</strong> {tooltipData.lightModeUsers.goal}</div>
            </div>
          )}
        </div>
        <div className={styles.metricContent}>
          <div className={styles.metricLabel}>Light Mode Users</div>
          <div className={styles.metricValue}>
            {metricsData?.featureUsage?.themeUsage?.lightPercentage?.toFixed(0) || '0'}%
          </div>
          <div className={styles.metricFooter}>
            <span className={styles.metricSubtext}>
              {metricsData?.featureUsage?.themeUsage?.light || 0} users
            </span>
          </div>
        </div>
      </div>

      {/* Theme Comparison Chart */}
      <div className={styles.metricCard}>
        <div 
          className={styles.metricIcon} 
          style={{ background: '#dbeafe', position: 'relative', cursor: 'help' }}
          onMouseEnter={() => setActiveTooltip('themePreference')}
          onMouseLeave={() => setActiveTooltip(null)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#3b82f6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          {activeTooltip === 'themePreference' && (
            <div className={styles.tooltip}>
              <div className={styles.tooltipTitle}>{tooltipData.themePreference.title}</div>
              <div className={styles.tooltipDescription}>{tooltipData.themePreference.description}</div>
              <div className={styles.tooltipFormula}><strong>Visual:</strong> {tooltipData.themePreference.formula}</div>
              <div className={styles.tooltipExample}><strong>Example:</strong> {tooltipData.themePreference.example}</div>
              <div className={styles.tooltipGoal}><strong>Goal:</strong> {tooltipData.themePreference.goal}</div>
            </div>
          )}
        </div>
        <div className={styles.metricContent}>
          <div className={styles.metricLabel}>Theme Preference</div>
          <div className={styles.themeComparisonBar}>
            <div 
              className={styles.themeDarkBar} 
              style={{ width: `${metricsData?.featureUsage?.themeUsage?.darkPercentage || 0}%` }}
              title={`Dark: ${metricsData?.featureUsage?.themeUsage?.darkPercentage?.toFixed(1)}%`}
            >
              {(metricsData?.featureUsage?.themeUsage?.darkPercentage || 0) > 15 && (
                <span className={styles.themeBarLabel}>
                  {metricsData?.featureUsage?.themeUsage?.darkPercentage?.toFixed(0)}%
                </span>
              )}
            </div>
            <div 
              className={styles.themeLightBar} 
              style={{ width: `${metricsData?.featureUsage?.themeUsage?.lightPercentage || 0}%` }}
              title={`Light: ${metricsData?.featureUsage?.themeUsage?.lightPercentage?.toFixed(1)}%`}
            >
              {(metricsData?.featureUsage?.themeUsage?.lightPercentage || 0) > 15 && (
                <span className={styles.themeBarLabel}>
                  {metricsData?.featureUsage?.themeUsage?.lightPercentage?.toFixed(0)}%
                </span>
              )}
            </div>
          </div>
          <div className={styles.metricFooter}>
            <span className={styles.metricSubtext}>User theme distribution</span>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

{/* PERFORMANCE TAB */}
{activeTab === 'performance' && (
  <div className={styles.performanceSection}>
    {/* Performance Metrics Grid */}
    <div className={styles.metricsGrid}>
      {/* API Response Time */}
      <div className={styles.metricCard}>
        <div 
          className={styles.metricIcon} 
          style={{ background: '#dcfce7', position: 'relative', cursor: 'help' }}
          onMouseEnter={() => setActiveTooltip('apiResponseTime')}
          onMouseLeave={() => setActiveTooltip(null)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#16a34a">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {activeTooltip === 'apiResponseTime' && (
            <div className={styles.tooltip}>
              <div className={styles.tooltipTitle}>{tooltipData.apiResponseTime.title}</div>
              <div className={styles.tooltipDescription}>{tooltipData.apiResponseTime.description}</div>
              <div className={styles.tooltipFormula}><strong>Formula:</strong> {tooltipData.apiResponseTime.formula}</div>
              <div className={styles.tooltipExample}><strong>Example:</strong> {tooltipData.apiResponseTime.example}</div>
              <div className={styles.tooltipGoal}><strong>Goal:</strong> {tooltipData.apiResponseTime.goal}</div>
            </div>
          )}
        </div>
        <div className={styles.metricContent}>
          <div className={styles.metricLabel}>API Response Time</div>
          <div className={styles.metricValue}>
            {metricsData?.technicalPerformance?.avgResponseTime?.toFixed(2) || '0'}s
          </div>
          <div className={styles.metricFooter}>
            <span className={styles.metricSubtext}>Average response time</span>
            <span className={styles.trendBadge} style={{ 
              color: (metricsData?.technicalPerformance?.avgResponseTime || 0) < 2 ? '#059669' : '#f59e0b'
            }}>
              {(metricsData?.technicalPerformance?.avgResponseTime || 0) < 2 ? 'Excellent' : 'Good'}
            </span>
          </div>
        </div>
      </div>

      {/* Error Rate */}
      <div className={styles.metricCard}>
        <div 
          className={styles.metricIcon} 
          style={{ background: '#fee2e2', position: 'relative', cursor: 'help' }}
          onMouseEnter={() => setActiveTooltip('errorRate')}
          onMouseLeave={() => setActiveTooltip(null)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#dc2626">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {activeTooltip === 'errorRate' && (
            <div className={styles.tooltip}>
              <div className={styles.tooltipTitle}>{tooltipData.errorRate.title}</div>
              <div className={styles.tooltipDescription}>{tooltipData.errorRate.description}</div>
              <div className={styles.tooltipFormula}><strong>Formula:</strong> {tooltipData.errorRate.formula}</div>
              <div className={styles.tooltipExample}><strong>Example:</strong> {tooltipData.errorRate.example}</div>
              <div className={styles.tooltipGoal}><strong>Goal:</strong> {tooltipData.errorRate.goal}</div>
            </div>
          )}
        </div>
        <div className={styles.metricContent}>
          <div className={styles.metricLabel}>Error Rate</div>
          <div className={styles.metricValue}>
            {metricsData?.technicalPerformance?.errorRate?.toFixed(2) || '0'}%
          </div>
          <div className={styles.metricFooter}>
            <span className={styles.metricSubtext}>Failed queries rate</span>
            <span className={styles.trendBadge} style={{ 
              color: (metricsData?.technicalPerformance?.errorRate || 0) < 5 ? '#059669' : '#dc2626'
            }}>
              {(metricsData?.technicalPerformance?.errorRate || 0) < 5 ? 'Healthy' : 'Needs Attention'}
            </span>
          </div>
        </div>
      </div>

      {/* Uptime */}
      <div className={styles.metricCard}>
        <div 
          className={styles.metricIcon} 
          style={{ background: '#dbeafe', position: 'relative', cursor: 'help' }}
          onMouseEnter={() => setActiveTooltip('systemUptime')}
          onMouseLeave={() => setActiveTooltip(null)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#3b82f6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          {activeTooltip === 'systemUptime' && (
            <div className={styles.tooltip}>
              <div className={styles.tooltipTitle}>{tooltipData.systemUptime.title}</div>
              <div className={styles.tooltipDescription}>{tooltipData.systemUptime.description}</div>
              <div className={styles.tooltipFormula}><strong>Formula:</strong> {tooltipData.systemUptime.formula}</div>
              <div className={styles.tooltipExample}><strong>Example:</strong> {tooltipData.systemUptime.example}</div>
              <div className={styles.tooltipGoal}><strong>Goal:</strong> {tooltipData.systemUptime.goal}</div>
            </div>
          )}
        </div>
        <div className={styles.metricContent}>
          <div className={styles.metricLabel}>System Uptime</div>
          <div className={styles.metricValue}>
            {metricsData?.technicalPerformance?.uptime?.toFixed(2) || '99.9'}%
          </div>
          <div className={styles.metricFooter}>
            <span className={styles.metricSubtext}>System availability</span>
            <span className={styles.trendBadge} style={{ color: '#059669' }}>
              Operational
            </span>
          </div>
        </div>
      </div>

      {/* Performance Status */}
      <div className={styles.metricCard}>
        <div 
          className={styles.metricIcon} 
          style={{ background: '#e0e7ff', position: 'relative', cursor: 'help' }}
          onMouseEnter={() => setActiveTooltip('overallStatus')}
          onMouseLeave={() => setActiveTooltip(null)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#4f46e5">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          {activeTooltip === 'overallStatus' && (
            <div className={styles.tooltip}>
              <div className={styles.tooltipTitle}>{tooltipData.overallStatus.title}</div>
              <div className={styles.tooltipDescription}>{tooltipData.overallStatus.description}</div>
              <div className={styles.tooltipFormula}><strong>Formula:</strong> {tooltipData.overallStatus.formula}</div>
              <div className={styles.tooltipExample}><strong>Example:</strong> {tooltipData.overallStatus.example}</div>
              <div className={styles.tooltipGoal}><strong>Goal:</strong> {tooltipData.overallStatus.goal}</div>
            </div>
          )}
        </div>
        <div className={styles.metricContent}>
          <div className={styles.metricLabel}>Overall Status</div>
          <div className={styles.metricValue} style={{ fontSize: '1.5rem', color: '#059669' }}>
            Healthy
          </div>
          <div className={styles.metricFooter}>
            <span className={styles.metricSubtext}>All systems operational</span>
            <span className={styles.statusIndicator} style={{ background: '#059669' }}></span>
          </div>
        </div>
      </div>
    </div>

    {/* Peak Usage Hours Chart */}
    <div className={styles.wideCard}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <div 
            className={styles.cardIcon} 
            style={{ background: '#fef3c7', position: 'relative', cursor: 'help' }}
            onMouseEnter={() => setActiveTooltip('peakUsageHours')}
            onMouseLeave={() => setActiveTooltip(null)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#f59e0b">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {activeTooltip === 'peakUsageHours' && (
              <div className={styles.tooltip}>
                <div className={styles.tooltipTitle}>{tooltipData.peakUsageHours.title}</div>
                <div className={styles.tooltipDescription}>{tooltipData.peakUsageHours.description}</div>
                <div className={styles.tooltipFormula}><strong>Formula:</strong> {tooltipData.peakUsageHours.formula}</div>
                <div className={styles.tooltipExample}><strong>Example:</strong> {tooltipData.peakUsageHours.example}</div>
                <div className={styles.tooltipGoal}><strong>Goal:</strong> {tooltipData.peakUsageHours.goal}</div>
              </div>
            )}
          </div>
          <div>
            <div className={styles.cardTitle}>Peak Usage Hours</div>
            <div className={styles.cardSubtitle}>
              Peak activity at {metricsData?.peakUsageHours?.peakHourLabel || '12:00'}
            </div>
          </div>
        </div>
      </div>
      <div className={styles.peakUsageChart}>
        {metricsData?.peakUsageHours?.hourlyData?.map((hour, index) => {
          const maxCount = Math.max(...(metricsData?.peakUsageHours?.hourlyData?.map(h => h.count) || [1]));
          const heightPercentage = maxCount > 0 ? (hour.count / maxCount) * 100 : 0;
          const isPeak = hour.hour === metricsData?.peakUsageHours?.peakHour;
          
          return (
            <div key={index} className={styles.peakUsageBar}>
              <div 
                className={styles.peakUsageBarFill} 
                style={{ 
                  height: `${heightPercentage}%`,
                  background: isPeak ? '#059669' : '#d1d5db'
                }}
                title={`${hour.label}: ${hour.count} queries`}
              ></div>
              <div className={styles.peakUsageLabel}>{hour.hour}h</div>
            </div>
          );
        }) || <p className={styles.noData}>No peak usage data available</p>}
      </div>
    </div>
  </div>
)}

{/* Query Log Section - Available in All Tabs */}

          {/* Query Log Section - Shared across all tabs */}
          <div className={styles.queryLogCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <div className={styles.cardIcon} style={{ background: '#dbeafe' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#3b82f6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <div className={styles.cardTitle}>Query Log & Analysis</div>
                  <div className={styles.cardSubtitle}>Complete history of all user queries for analysis</div>
                </div>
              </div>
              <button className={styles.exportButton} onClick={handleExportCSV}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
            </div>

            <div className={styles.filtersSection}>
              <div className={styles.searchBar}>
                <svg xmlns="http://www.w3.org/2000/svg" className={styles.searchIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search queries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className={styles.filterRow}>
                <div className={styles.dateRangeFilters}>
                  <input
                    type="date"
                    className={styles.dateInput}
                    placeholder="dd-mm-yyyy"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                  <span className={styles.dateSeparator}>to</span>
                  <input
                    type="date"
                    className={styles.dateInput}
                    placeholder="dd-mm-yyyy"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>

                <select
                  className={styles.filterSelect}
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                >
                  <option value="all">All Regions</option>
                  <option value="India">India</option>
                  <option value="Scotland">Scotland</option>
                  <option value="Dubai">Dubai</option>
                </select>

                <select
                  className={styles.filterSelect}
                  value={feedbackFilter}
                  onChange={(e) => setFeedbackFilter(e.target.value)}
                >
                  <option value="all">All Feedback</option>
                  <option value="helpful">Helpful</option>
                  <option value="unhelpful">Unhelpful</option>
                </select>

                <select
                  className={styles.filterSelect}
                  value={responseTimeFilter}
                  onChange={(e) => setResponseTimeFilter(e.target.value)}
                >
                  <option value="all">All Response Times</option>
                  <option value="fast">Fast (&lt; 2s)</option>
                  <option value="medium">Medium (2-5s)</option>
                  <option value="slow">Slow (&gt; 5s)</option>
                </select>
              </div>

              <div className={styles.quickFilters}>
                <button
                  className={`${styles.quickFilterButton} ${activeQuickFilter === 'today' ? styles.activeQuickFilter : ''}`}
                  onClick={() => handleQuickDateFilter('today')}
                >
                  Today
                </button>
                <button
                  className={`${styles.quickFilterButton} ${activeQuickFilter === 'last7days' ? styles.activeQuickFilter : ''}`}
                  onClick={() => handleQuickDateFilter('last7days')}
                >
                  Last 7 Days
                </button>
                <button
                  className={`${styles.quickFilterButton} ${activeQuickFilter === 'last30days' ? styles.activeQuickFilter : ''}`}
                  onClick={() => handleQuickDateFilter('last30days')}
                >
                  Last 30 Days
                </button>
                <button
                  className={`${styles.quickFilterButton} ${activeQuickFilter === 'thisMonth' ? styles.activeQuickFilter : ''}`}
                  onClick={() => handleQuickDateFilter('thisMonth')}
                >
                  This Month
                </button>
              </div>

              <div className={styles.filterActions}>
                <button className={styles.applyFiltersButton} onClick={handleApplyFilters}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filters Applied
                </button>
              </div>
            </div>

            <div className={styles.resultsInfo}>
              <span className={styles.resultsCount}>
                Showing {((currentPage - 1) * queriesPerPage) + 1}-{Math.min(currentPage * queriesPerPage, queriesData?.pagination?.total || 0)} of {queriesData?.pagination?.total || 0} queries
              </span>
            </div>

            {queriesLoading ? (
              <div className={styles.queryTableLoading}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading query log...</p>
              </div>
            ) : !queriesData || queriesData.queries.length === 0 ? (
              <div className={styles.noResults}>
                <svg xmlns="http://www.w3.org/2000/svg" className={styles.noResultsIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className={styles.noResultsText}>No queries found</p>
                <p className={styles.noResultsSubtext}>Try adjusting your filters</p>
              </div>
            ) : (
              <>
                <div className={styles.tableWrapper}>
                  <table className={styles.queryTable}>
                    <thead>
                      <tr>
                        <th onClick={() => handleSort('timestamp')} className={styles.sortableHeader}>
                          <div className={styles.headerContent}>
                            Timestamp
                            <span className={styles.sortIcon}>
                              {sortColumn === 'timestamp' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </span>
                          </div>
                        </th>
                        <th onClick={() => handleSort('query')} className={styles.sortableHeader}>
                          <div className={styles.headerContent}>
                            Query
                            <span className={styles.sortIcon}>
                              {sortColumn === 'query' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </span>
                          </div>
                        </th>
                        <th onClick={() => handleSort('region')} className={styles.sortableHeader}>
                          <div className={styles.headerContent}>
                            Region
                            <span className={styles.sortIcon}>
                              {sortColumn === 'region' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </span>
                          </div>
                        </th>
                        <th onClick={() => handleSort('feedback')} className={styles.sortableHeader}>
                          <div className={styles.headerContent}>
                            Feedback
                            <span className={styles.sortIcon}>
                              {sortColumn === 'feedback' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </span>
                          </div>
                        </th>
                        <th onClick={() => handleSort('responseTime')} className={styles.sortableHeader}>
                          <div className={styles.headerContent}>
                            Response Time
                            <span className={styles.sortIcon}>
                              {sortColumn === 'responseTime' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {queriesData.queries.map((query) => (
                        <tr key={query.id} className={styles.tableRow}>
                          <td className={styles.timestampCell}>{formatDate(query.timestamp)}</td>
                          <td className={styles.queryCell}>
                            <span className={styles.queryText}>{query.query}</span>
                          </td>
                          <td className={styles.regionCell}>
                            <span className={`${styles.regionBadge} ${styles[`region${query.region}`]}`}>
                              {query.region}
                            </span>
                          </td>
                          <td className={styles.feedbackCell}>
                            {query.feedback === 'helpful' ? (
                              <span className={styles.feedbackBadgeHelpful}>
                                <svg xmlns="http://www.w3.org/2000/svg" className={styles.badgeIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Helpful
                              </span>
                            ) : (
                              <span className={styles.feedbackBadgeUnhelpful}>
                                <svg xmlns="http://www.w3.org/2000/svg" className={styles.badgeIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                                </svg>
                                Unhelpful
                              </span>
                            )}
                          </td>
                          <td className={styles.responseTimeCell}>
                            <span className={styles.responseTime}>{query.responseTime} s</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {queriesData.pagination.totalPages > 1 && (
                  <div className={styles.pagination}>
                    <button
                      className={styles.paginationButton}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                    <div className={styles.pageInfo}>
                      Page {currentPage} of {queriesData.pagination.totalPages}
                    </div>
                    <button
                      className={styles.paginationButton}
                      onClick={() => setCurrentPage(prev => Math.min(queriesData.pagination.totalPages, prev + 1))}
                      disabled={currentPage === queriesData.pagination.totalPages}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}