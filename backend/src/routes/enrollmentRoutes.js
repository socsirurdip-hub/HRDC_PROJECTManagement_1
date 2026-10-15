const express = require('express');
const router = express.Router();
const {
  enrollTrainee,
  getEnrollmentsByProgram,
  getEnrollmentsByTrainee,
  updateEnrollment,
  submitFeedback,
  getEnrollmentStats,
} = require('../controllers/enrollmentController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/stats', getEnrollmentStats);
router.route('/').post(enrollTrainee);
router.get('/program/:programId', getEnrollmentsByProgram);
router.get('/trainee/:traineeId', getEnrollmentsByTrainee);
router.route('/:id').put(updateEnrollment);
router.post('/:id/feedback', submitFeedback);

module.exports = router;
