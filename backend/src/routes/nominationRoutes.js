const express = require('express');
const router = express.Router();
const {
  getPublicProgramInvite,
  sendNominationOtp,
  verifyNominationOtp,
  submitNomination,
  getNominationsByProgram,
  reviewNomination,
  bulkReviewNominations,
  inviteCandidates,
  mapNominationToBatch,
} = require('../controllers/nominationController');
const { protect, authorize } = require('../middleware/auth');

// Public endpoints for prospective participants
router.get('/public-program/:idOrCode', getPublicProgramInvite);
router.post('/send-otp', sendNominationOtp);
router.post('/verify-otp', verifyNominationOtp);
router.post('/submit', submitNomination);

// Protected endpoints for Program Coordinators and Admins
router.use(protect);
router.get('/program/:programId', getNominationsByProgram);
router.post('/invite-batch', authorize('admin', 'super_admin'), inviteCandidates);
router.post('/:id/map-to-batch', authorize('admin', 'super_admin'), mapNominationToBatch);
router.put('/:id/review', authorize('admin', 'super_admin'), reviewNomination);
router.post('/bulk-review', authorize('admin', 'super_admin'), bulkReviewNominations);

module.exports = router;
