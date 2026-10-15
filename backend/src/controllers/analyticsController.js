const TrainingProgram = require('../models/TrainingProgram');
const Trainee = require('../models/Trainee');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get consolidated dashboard analytics
 * @route   GET /api/analytics/dashboard
 * @access  Private
 */
const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const [
    totalPrograms,
    totalTrainees,
    totalEnrollments,
    totalUsers,
    programsByStatus,
    uniqueTraineesThisYear,
    genderBreakdown,
    categoryBreakdown,
    stateDistribution,
    recentPrograms,
    monthlyTrend,
  ] = await Promise.all([
    TrainingProgram.countDocuments(),
    Trainee.countDocuments(),
    Enrollment.countDocuments(),
    User.countDocuments({ isActive: true }),

    TrainingProgram.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),

    Enrollment.distinct('trainee', {
      enrollmentDate: { $gte: new Date(new Date().getFullYear(), 0, 1) },
    }),

    Trainee.aggregate([
      { $group: { _id: '$gender', count: { $sum: 1 } } },
    ]),

    TrainingProgram.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, totalEnrolled: { $sum: '$enrolledCount' } } },
      { $sort: { totalEnrolled: -1 } },
    ]),

    Trainee.aggregate([
      { $group: { _id: '$address.state', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),

    TrainingProgram.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title programCode status startDate endDate enrolledCount'),

    Enrollment.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$enrollmentDate' },
            month: { $month: '$enrollmentDate' },
          },
          enrollments: { $sum: 1 },
          completions: {
            $sum: { $cond: [{ $eq: ['$completionStatus', 'Completed'] }, 1, 0] },
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]),
  ]);

  const completedPrograms = programsByStatus.find((s) => s._id === 'Completed')?.count || 0;

  res.status(200).json({
    success: true,
    data: {
      summary: {
        totalPrograms,
        totalTrainees,
        totalEnrollments,
        totalUsers,
        completedPrograms,
        uniqueTraineesThisYear: uniqueTraineesThisYear.length,
      },
      programsByStatus,
      genderBreakdown,
      categoryBreakdown,
      stateDistribution,
      recentPrograms,
      monthlyTrend,
    },
  });
});

/**
 * @desc    Get performance analytics
 * @route   GET /api/analytics/performance
 * @access  Private
 */
const getPerformanceAnalytics = asyncHandler(async (req, res) => {
  const [scoreImprovement, feedbackSummary, completionRates, pwdStats] = await Promise.all([
    Enrollment.aggregate([
      {
        $match: {
          preTestScore: { $exists: true },
          postTestScore: { $exists: true },
        },
      },
      {
        $group: {
          _id: null,
          avgPreScore: { $avg: '$preTestScore' },
          avgPostScore: { $avg: '$postTestScore' },
          avgImprovement: { $avg: { $subtract: ['$postTestScore', '$preTestScore'] } },
          totalAssessed: { $sum: 1 },
        },
      },
    ]),

    Enrollment.aggregate([
      { $match: { 'feedback.overallRating': { $exists: true } } },
      {
        $group: {
          _id: null,
          avgOverall: { $avg: '$feedback.overallRating' },
          avgContent: { $avg: '$feedback.contentRating' },
          avgTrainer: { $avg: '$feedback.trainerRating' },
          avgVenue: { $avg: '$feedback.venueRating' },
          totalResponses: { $sum: 1 },
          recommended: {
            $sum: { $cond: ['$feedback.wouldRecommend', 1, 0] },
          },
        },
      },
    ]),

    TrainingProgram.aggregate([
      {
        $project: {
          title: 1,
          enrolledCount: 1,
          completedCount: 1,
          completionRate: {
            $cond: [
              { $gt: ['$enrolledCount', 0] },
              { $multiply: [{ $divide: ['$completedCount', '$enrolledCount'] }, 100] },
              0,
            ],
          },
        },
      },
      { $sort: { completionRate: -1 } },
      { $limit: 10 },
    ]),

    Trainee.aggregate([
      {
        $group: {
          _id: '$isPWD',
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  res.status(200).json({
    success: true,
    data: {
      scoreImprovement: scoreImprovement[0] || {},
      feedbackSummary: feedbackSummary[0] || {},
      completionRates,
      pwdStats,
    },
  });
});

module.exports = { getDashboardAnalytics, getPerformanceAnalytics };
