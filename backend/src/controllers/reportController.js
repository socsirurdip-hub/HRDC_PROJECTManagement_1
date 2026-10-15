const ExcelJS = require('exceljs');
const TrainingProgram = require('../models/TrainingProgram');
const Trainee = require('../models/Trainee');
const Enrollment = require('../models/Enrollment');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { createAuditLog } = require('../middleware/audit');

/**
 * @desc    Export programs report as Excel/CSV
 * @route   GET /api/reports/programs
 * @access  Private
 */
const exportProgramsReport = asyncHandler(async (req, res, next) => {
  const { format = 'excel', status, startDate, endDate } = req.query;

  const query = {};
  if (status) query.status = status;
  if (startDate || endDate) {
    query.startDate = {};
    if (startDate) query.startDate.$gte = new Date(startDate);
    if (endDate) query.startDate.$lte = new Date(endDate);
  }

  const programs = await TrainingProgram.find(query)
    .populate('createdBy', 'name email')
    .sort({ startDate: -1 });

  if (format === 'csv') {
    const headers = 'Program Code,Title,Category,Mode,State,Start Date,End Date,Duration,Status,Enrolled,Completed\n';
    const rows = programs
      .map(
        (p) =>
          `${p.programCode},"${p.title}",${p.category},${p.mode},${p.state || ''},${
            p.startDate?.toISOString().split('T')[0]
          },${p.endDate?.toISOString().split('T')[0]},${p.durationDays || ''},${p.status},${
            p.enrolledCount
          },${p.completedCount}`
      )
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=programs_report.csv');
    return res.status(200).send(headers + rows);
  }

  // Excel export
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CSIR-HRDC Portal';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Training Programs', {
    pageSetup: { orientation: 'landscape' },
  });

  sheet.columns = [
    { header: 'Program Code', key: 'programCode', width: 15 },
    { header: 'Title', key: 'title', width: 40 },
    { header: 'Category', key: 'category', width: 25 },
    { header: 'Mode', key: 'mode', width: 12 },
    { header: 'State', key: 'state', width: 20 },
    { header: 'District', key: 'district', width: 20 },
    { header: 'Start Date', key: 'startDate', width: 15 },
    { header: 'End Date', key: 'endDate', width: 15 },
    { header: 'Duration (Days)', key: 'durationDays', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Max Participants', key: 'maxParticipants', width: 18 },
    { header: 'Enrolled', key: 'enrolledCount', width: 12 },
    { header: 'Completed', key: 'completedCount', width: 12 },
    { header: 'Completion %', key: 'completionRate', width: 15 },
    { header: 'Created By', key: 'createdBy', width: 25 },
  ];

  // Header styling
  sheet.getRow(1).eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B4F72' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    };
  });

  programs.forEach((p) => {
    sheet.addRow({
      programCode: p.programCode,
      title: p.title,
      category: p.category,
      mode: p.mode,
      state: p.state || '',
      district: p.district || '',
      startDate: p.startDate ? p.startDate.toISOString().split('T')[0] : '',
      endDate: p.endDate ? p.endDate.toISOString().split('T')[0] : '',
      durationDays: p.durationDays || '',
      status: p.status,
      maxParticipants: p.maxParticipants,
      enrolledCount: p.enrolledCount,
      completedCount: p.completedCount,
      completionRate: `${p.completionRate || 0}%`,
      createdBy: p.createdBy?.name || '',
    });
  });

  await createAuditLog({
    user: req.user,
    action: 'EXPORT',
    resource: 'TrainingProgram',
    details: { format, count: programs.length },
    ipAddress: req.ip,
  });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', 'attachment; filename=programs_report.xlsx');
  await workbook.xlsx.write(res);
  res.end();
});

/**
 * @desc    Export trainees report as Excel/CSV
 * @route   GET /api/reports/trainees
 * @access  Private
 */
const exportTraineesReport = asyncHandler(async (req, res, next) => {
  const { format = 'excel', gender, socialCategory, state } = req.query;

  const query = {};
  if (gender) query.gender = gender;
  if (socialCategory) query.socialCategory = socialCategory;
  if (state) query['address.state'] = { $regex: state, $options: 'i' };

  const trainees = await Trainee.find(query).sort({ createdAt: -1 });

  if (format === 'csv') {
    const headers =
      'Trainee ID,First Name,Last Name,Gender,Category,Email,Phone,State,Qualification,Employment Status,Is PWD,Domicile\n';
    const rows = trainees
      .map(
        (t) =>
          `${t.traineeId},"${t.firstName}","${t.lastName}",${t.gender},${t.socialCategory},${t.email},${t.phone},${t.address?.state || ''},${t.highestQualification},${t.employmentStatus},${t.isPWD ? 'Yes' : 'No'},${t.domicileType}`
      )
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=trainees_report.csv');
    return res.status(200).send(headers + rows);
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CSIR-HRDC Portal';
  const sheet = workbook.addWorksheet('Trainees');

  sheet.columns = [
    { header: 'Trainee ID', key: 'traineeId', width: 15 },
    { header: 'First Name', key: 'firstName', width: 18 },
    { header: 'Last Name', key: 'lastName', width: 18 },
    { header: 'Gender', key: 'gender', width: 15 },
    { header: 'Social Category', key: 'socialCategory', width: 18 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Phone', key: 'phone', width: 15 },
    { header: 'State', key: 'state', width: 20 },
    { header: 'District', key: 'district', width: 20 },
    { header: 'Qualification', key: 'qualification', width: 20 },
    { header: 'Employment', key: 'employment', width: 25 },
    { header: 'Is PWD', key: 'isPWD', width: 10 },
    { header: 'Domicile', key: 'domicile', width: 15 },
  ];

  sheet.getRow(1).eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF154360' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  trainees.forEach((t) => {
    sheet.addRow({
      traineeId: t.traineeId,
      firstName: t.firstName,
      lastName: t.lastName,
      gender: t.gender,
      socialCategory: t.socialCategory,
      email: t.email,
      phone: t.phone,
      state: t.address?.state || '',
      district: t.address?.district || '',
      qualification: t.highestQualification,
      employment: t.employmentStatus,
      isPWD: t.isPWD ? 'Yes' : 'No',
      domicile: t.domicileType,
    });
  });

  await createAuditLog({
    user: req.user,
    action: 'EXPORT',
    resource: 'Trainee',
    details: { format, count: trainees.length },
    ipAddress: req.ip,
  });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', 'attachment; filename=trainees_report.xlsx');
  await workbook.xlsx.write(res);
  res.end();
});

module.exports = { exportProgramsReport, exportTraineesReport };
