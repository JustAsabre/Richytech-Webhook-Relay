const WebhookLog = require('../models/WebhookLog');
const Endpoint = require('../models/Endpoint');
const { startOfDay, startOfMonth, subDays } = require('date-fns');

/**
 * Get dashboard statistics
 */
exports.getStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const todayStart = startOfDay(now);
    const monthStart = startOfMonth(now);

    // Get total webhooks count
    const totalWebhooks = await WebhookLog.countDocuments({ userId });

    // Get webhooks today
    const webhooksToday = await WebhookLog.countDocuments({
      userId,
      createdAt: { $gte: todayStart },
    });

    // Get webhooks this month
    const webhooksThisMonth = await WebhookLog.countDocuments({
      userId,
      createdAt: { $gte: monthStart },
    });

    // Calculate success rate (last 30 days)
    const thirtyDaysAgo = subDays(now, 30);
    const recentWebhooks = await WebhookLog.countDocuments({
      userId,
      createdAt: { $gte: thirtyDaysAgo },
    });

    const successfulWebhooks = await WebhookLog.countDocuments({
      userId,
      status: 'success',
      createdAt: { $gte: thirtyDaysAgo },
    });

    const successRate = recentWebhooks > 0 
      ? Math.round((successfulWebhooks / recentWebhooks) * 100) 
      : 100;

    // Get endpoint counts
    const totalEndpoints = await Endpoint.countDocuments({ userId });
    const activeEndpoints = await Endpoint.countDocuments({ 
      userId, 
      isActive: true 
    });

    // Get user quota (from user model or default)
    const quotaLimit = req.user.quota?.monthlyLimit || 1000;
    const quotaUsed = webhooksThisMonth;

    res.json({
      success: true,
      data: {
        totalWebhooks,
        webhooksToday,
        webhooksThisMonth,
        successRate,
        activeEndpoints,
        totalEndpoints,
        quotaUsed,
        quotaLimit,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'STATS_ERROR',
        message: 'Failed to fetch statistics',
        details: process.env.NODE_ENV === 'development' ? [error.message] : undefined,
      },
    });
  }
};

/**
 * Get webhook volume analytics (for charts)
 */
exports.getWebhookVolume = async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 7 } = req.query;
    const daysNum = parseInt(days, 10);

    const startDate = subDays(new Date(), daysNum);

    // Aggregate webhooks by day
    const volumeData = await WebhookLog.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
          successful: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] },
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.json({
      success: true,
      data: volumeData,
    });
  } catch (error) {
    console.error('Get webhook volume error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ANALYTICS_ERROR',
        message: 'Failed to fetch webhook volume',
        details: process.env.NODE_ENV === 'development' ? [error.message] : undefined,
      },
    });
  }
};

/**
 * Get endpoint performance analytics
 */
exports.getEndpointPerformance = async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;
    const daysNum = parseInt(days, 10);

    const startDate = subDays(new Date(), daysNum);

    // Aggregate webhooks by endpoint
    const performance = await WebhookLog.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: startDate },
        },
      },
      {
        $lookup: {
          from: 'endpoints',
          localField: 'endpointId',
          foreignField: '_id',
          as: 'endpoint',
        },
      },
      {
        $unwind: '$endpoint',
      },
      {
        $group: {
          _id: '$endpointId',
          name: { $first: '$endpoint.name' },
          totalWebhooks: { $sum: 1 },
          successful: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] },
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
          },
          avgAttempts: { $avg: '$attempts' },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          totalWebhooks: 1,
          successful: 1,
          failed: 1,
          avgAttempts: { $round: ['$avgAttempts', 2] },
          successRate: {
            $round: [
              {
                $multiply: [
                  { $divide: ['$successful', '$totalWebhooks'] },
                  100,
                ],
              },
              2,
            ],
          },
        },
      },
      {
        $sort: { totalWebhooks: -1 },
      },
    ]);

    res.json({
      success: true,
      data: performance,
    });
  } catch (error) {
    console.error('Get endpoint performance error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ANALYTICS_ERROR',
        message: 'Failed to fetch endpoint performance',
        details: process.env.NODE_ENV === 'development' ? [error.message] : undefined,
      },
    });
  }
};
