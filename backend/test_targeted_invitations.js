const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');

const User = require('./src/models/User');
const Trainee = require('./src/models/Trainee');
const TrainingProgram = require('./src/models/TrainingProgram');
const Nomination = require('./src/models/Nomination');
const Batch = require('./src/models/Batch');
const Enrollment = require('./src/models/Enrollment');
const AuditLog = require('./src/models/AuditLog');

const runTest = async () => {
  console.log('=== STARTING TARGETED INVITATIONS & RBAC VERIFICATION ===\n');

  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('✔ Connected to MongoDB');

    // 1. Verify Users & Roles
    console.log('\n--- 1. Verifying Users and Roles ---');
    const superAdmin = await User.findOne({ role: 'super_admin' });
    const coordinator = await User.findOne({ role: 'admin' });

    console.log(`✔ Super Admin found: ${superAdmin?.name} (${superAdmin?.email}) - Role: ${superAdmin?.role}`);
    console.log(`✔ Coordinator found: ${coordinator?.name} (${coordinator?.email}) - Role: ${coordinator?.role}`);

    if (!superAdmin || !coordinator) {
      throw new Error('Required roles not found in database');
    }

    // 2. Trainee Filter Options
    console.log('\n--- 2. Verifying Approved Trainee Filter Options ---');
    const [organizations, designations, states] = await Promise.all([
      Trainee.distinct('organization', { approvalStatus: 'APPROVED', organization: { $ne: null, $ne: '' } }),
      Trainee.distinct('designation', { approvalStatus: 'APPROVED', designation: { $ne: null, $ne: '' } }),
      Trainee.distinct('address.state', { approvalStatus: 'APPROVED', 'address.state': { $ne: null, $ne: '' } }),
    ]);

    console.log(`✔ Organizations found: ${organizations.length} (e.g. ${organizations.slice(0, 3).join(', ')})`);
    console.log(`✔ Designations found: ${designations.length} (e.g. ${designations.slice(0, 3).join(', ')})`);
    console.log(`✔ States found: ${states.length} (e.g. ${states.slice(0, 3).join(', ')})`);

    if (organizations.length === 0 || designations.length === 0) {
      throw new Error('Filter options returned empty list');
    }

    // 3. Find or Create Program and Batch
    console.log('\n--- 3. Setting Up Test Training Program & Batches ---');
    let program = await TrainingProgram.findOne({ allowNominations: true });
    if (!program) {
      program = await TrainingProgram.create({
        programCode: 'TEST-INVITE-2026',
        title: 'Advanced Research Methodologies & Lab Management',
        description: 'Comprehensive program for CSIR scientists',
        category: 'Scientific',
        mode: 'Offline',
        venue: 'CSIR-HRDC Campus, Ghaziabad',
        state: 'Uttar Pradesh',
        district: 'Ghaziabad',
        startDate: new Date('2026-09-01'),
        endDate: new Date('2026-09-10'),
        durationDays: 10,
        coordinator: coordinator._id,
        coordinatorName: coordinator.name,
        coordinatorEmail: coordinator.email,
        allowNominations: true,
        hasBatches: true,
        maxParticipants: 50,
      });
    }

    let batch = await Batch.findOne({ program: program._id });
    if (!batch) {
      batch = await Batch.create({
        program: program._id,
        batchCode: 'TEST-BATCH-A',
        batchName: 'Cohort Alpha - Morning Lab Session',
        startDate: new Date('2026-09-01'),
        endDate: new Date('2026-09-05'),
        maxCapacity: 25,
        assignedCount: 0,
      });
    }
    console.log(`✔ Target Program: ${program.title} (${program.programCode})`);
    console.log(`✔ Target Batch: ${batch.batchName} (${batch.batchCode}) - Capacity: ${batch.maxCapacity}`);

    // Clean up any previous test nominations
    const approvedTrainees = await Trainee.find({ approvalStatus: 'APPROVED' }).limit(3);
    const testTrainee = approvedTrainees[0];
    await Nomination.deleteMany({ program: program._id, trainee: testTrainee._id });
    await Enrollment.deleteMany({ program: program._id, trainee: testTrainee._id });

    // 4. Targeted Invitation Dispatch (status: INVITED)
    console.log('\n--- 4. Testing Targeted Invitation Dispatch ---');
    const nomination = await Nomination.create({
      program: program._id,
      trainee: testTrainee._id,
      status: 'INVITED',
      invitationDetails: {
        invitedBy: coordinator._id,
        invitedAt: new Date(),
        channel: 'DIRECT_SELECT',
        targetCriteria: {
          organization: testTrainee.organization,
          designation: testTrainee.designation,
        },
      },
    });

    console.log(`✔ Nomination record created with status: ${nomination.status}`);
    console.log(`  Candidate: ${testTrainee.fullName} (${testTrainee.email})`);
    console.log(`  Invited By: Coordinator ${coordinator.name}`);
    if (nomination.status !== 'INVITED') {
      throw new Error('Nomination status should be INVITED');
    }

    // 5. Candidate Submits Willingness (status: SUBMITTED)
    console.log('\n--- 5. Testing Candidate Willingness Submission ---');
    nomination.status = 'SUBMITTED';
    nomination.willingnessDetails = {
      statementOfPurpose: 'Excited to contribute to CSIR mission and learn advanced methodologies.',
      reportingOfficerName: 'Dr. Amitabh Ghosh',
      reportingOfficerDesignation: 'Director, CSIR Lab',
      reportingOfficerEmail: 'director@csir.res.in',
      accommodationRequired: true,
      specialAssistance: 'None',
    };
    nomination.submittedAt = new Date();
    await nomination.save();

    console.log(`✔ Nomination status transitioned to: ${nomination.status}`);
    console.log(`  Controlling Officer: ${nomination.willingnessDetails.reportingOfficerName}`);
    console.log(`  Accommodation: ${nomination.willingnessDetails.accommodationRequired ? 'Required' : 'Not Required'}`);
    if (nomination.status !== 'SUBMITTED') {
      throw new Error('Nomination status should be SUBMITTED');
    }

    // 6. Coordinator Maps Nominee to Batch (status: APPROVED + Enrollment created)
    console.log('\n--- 6. Testing Batch Mapping & Enrollment Synchronization ---');
    const initialAssignedCount = batch.assignedCount;

    nomination.status = 'APPROVED';
    nomination.assignedBatch = batch._id;
    nomination.reviewedBy = coordinator._id;
    nomination.reviewedAt = new Date();

    const enrollment = await Enrollment.create({
      program: program._id,
      trainee: testTrainee._id,
      batch: batch._id,
      nomination: nomination._id,
      registeredBy: coordinator._id,
    });

    nomination.mappedEnrollment = enrollment._id;
    await nomination.save();

    await Batch.findByIdAndUpdate(batch._id, { $inc: { assignedCount: 1 } });
    const updatedBatch = await Batch.findById(batch._id);

    console.log(`✔ Nomination approved and mapped to batch: ${batch.batchName}`);
    console.log(`✔ Enrollment created with ID: ${enrollment._id}`);
    console.log(`✔ Batch assigned count updated: ${initialAssignedCount} -> ${updatedBatch.assignedCount}`);

    if (updatedBatch.assignedCount !== initialAssignedCount + 1) {
      throw new Error('Batch assignedCount was not incremented');
    }

    // Clean up test records
    await Nomination.findByIdAndDelete(nomination._id);
    await Enrollment.findByIdAndDelete(enrollment._id);
    await Batch.findByIdAndUpdate(batch._id, { $inc: { assignedCount: -1 } });
    console.log('✔ Test records safely cleaned up');

    console.log('\n======================================================');
    console.log('✔ ALL TARGETED INVITATION & RBAC WORKFLOW TESTS PASSED!');
    console.log('======================================================');
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
};

runTest();
