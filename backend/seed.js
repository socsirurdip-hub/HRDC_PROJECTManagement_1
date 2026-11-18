const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  await mongoose.connect(mongoUri);
  console.log('MongoDB Connected for seeding...');
};

const seedData = async () => {
  try {
    await connectDB();

    const User = require('./src/models/User');
    const TrainingProgram = require('./src/models/TrainingProgram');
    const Trainee = require('./src/models/Trainee');
    const Enrollment = require('./src/models/Enrollment');
    const Nomination = require('./src/models/Nomination');
    const Batch = require('./src/models/Batch');

    // Clear existing data
    await User.deleteMany({});
    await TrainingProgram.deleteMany({});
    await Trainee.deleteMany({});
    await Enrollment.deleteMany({});
    await Nomination.deleteMany({});
    await Batch.deleteMany({});

    // Create Super Admin
    const superAdmin = await User.create({
      name: 'Super Administrator',
      email: 'superadmin@csir-hrdc.in',
      password: 'HRDC@2024!',
      role: 'super_admin',
      department: 'IT Administration',
      phone: '9800000001',
    });

    // Create Admin Users
    const adminList = [
      {
        name: 'Dr. Rajesh Kumar',
        email: 'rajesh.kumar@csir-hrdc.in',
        password: 'Admin@2024!',
        role: 'admin',
        department: 'Training & Development',
        phone: '9800000002',
      },
      {
        name: 'Priya Sharma',
        email: 'priya.sharma@csir-hrdc.in',
        password: 'Admin@2024!',
        role: 'admin',
        department: 'HR Operations',
        phone: '9800000003',
      },
      {
        name: 'Amit Singh',
        email: 'amit.singh@csir-hrdc.in',
        password: 'Admin@2024!',
        role: 'viewer',
        department: 'Analytics',
        phone: '9800000004',
      },
    ];

    const admins = [];
    for (const adminData of adminList) {
      const adminUser = await User.create(adminData);
      admins.push(adminUser);
    }

    // Create Training Programs
    const programs = await TrainingProgram.insertMany([
      {
        programCode: 'HRDC-2024-001',
        title: 'Leadership Development Programme for Scientists',
        description: 'A comprehensive leadership training for senior scientists at CSIR labs.',
        category: 'Leadership Development',
        mode: 'Offline',
        venue: 'CSIR-HRDC Campus, Ghaziabad',
        state: 'Uttar Pradesh',
        district: 'Ghaziabad',
        startDate: new Date('2024-03-10'),
        endDate: new Date('2024-03-15'),
        coordinatorName: 'Dr. Rajesh Kumar',
        coordinatorEmail: 'rajesh.kumar@csir-hrdc.in',
        targetAudience: 'Senior Scientists, Group Leaders',
        maxParticipants: 40,
        status: 'Completed',
        enrolledCount: 38,
        completedCount: 35,
        createdBy: superAdmin._id,
      },
      {
        programCode: 'HRDC-2024-002',
        title: 'Digital Literacy & IT Skills Training',
        description: 'Hands-on training on digital tools, data management, and cybersecurity.',
        category: 'IT & Digital Skills',
        mode: 'Hybrid',
        venue: 'CSIR-NIO, Goa',
        state: 'Goa',
        district: 'North Goa',
        startDate: new Date('2024-05-20'),
        endDate: new Date('2024-05-22'),
        coordinatorName: 'Priya Sharma',
        coordinatorEmail: 'priya.sharma@csir-hrdc.in',
        targetAudience: 'All staff',
        maxParticipants: 60,
        status: 'Completed',
        enrolledCount: 55,
        completedCount: 50,
        createdBy: admins[0]._id,
      },
      {
        programCode: 'HRDC-2024-003',
        title: 'Research Methodology & Scientific Writing',
        description: 'Advanced workshop on research design, data analysis, and paper writing.',
        category: 'Research Methodology',
        mode: 'Online',
        venue: 'Virtual Platform',
        state: 'Delhi',
        district: 'New Delhi',
        startDate: new Date('2024-07-08'),
        endDate: new Date('2024-07-12'),
        coordinatorName: 'Dr. Rajesh Kumar',
        coordinatorEmail: 'rajesh.kumar@csir-hrdc.in',
        targetAudience: 'Junior Scientists, Research Fellows',
        maxParticipants: 80,
        status: 'Ongoing',
        enrolledCount: 72,
        completedCount: 0,
        createdBy: admins[0]._id,
      },
      {
        programCode: 'HRDC-2024-004',
        title: 'Safety & Compliance Training',
        description: 'Essential safety protocols and regulatory compliance for lab personnel.',
        category: 'Safety',
        mode: 'Offline',
        venue: 'CSIR-CECRI, Karaikudi',
        state: 'Tamil Nadu',
        district: 'Sivaganga',
        startDate: new Date('2024-08-05'),
        endDate: new Date('2024-08-06'),
        coordinatorName: 'Priya Sharma',
        coordinatorEmail: 'priya.sharma@csir-hrdc.in',
        targetAudience: 'Laboratory Staff',
        maxParticipants: 50,
        status: 'Scheduled',
        enrolledCount: 30,
        completedCount: 0,
        allowNominations: true,
        nominationStartDate: new Date('2024-07-01'),
        nominationEndDate: new Date('2024-08-30'),
        hasBatches: true,
        batchesCount: 2,
        createdBy: admins[1]._id,
      },
      {
        programCode: 'HRDC-2024-005',
        title: 'Management Development Programme',
        description: 'Strategic management skills for administrative and managerial cadre.',
        category: 'Management Development',
        mode: 'Offline',
        venue: 'CSIR-HRDC, Ghaziabad',
        state: 'Uttar Pradesh',
        district: 'Ghaziabad',
        startDate: new Date('2024-09-16'),
        endDate: new Date('2024-09-20'),
        coordinatorName: 'Dr. Rajesh Kumar',
        coordinatorEmail: 'rajesh.kumar@csir-hrdc.in',
        targetAudience: 'Controllers, Administrative Officers',
        maxParticipants: 35,
        status: 'Scheduled',
        enrolledCount: 22,
        completedCount: 0,
        createdBy: superAdmin._id,
      },
    ]);

    // Create Trainees
    const traineesData = [
      {
        firstName: 'Ananya', lastName: 'Verma', gender: 'Female',
        socialCategory: 'General', domicileType: 'Urban',
        email: 'ananya.verma@example.com', phone: '9811111001',
        address: { state: 'Uttar Pradesh', district: 'Noida', city: 'Noida', pincode: '201301' },
        highestQualification: 'PhD', employmentStatus: 'Government Employee',
        organization: 'CSIR-NBRI', designation: 'Scientist-C', isPWD: false,
      },
      {
        firstName: 'Rohit', lastName: 'Mehra', gender: 'Male',
        socialCategory: 'OBC', domicileType: 'Urban',
        email: 'rohit.mehra@example.com', phone: '9811111002',
        address: { state: 'Delhi', district: 'South Delhi', city: 'New Delhi', pincode: '110049' },
        highestQualification: 'Post Graduate', employmentStatus: 'Government Employee',
        organization: 'CSIR-NIO', designation: 'Technical Officer', isPWD: false,
      },
      {
        firstName: 'Sunita', lastName: 'Devi', gender: 'Female',
        socialCategory: 'SC', domicileType: 'Rural',
        email: 'sunita.devi@example.com', phone: '9811111003',
        address: { state: 'Bihar', district: 'Patna', city: 'Patna', pincode: '800001' },
        highestQualification: 'Graduate', employmentStatus: 'Government Employee',
        organization: 'CSIR-IGIB', designation: 'Lab Assistant', isPWD: false,
      },
      {
        firstName: 'Mohammed', lastName: 'Irfan', gender: 'Male',
        socialCategory: 'OBC', domicileType: 'Urban', isMinority: true,
        email: 'irfan.m@example.com', phone: '9811111004',
        address: { state: 'Maharashtra', district: 'Pune', city: 'Pune', pincode: '411001' },
        highestQualification: 'Post Graduate', employmentStatus: 'Government Employee',
        organization: 'CSIR-NCL', designation: 'Scientist-B', isPWD: false,
      },
      {
        firstName: 'Kavitha', lastName: 'Rajan', gender: 'Female',
        socialCategory: 'ST', domicileType: 'Rural',
        email: 'kavitha.r@example.com', phone: '9811111005',
        address: { state: 'Tamil Nadu', district: 'Madurai', city: 'Madurai', pincode: '625001' },
        highestQualification: 'Graduate', employmentStatus: 'Government Employee',
        organization: 'CSIR-CECRI', designation: 'Junior Technician', isPWD: true, pwdType: 'Orthopedic',
      },
      {
        firstName: 'Deepak', lastName: 'Joshi', gender: 'Male',
        socialCategory: 'General', domicileType: 'Urban',
        email: 'deepak.joshi@example.com', phone: '9811111006',
        address: { state: 'Rajasthan', district: 'Jaipur', city: 'Jaipur', pincode: '302001' },
        highestQualification: 'PhD', employmentStatus: 'Government Employee',
        organization: 'CSIR-CEERI', designation: 'Principal Scientist', isPWD: false,
      },
      {
        firstName: 'Lakshmi', lastName: 'Pillai', gender: 'Female',
        socialCategory: 'General', domicileType: 'Urban',
        email: 'lakshmi.p@example.com', phone: '9811111007',
        address: { state: 'Kerala', district: 'Thiruvananthapuram', city: 'Trivandrum', pincode: '695001' },
        highestQualification: 'Post Graduate', employmentStatus: 'Government Employee',
        organization: 'CSIR-NIO', designation: 'Scientist-D', isPWD: false,
      },
      {
        firstName: 'Ravi', lastName: 'Kumar', gender: 'Male',
        socialCategory: 'SC', domicileType: 'Semi-Urban',
        email: 'ravi.kumar@example.com', phone: '9811111008',
        address: { state: 'Uttar Pradesh', district: 'Lucknow', city: 'Lucknow', pincode: '226001' },
        highestQualification: 'Graduate', employmentStatus: 'Government Employee',
        organization: 'CSIR-NBRI', designation: 'Multi-Tasking Staff', isPWD: false,
      },
    ];

    const traineesWithIds = traineesData.map((t, idx) => ({
      ...t,
      traineeId: `HRDC-${String(idx + 1).padStart(6, '0')}`,
      approvalStatus: 'APPROVED',
      registrationType: 'ADMIN_ENTRY',
      domainWarning: false,
    }));

    // Add sample self-registered trainees awaiting Super Admin approval
    traineesWithIds.push(
      {
        firstName: 'Dr. Sandeep',
        lastName: 'Kulkarni',
        gender: 'Male',
        socialCategory: 'General',
        domicileType: 'Urban',
        email: 'sandeep.k@ncl.res.in',
        phone: '9822001122',
        address: { state: 'Maharashtra', district: 'Pune', city: 'Pune', pincode: '411008' },
        highestQualification: 'PhD',
        employmentStatus: 'Government Employee',
        organization: 'CSIR-NCL',
        designation: 'Senior Scientist',
        isPWD: false,
        traineeId: 'HRDC-APP-000009',
        approvalStatus: 'PENDING',
        registrationType: 'SELF',
        domainWarning: false,
      },
      {
        firstName: 'Rahul',
        lastName: 'Verma',
        gender: 'Male',
        socialCategory: 'OBC',
        domicileType: 'Semi-Urban',
        email: 'rahul.verma@innovatetech.org',
        phone: '9833445566',
        address: { state: 'Delhi', district: 'South Delhi', city: 'New Delhi', pincode: '110016' },
        highestQualification: 'Post Graduate',
        employmentStatus: 'Private Sector',
        organization: 'InnovateTech Systems',
        designation: 'Research Associate',
        isPWD: false,
        traineeId: 'HRDC-APP-000010',
        approvalStatus: 'PENDING',
        registrationType: 'SELF',
        domainWarning: true,
        domainWarningDetails: 'Non-Government Email Domain: Manual verification required by Super Admin',
      }
    );

    const trainees = await Trainee.insertMany(traineesWithIds);

    // Create Batches for Safety & Compliance Training (HRDC-2024-004)
    const batches = await Batch.insertMany([
      {
        program: programs[3]._id,
        batchCode: 'BATCH-01',
        batchName: 'Batch 1 - Western & Southern Labs',
        startDate: new Date('2024-08-05'),
        endDate: new Date('2024-08-06'),
        maxCapacity: 25,
        assignedCount: 1,
        venueOrMeetingLink: 'CSIR-CECRI Lab Campus, Hall A',
        coordinatorInCharge: 'Priya Sharma',
        status: 'Scheduled',
        createdBy: admins[1]._id,
      },
      {
        program: programs[3]._id,
        batchCode: 'BATCH-02',
        batchName: 'Batch 2 - Northern & Eastern Labs',
        startDate: new Date('2024-08-12'),
        endDate: new Date('2024-08-13'),
        maxCapacity: 25,
        assignedCount: 0,
        venueOrMeetingLink: 'CSIR-CECRI Lab Campus, Hall B',
        coordinatorInCharge: 'Priya Sharma',
        status: 'Scheduled',
        createdBy: admins[1]._id,
      },
    ]);

    // Create a Sample Nomination for HRDC-2024-004
    await Nomination.create({
      program: programs[3]._id,
      trainee: trainees[0]._id, // Dr. Anita Sharma
      status: 'APPROVED',
      willingnessDetails: {
        statementOfPurpose: 'Eager to update laboratory biosafety practices and compliance protocols.',
        reportingOfficerName: 'Dr. V. K. Patel',
        reportingOfficerDesignation: 'Director, CSIR-CDRI',
        reportingOfficerEmail: 'director@cdri.res.in',
        accommodationRequired: true,
      },
      assignedBatch: batches[0]._id,
      reviewedBy: admins[1]._id,
      reviewedAt: new Date('2024-07-15'),
    });

    // Create Enrollments
    await Enrollment.insertMany([
      {
        program: programs[0]._id,
        trainee: trainees[0]._id,
        completionStatus: 'Completed',
        attendancePercentage: 100,
        certificateIssued: true,
        certificateNumber: 'HRDC-CERT-2024-001',
        preTestScore: 55,
        postTestScore: 82,
        feedback: {
          overallRating: 5, contentRating: 4, trainerRating: 5, venueRating: 4,
          comments: 'Excellent programme, very insightful!', wouldRecommend: true,
          submittedAt: new Date('2024-03-16'),
        },
        registeredBy: admins[0]._id,
      },
      {
        program: programs[0]._id,
        trainee: trainees[1]._id,
        completionStatus: 'Completed',
        attendancePercentage: 95,
        certificateIssued: true,
        certificateNumber: 'HRDC-CERT-2024-002',
        preTestScore: 60,
        postTestScore: 78,
        feedback: {
          overallRating: 4, contentRating: 4, trainerRating: 4, venueRating: 5,
          comments: 'Very well organized.', wouldRecommend: true,
          submittedAt: new Date('2024-03-16'),
        },
        registeredBy: admins[0]._id,
      },
      {
        program: programs[1]._id,
        trainee: trainees[2]._id,
        completionStatus: 'Completed',
        attendancePercentage: 100,
        certificateIssued: true,
        certificateNumber: 'HRDC-CERT-2024-003',
        preTestScore: 40,
        postTestScore: 70,
        registeredBy: admins[1]._id,
      },
      {
        program: programs[2]._id,
        trainee: trainees[3]._id,
        completionStatus: 'Attending',
        attendancePercentage: 60,
        registeredBy: admins[0]._id,
      },
      {
        program: programs[2]._id,
        trainee: trainees[4]._id,
        completionStatus: 'Attending',
        attendancePercentage: 80,
        registeredBy: admins[0]._id,
      },
      {
        program: programs[3]._id,
        trainee: trainees[5]._id,
        completionStatus: 'Enrolled',
        registeredBy: admins[1]._id,
      },
      {
        program: programs[4]._id,
        trainee: trainees[6]._id,
        completionStatus: 'Enrolled',
        registeredBy: admins[0]._id,
      },
      {
        program: programs[4]._id,
        trainee: trainees[7]._id,
        completionStatus: 'Enrolled',
        registeredBy: admins[0]._id,
      },
    ]);

    console.log('✅ Database seeded successfully!');
    console.log('📧 Super Admin Login: superadmin@csir-hrdc.in | Password: HRDC@2024!');
    console.log('📧 Admin Login: rajesh.kumar@csir-hrdc.in | Password: Admin@2024!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
