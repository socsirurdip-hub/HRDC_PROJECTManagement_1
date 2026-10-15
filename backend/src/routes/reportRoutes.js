const express = require('express');
const router = express.Router();
const { exportProgramsReport, exportTraineesReport } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/programs', exportProgramsReport);
router.get('/trainees', exportTraineesReport);

module.exports = router;
