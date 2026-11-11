const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const TrainingProgram = require('../models/TrainingProgram');
const Trainee = require('../models/Trainee');
const Enrollment = require('../models/Enrollment');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { createAuditLog } = require('../middleware/audit');
const { maskPhone, maskEmail } = require('../utils/crypto');

/**
 * @desc    Export programs report as Excel/CSV/PDF with selectable columns
 * @route   GET /api/reports/programs
 * @access  Private
 */
const exportProgramsReport = asyncHandler(async (req, res, next) => {
  const { format = 'excel', status, startDate, endDate, columns } = req.query;

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

  // Available column definitions
  const ALL_PROGRAM_COLUMNS = [
    { key: 'programCode', label: 'Program Code', width: 15, getVal: (p) => p.programCode || '' },
    { key: 'title', label: 'Title', width: 35, getVal: (p) => p.title || '' },
    { key: 'category', label: 'Category', width: 22, getVal: (p) => p.category || '' },
    { key: 'mode', label: 'Mode', width: 12, getVal: (p) => p.mode || '' },
    { key: 'state', label: 'State', width: 18, getVal: (p) => p.state || '' },
    { key: 'district', label: 'District', width: 18, getVal: (p) => p.district || '' },
    { key: 'startDate', label: 'Start Date', width: 14, getVal: (p) => p.startDate ? p.startDate.toISOString().slice(0, 10) : '' },
    { key: 'endDate', label: 'End Date', width: 14, getVal: (p) => p.endDate ? p.endDate.toISOString().slice(0, 10) : '' },
    { key: 'durationDays', label: 'Duration (Days)', width: 15, getVal: (p) => p.durationDays || '' },
    { key: 'status', label: 'Status', width: 14, getVal: (p) => p.status || '' },
    { key: 'maxParticipants', label: 'Max Participants', width: 18, getVal: (p) => p.maxParticipants || '' },
    { key: 'enrolledCount', label: 'Enrolled', width: 12, getVal: (p) => p.enrolledCount || 0 },
    { key: 'completedCount', label: 'Completed', width: 12, getVal: (p) => p.completedCount || 0 },
    { key: 'completionRate', label: 'Completion %', width: 15, getVal: (p) => `${p.completionRate || 0}%` },
    { key: 'createdBy', label: 'Created By', width: 22, getVal: (p) => p.createdBy?.name || '' },
  ];

  const selectedColKeys = columns ? columns.split(',').map((c) => c.trim()) : ALL_PROGRAM_COLUMNS.map((c) => c.key);
  const activeCols = ALL_PROGRAM_COLUMNS.filter((c) => selectedColKeys.includes(c.key));
  const finalCols = activeCols.length > 0 ? activeCols : ALL_PROGRAM_COLUMNS;

  if (format === 'csv') {
    const headers = finalCols.map((c) => c.label).join(',') + '\n';
    const rows = programs
      .map((p) => finalCols.map((c) => `"${String(c.getVal(p)).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=programs_report.csv');
    return res.status(200).send(headers + rows);
  }

  // PDF Export with dynamic columns
  if (format === 'pdf') {
    const doc = new PDFDocument({ margin: 25, size: 'A4', layout: 'landscape' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=programs_report.pdf');
    doc.pipe(res);

    // Header
    doc.fontSize(15).fillColor('#1B3A7A').text('CSIR - Human Resource Development Centre', 25, 25, { align: 'center', width: 790 });
    doc.fontSize(9.5).fillColor('#64748B').text('Training Programs Official Report | Government of India', 25, 43, { align: 'center', width: 790 });
    doc.fontSize(7.5).fillColor('#94A3B8').text(`Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`, 25, 60, { align: 'right', width: 790 });

    const totalWidth = 790;
    const colWidth = totalWidth / finalCols.length;

    const renderHeader = (headerY) => {
      doc.rect(25, headerY, totalWidth, 18).fill('#1B3A7A');
      doc.fillColor('#FFFFFF').fontSize(7.5);
      finalCols.forEach((col, i) => {
        doc.text(col.label, 25 + i * colWidth + 3, headerY + 4, { width: colWidth - 6, lineBreak: false });
      });
      return headerY + 22;
    };

    let currentY = renderHeader(78);

    doc.fillColor('#0F172A').fontSize(7);
    programs.forEach((p, idx) => {
      if (currentY > 530) {
        doc.addPage({ margin: 25, size: 'A4', layout: 'landscape' });
        currentY = renderHeader(30);
        doc.fillColor('#0F172A').fontSize(7);
      }

      if (idx % 2 === 1) {
        doc.rect(25, currentY - 2, totalWidth, 15).fill('#F8FAFC');
        doc.fillColor('#0F172A');
      }

      finalCols.forEach((col, i) => {
        doc.text(String(col.getVal(p)).slice(0, 25), 25 + i * colWidth + 3, currentY, { width: colWidth - 6, lineBreak: false });
      });

      currentY += 15;
    });

    await createAuditLog({
      user: req.user,
      action: 'EXPORT',
      resource: 'TrainingProgram',
      details: { format: 'pdf', count: programs.length, columns: selectedColKeys },
      ipAddress: req.ip,
    });

    doc.end();
    return;
  }

  // Excel export with dynamic columns
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CSIR-HRDC Portal';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Training Programs', {
    pageSetup: { orientation: 'landscape' },
  });

  sheet.columns = finalCols.map((c) => ({ header: c.label, key: c.key, width: c.width }));

  sheet.getRow(1).eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B4F72' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  programs.forEach((p) => {
    const rowData = {};
    finalCols.forEach((c) => {
      rowData[c.key] = c.getVal(p);
    });
    sheet.addRow(rowData);
  });

  await createAuditLog({
    user: req.user,
    action: 'EXPORT',
    resource: 'TrainingProgram',
    details: { format, count: programs.length, columns: selectedColKeys },
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
 * @desc    Export trainees report as Excel/CSV/PDF with selectable columns
 * @route   GET /api/reports/trainees
 * @access  Private
 */
const exportTraineesReport = asyncHandler(async (req, res, next) => {
  const { format = 'excel', gender, socialCategory, state, columns } = req.query;

  const query = {};
  if (gender) query.gender = gender;
  if (socialCategory) query.socialCategory = socialCategory;
  if (state) query['address.state'] = { $regex: state, $options: 'i' };

  const trainees = await Trainee.find(query).sort({ createdAt: -1 });

  const isElevatedAdmin = req.user?.role === 'super_admin';

  // Comprehensive Trainee Column Definitions
  const ALL_TRAINEE_COLUMNS = [
    { key: 'traineeId', label: 'Trainee ID', width: 15, getVal: (t) => t.traineeId || '' },
    { key: 'firstName', label: 'First Name', width: 16, getVal: (t) => t.firstName || '' },
    { key: 'lastName', label: 'Last Name', width: 16, getVal: (t) => t.lastName || '' },
    { key: 'gender', label: 'Gender', width: 12, getVal: (t) => t.gender || '' },
    { key: 'socialCategory', label: 'Category', width: 14, getVal: (t) => t.socialCategory || '' },
    { key: 'email', label: 'Email', width: 28, getVal: (t) => isElevatedAdmin ? (t.email || '') : maskEmail(t.email || '') },
    { key: 'phone', label: 'Phone', width: 16, getVal: (t) => isElevatedAdmin ? (t.phone || '') : maskPhone(t.phone || '') },
    { key: 'alternatePhone', label: 'Alt Phone', width: 16, getVal: (t) => isElevatedAdmin ? (t.alternatePhone || '') : maskPhone(t.alternatePhone || '') },
    { key: 'state', label: 'State', width: 18, getVal: (t) => t.address?.state || '' },
    { key: 'district', label: 'District', width: 18, getVal: (t) => t.address?.district || '' },
    { key: 'city', label: 'City', width: 16, getVal: (t) => t.address?.city || '' },
    { key: 'pincode', label: 'Pincode', width: 12, getVal: (t) => t.address?.pincode || '' },
    { key: 'highestQualification', label: 'Qualification', width: 18, getVal: (t) => t.highestQualification || '' },
    { key: 'specialization', label: 'Specialization', width: 20, getVal: (t) => t.specialization || '' },
    { key: 'institution', label: 'Institution', width: 25, getVal: (t) => t.institution || '' },
    { key: 'employmentStatus', label: 'Employment Status', width: 22, getVal: (t) => t.employmentStatus || '' },
    { key: 'organization', label: 'Organization', width: 24, getVal: (t) => t.organization || '' },
    { key: 'designation', label: 'Designation', width: 20, getVal: (t) => t.designation || '' },
    { key: 'isPWD', label: 'PWD Status', width: 12, getVal: (t) => t.isPWD ? 'Yes' : 'No' },
    { key: 'isMinority', label: 'Minority Status', width: 14, getVal: (t) => t.isMinority ? 'Yes' : 'No' },
    { key: 'domicileType', label: 'Domicile Type', width: 15, getVal: (t) => t.domicileType || '' },
  ];

  const selectedColKeys = columns ? columns.split(',').map((c) => c.trim()) : ALL_TRAINEE_COLUMNS.map((c) => c.key);
  const activeCols = ALL_TRAINEE_COLUMNS.filter((c) => selectedColKeys.includes(c.key));
  const finalCols = activeCols.length > 0 ? activeCols : ALL_TRAINEE_COLUMNS;

  if (format === 'csv') {
    const headers = finalCols.map((c) => c.label).join(',') + '\n';
    const rows = trainees
      .map((t) => finalCols.map((c) => `"${String(c.getVal(t)).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=trainees_report.csv');
    return res.status(200).send(headers + rows);
  }

  // PDF Export with dynamic columns
  if (format === 'pdf') {
    const doc = new PDFDocument({ margin: 25, size: 'A4', layout: 'landscape' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=trainees_report.pdf');
    doc.pipe(res);

    // Header
    doc.fontSize(15).fillColor('#1B3A7A').text('CSIR - Human Resource Development Centre', 25, 25, { align: 'center', width: 790 });
    doc.fontSize(9.5).fillColor('#64748B').text('Trainee Directory Official Report | DPDPA 2023 Compliant', 25, 43, { align: 'center', width: 790 });
    doc.fontSize(7.5).fillColor('#94A3B8').text(`Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`, 25, 60, { align: 'right', width: 790 });

    const totalWidth = 790;
    const colWidth = totalWidth / finalCols.length;

    const renderHeader = (headerY) => {
      doc.rect(25, headerY, totalWidth, 18).fill('#1B3A7A');
      doc.fillColor('#FFFFFF').fontSize(7.5);
      finalCols.forEach((col, i) => {
        doc.text(col.label, 25 + i * colWidth + 3, headerY + 4, { width: colWidth - 6, lineBreak: false });
      });
      return headerY + 22;
    };

    let currentY = renderHeader(78);

    doc.fillColor('#0F172A').fontSize(7);
    trainees.forEach((t, idx) => {
      if (currentY > 530) {
        doc.addPage({ margin: 25, size: 'A4', layout: 'landscape' });
        currentY = renderHeader(30);
        doc.fillColor('#0F172A').fontSize(7);
      }

      if (idx % 2 === 1) {
        doc.rect(25, currentY - 2, totalWidth, 15).fill('#F8FAFC');
        doc.fillColor('#0F172A');
      }

      finalCols.forEach((col, i) => {
        doc.text(String(col.getVal(t)).slice(0, 25), 25 + i * colWidth + 3, currentY, { width: colWidth - 6, lineBreak: false });
      });

      currentY += 15;
    });

    await createAuditLog({
      user: req.user,
      action: 'EXPORT',
      resource: 'Trainee',
      details: { format: 'pdf', count: trainees.length, columns: selectedColKeys },
      ipAddress: req.ip,
    });

    doc.end();
    return;
  }

  // Excel export with dynamic columns
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CSIR-HRDC Portal';
  const sheet = workbook.addWorksheet('Trainees', {
    pageSetup: { orientation: 'landscape' },
  });

  sheet.columns = finalCols.map((c) => ({ header: c.label, key: c.key, width: c.width }));

  sheet.getRow(1).eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF154360' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  trainees.forEach((t) => {
    const rowData = {};
    finalCols.forEach((c) => {
      rowData[c.key] = c.getVal(t);
    });
    sheet.addRow(rowData);
  });

  await createAuditLog({
    user: req.user,
    action: 'EXPORT',
    resource: 'Trainee',
    details: { format, count: trainees.length, columns: selectedColKeys },
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
