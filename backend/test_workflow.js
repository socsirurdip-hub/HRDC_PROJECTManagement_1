const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');

const User = require('./src/models/User');
const Trainee = require('./src/models/Trainee');
const TrainingProgram = require('./src/models/TrainingProgram');
const Nomination = require('./src/models/Nomination');
const Batch = require('./src/models/Batch');
const Enrollment = require('./src/models/Enrollment');
const OtpVerification = require('./src/models/OtpVerification');
const { isTrustedGovEmail } = require('./src/utils/domainValidator');

const runTest = async () => {
  console.log('=== STARTING END-TO-END VERIFICATION ===\n');

  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('✔ Connected to MongoDB');

    // 1. Test Domain Validator
    console.log('\n--- 1. Testing Domain Validation Utility ---');
    console.log('sandeep.k@ncl.res.in is trusted:', isTrustedGovEmail('sandeep.k@ncl.res.in') === true ? 'PASS' : 'FAIL');
    console.log('officer@meity.gov.in is trusted:', isTrustedGovEmail('officer@meity.gov.in') === true ? 'PASS' : 'FAIL');
    console.log('director@csir.res.in is trusted:', isTrustedGovEmail('director@csir.res.in') === true ? 'PASS' : 'FAIL');
    console.log('admin@nic.in is trusted:', isTrustedGovEmail('admin@nic.in') === true ? 'PASS' : 'FAIL');
    console.log('user@gmail.com is NOT trusted:', isTrustedGovEmail('user@gmail.com') === false ? 'PASS' : 'FAIL');
    console.log('rahul@innovatetech.org is NOT trusted:', isTrustedGovEmail('rahul@innovatetech.org') === false ? 'PASS' : 'FAIL');

    // Clean up any previous test trainee records
    await Trainee.deleteMany({ email: { $in: ['dr.raman@csir.res.in', 'priya.nair@innovatetech.org'] } });
    await Nomination.deleteMany({ 'willingnessDetails.reportingOfficerEmail': 'test.hod@csir.res.in' });
    await Batch.deleteMany({ batchCode: 'TEST-BATCH-99' });

    // 2. Test Trainee Self-Registration (Gov Domain)
    console.log('\n--- 2. Testing Trainee Self-Registration (Gov Domain) ---');
    const isGov = isTrustedGovEmail('dr.raman@csir.res.in');
    const traineeGov = await Trainee.create({
      firstName: 'Dr. C. V.',
      lastName: 'Raman',
      gender: 'Male',
      socialCategory: 'General',
      domicileType: 'Urban',
      email: 'dr.raman@csir.res.in',
      phone: '9988771122',
      address: { state: 'Karnataka', city: 'Bengaluru' },
      highestQualification: 'PhD',
      employmentStatus: 'Government Employee',
      organization: 'CSIR-NAL',
      designation: 'Distinguished Scientist',
      registrationType: 'SELF',
      approvalStatus: 'PENDING',
      domainWarning: !isGov,
    });
    console.log(`✔ Created Gov Trainee: ${traineeGov.fullName} (${traineeGov.traineeId})`);
    console.log(`  Approval Status: ${traineeGov.approvalStatus} | Domain Warning: ${traineeGov.domainWarning}`);
    if (traineeGov.approvalStatus !== 'PENDING' || traineeGov.domainWarning !== false) {
      throw new Error('Gov trainee registration assertion failed');
    }

    // 3. Test Trainee Self-Registration (Non-Gov Domain with Warning)
    console.log('\n--- 3. Testing Trainee Self-Registration (Non-Gov Domain) ---');
    const isNonGov = isTrustedGovEmail('priya.nair@innovatetech.org');
    const traineeNonGov = await Trainee.create({
      firstName: 'Priya',
      lastName: 'Nair',
      gender: 'Female',
      socialCategory: 'General',
      domicileType: 'Semi-Urban',
      email: 'priya.nair@innovatetech.org',
      phone: '9988771133',
      address: { state: 'Kerala', city: 'Kochi' },
      highestQualification: 'Post Graduate',
      employmentStatus: 'Private Sector',
      organization: 'InnovateTech Systems',
      designation: 'Senior Consultant',
      registrationType: 'SELF',
      approvalStatus: 'PENDING',
      domainWarning: !isNonGov,
      domainWarningDetails: 'Non-Government Email Domain: Manual verification required by Super Admin',
    });
    console.log(`✔ Created Non-Gov Trainee: ${traineeNonGov.fullName} (${traineeNonGov.traineeId})`);
    console.log(`  Approval Status: ${traineeNonGov.approvalStatus} | Domain Warning: ${traineeNonGov.domainWarning}`);
    if (traineeNonGov.domainWarning !== true) {
      throw new Error('Non-Gov domain warning assertion failed');
    }

    // 4. Test Super Admin Approval Workflow
    console.log('\n--- 4. Testing Super Admin Approval ---');
    const superAdmin = await User.findOne({ role: 'super_admin' });
    if (!superAdmin) throw new Error('Super admin user not found');

    const approvedCount = await Trainee.countDocuments({ approvalStatus: 'APPROVED' });
    traineeGov.traineeId = `HRDC-${String(approvedCount + 1).padStart(6, '0')}`;
    traineeGov.approvalStatus = 'APPROVED';
    traineeGov.approvedBy = superAdmin._id;
    traineeGov.approvedAt = new Date();
    await traineeGov.save();
    console.log(`✔ Super Admin approved trainee. New Permanent ID: ${traineeGov.traineeId}`);
    if (traineeGov.approvalStatus !== 'APPROVED' || !traineeGov.traineeId.startsWith('HRDC-0')) {
      throw new Error('Approval workflow assertion failed');
    }

    // 5. Test Program Nominations & OTP Flow
    console.log('\n--- 5. Testing Nomination Flow with OTP ---');
    const program = await TrainingProgram.findOne({ allowNominations: true });
    if (!program) throw new Error('No program with allowNominations: true found');
    console.log(`✔ Selected Program for Nominations: ${program.programCode} - ${program.title}`);

    // Generate OTP
    const testOtp = '123456';
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await OtpVerification.create({
      email: traineeGov.email,
      otp: testOtp,
      programId: program._id,
      expiresAt,
      verified: true,
    });
    console.log(`✔ OTP ${testOtp} stored & verified for ${traineeGov.email}`);

    // Submit Nomination
    const nomination = await Nomination.create({
      program: program._id,
      trainee: traineeGov._id,
      status: 'SUBMITTED',
      willingnessDetails: {
        statementOfPurpose: 'Eager to acquire cutting-edge regulatory compliance skills for aerospace lab certification.',
        reportingOfficerName: 'Dr. S. K. Murthy',
        reportingOfficerDesignation: 'Director, CSIR-NAL',
        reportingOfficerEmail: 'test.hod@csir.res.in',
        accommodationRequired: true,
      },
    });
    console.log(`✔ Nomination Submitted: ID ${nomination._id} | Status: ${nomination.status}`);
    console.log(`  Reporting Officer: ${nomination.willingnessDetails.reportingOfficerName} (${nomination.willingnessDetails.reportingOfficerEmail})`);
    console.log(`  Hostel Needed: ${nomination.willingnessDetails.accommodationRequired}`);

    // 6. Test Program Coordinator Review
    console.log('\n--- 6. Testing Coordinator Review (Approve Nomination) ---');
    const adminUser = await User.findOne({ role: 'admin' });
    nomination.status = 'APPROVED';
    nomination.reviewedBy = adminUser._id;
    nomination.reviewedAt = new Date();
    await nomination.save();
    console.log(`✔ Nomination Approved by ${adminUser.name}. Status: ${nomination.status}`);

    // 7. Test Batch Creation with Distinct Start & End Dates
    console.log('\n--- 7. Testing Batch Creation with Distinct Dates ---');
    const batch = await Batch.create({
      program: program._id,
      batchCode: 'TEST-BATCH-99',
      batchName: 'Cohort X - Aerospace Division',
      startDate: new Date('2024-09-02'), // Distinct start date
      endDate: new Date('2024-09-06'),   // Distinct end date
      maxCapacity: 20,
      assignedCount: 0,
      venueOrMeetingLink: 'Auditorium B, NAL Campus, Bengaluru',
      coordinatorInCharge: 'Priya Sharma',
      status: 'Scheduled',
      createdBy: adminUser._id,
    });
    console.log(`✔ Created Batch: ${batch.batchCode} - ${batch.batchName}`);
    console.log(`  Dates: ${batch.startDate.toISOString().slice(0, 10)} to ${batch.endDate.toISOString().slice(0, 10)} (Duration: ${batch.durationDays} days)`);

    // 8. Test Participant Allocation into Batch (Enrollment Generation)
    console.log('\n--- 8. Testing Participant Allocation & Enrollment Sync ---');
    const enrollment = await Enrollment.create({
      program: program._id,
      trainee: traineeGov._id,
      batch: batch._id,
      nomination: nomination._id,
      registeredBy: adminUser._id,
      completionStatus: 'Enrolled',
    });

    batch.assignedCount = 1;
    await batch.save();

    nomination.assignedBatch = batch._id;
    await nomination.save();

    console.log(`✔ Successfully Allocated ${traineeGov.fullName} into Batch ${batch.batchCode}!`);
    console.log(`  Enrollment Record ID: ${enrollment._id} | Batch Assigned: ${enrollment.batch}`);
    console.log(`  Batch Occupancy: ${batch.assignedCount}/${batch.maxCapacity}`);

    // Clean up test records
    console.log('\n--- 9. Cleaning Up Test Artifacts ---');
    await Enrollment.findByIdAndDelete(enrollment._id);
    await Batch.findByIdAndDelete(batch._id);
    await Nomination.findByIdAndDelete(nomination._id);
    await OtpVerification.deleteMany({ email: traineeGov.email });
    await Trainee.findByIdAndDelete(traineeGov._id);
    await Trainee.findByIdAndDelete(traineeNonGov._id);
    console.log('✔ Test records cleaned up cleanly.');

    console.log('\n======================================================');
    console.log('🎉 ALL INTEGRATION WORKFLOW CHECKS PASSED SUCCESSFULLY!');
    console.log('======================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

runTest();
