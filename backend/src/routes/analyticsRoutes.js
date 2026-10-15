const express = require('express');
const router = express.Router();
const { getDashboardAnalytics, getPerformanceAnalytics } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/dashboard', getDashboardAnalytics);
router.get('/performance', getPerformanceAnalytics);

module.exports = router;
