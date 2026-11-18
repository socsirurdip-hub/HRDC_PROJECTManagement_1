import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar, Users, Award, CheckCircle, AlertTriangle,
  Clock, ShieldCheck, Printer
} from 'lucide-react';
import { nominationsApi } from '../../api/services';
import { formatDate, getErrorMessage } from '../../utils/helpers';
import toast from 'react-hot-toast';

const ProgramNominationPage: React.FC = () => {
  const { idOrCode } = useParams<{ idOrCode: string }>();

  const [loading, setLoading] = useState(true);
  const [programData, setProgramData] = useState<any | null>(null);
  const [nominationStatus, setNominationStatus] = useState<string>('OPEN');

  // Step 1: Verification via OTP
  const [identifier, setIdentifier] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [verifiedTrainee, setVerifiedTrainee] = useState<any | null>(null);

  // Step 2: Willingness to Participate Form
  const [statementOfPurpose, setStatementOfPurpose] = useState('');
  const [reportingOfficerName, setReportingOfficerName] = useState('');
  const [reportingOfficerDesignation, setReportingOfficerDesignation] = useState('');
  const [reportingOfficerEmail, setReportingOfficerEmail] = useState('');
  const [accommodationRequired, setAccommodationRequired] = useState(false);
  const [specialAssistance, setSpecialAssistance] = useState('');
  const [availabilityConfirmed, setAvailabilityConfirmed] = useState(false);

  // Step 3: Submission Result
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedNomination, setSubmittedNomination] = useState<any | null>(null);

  useEffect(() => {
    if (idOrCode) {
      loadProgram();
    }
  }, [idOrCode]);

  const loadProgram = async () => {
    try {
      setLoading(true);
      const res = await nominationsApi.getPublicInvite(idOrCode!);
      setProgramData(res.data.data.program);
      setNominationStatus(res.data.data.nominationStatus);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast.error('Please enter your registered government email or mobile number.');
      return;
    }

    try {
      setIsSendingOtp(true);
      const res = await nominationsApi.sendOtp(identifier.trim(), programData._id);
      setOtpSent(true);
      toast.success(res.data.message || 'Passcode dispatched.');
      if (res.data.devOtp) {
        setDevOtpHint(res.data.devOtp);
        setOtp(res.data.devOtp); // Auto-populate for seamless development testing
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      toast.error('Please enter the 6-digit passcode.');
      return;
    }

    try {
      setIsVerifyingOtp(true);
      const res = await nominationsApi.verifyOtp(identifier.trim(), otp.trim(), programData._id);
      setVerifiedTrainee(res.data.data.trainee);
      toast.success('Identity verified! Please complete your willingness details below.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSubmitNomination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!availabilityConfirmed) {
      toast.error('Please confirm your full availability for the program.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        programId: programData._id,
        traineeId: verifiedTrainee._id,
        otp: otp.trim(),
        willingnessDetails: {
          statementOfPurpose: statementOfPurpose.trim(),
          reportingOfficerName: reportingOfficerName.trim(),
          reportingOfficerDesignation: reportingOfficerDesignation.trim(),
          reportingOfficerEmail: reportingOfficerEmail.trim(),
          accommodationRequired,
          specialAssistance: specialAssistance.trim() || undefined,
        },
      };

      const res = await nominationsApi.submit(payload);
      setSubmittedNomination(res.data.data);
      toast.success('Nomination submitted successfully!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-primary)', color: 'var(--color-text-secondary)' }}>
        Loading Training Program Information...
      </div>
    );
  }

  if (!programData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-primary)', padding: '20px' }}>
        <AlertTriangle size={48} style={{ color: 'var(--color-text-warning)', marginBottom: '16px' }} />
        <h2 style={{ color: 'var(--color-text-primary)' }}>Training Program Not Found</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '20px' }}>The invitation link may be invalid or expired.</p>
        <Link to="/login" className="btn btn-primary">Return to Portal</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)', paddingBottom: '60px' }}>
      {/* Top Header */}
      <header style={{
        background: 'linear-gradient(180deg, rgba(15,25,55,0.95) 0%, rgba(10,15,30,0.9) 100%)',
        borderBottom: '1px solid var(--color-border)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img src="/csir-hrdc-logo.svg" alt="CSIR HRDC" style={{ height: '42px' }} />
          <div>
            <h1 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              CSIR-HRDC Program Nomination Portal
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
              Official Program Invitation & Willingness Submission
            </p>
          </div>
        </div>
        <Link to="/login" className="btn btn-secondary btn-sm">
          Coordinator Login
        </Link>
      </header>

      <div style={{ maxWidth: '880px', margin: '30px auto', padding: '0 20px' }}>
        {/* Program Overview Banner */}
        <div className="card" style={{ padding: '24px', marginBottom: '24px', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div>
              <span className="badge badge-primary font-mono" style={{ marginBottom: '8px' }}>
                {programData.programCode}
              </span>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                {programData.title}
              </h2>
            </div>
            <div>
              {nominationStatus === 'OPEN' ? (
                <span className="badge badge-success" style={{ fontSize: '12px', padding: '6px 12px' }}>
                  Nominations Open
                </span>
              ) : (
                <span className="badge badge-danger" style={{ fontSize: '12px', padding: '6px 12px' }}>
                  Nominations {nominationStatus.replace(/_/g, ' ')}
                </span>
              )}
            </div>
          </div>

          <p style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', lineHeight: '1.6', marginBottom: '20px' }}>
            {programData.description || 'Comprehensive training session organized by CSIR-HRDC.'}
          </p>

          <div className="grid-3" style={{ fontSize: '13px', gap: '14px', background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={16} style={{ color: 'var(--color-secondary)' }} />
              <div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>PROGRAM DATES</div>
                <strong>{formatDate(programData.startDate)} - {formatDate(programData.endDate)}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} style={{ color: 'var(--color-secondary)' }} />
              <div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>MODE & VENUE</div>
                <strong>{programData.mode} · {programData.venue || programData.state || 'HRDC Campus'}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={16} style={{ color: 'var(--color-secondary)' }} />
              <div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>COORDINATOR</div>
                <strong>{programData.coordinatorName || 'HRDC Program Coordinator'}</strong>
              </div>
            </div>
          </div>

          {programData.nominationEndDate && (
            <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--color-text-warning)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} />
              Last Date to Submit Willingness / Nomination: <strong>{formatDate(programData.nominationEndDate)}</strong>
            </div>
          )}
        </div>

        {/* Successful Submission View */}
        {submittedNomination ? (
          <div className="card" style={{ padding: '36px', textAlign: 'center', border: '1px solid var(--color-success)' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(39, 174, 96, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: 'var(--color-success)',
            }}>
              <CheckCircle size={36} />
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
              Nomination Willingness Submitted!
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', maxWidth: '580px', margin: '0 auto 24px' }}>
              Thank you, <strong>{verifiedTrainee.fullName}</strong>. Your nomination has been forwarded to the Program Coordinator for screening and batch assignment.
            </p>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              maxWidth: '520px',
              margin: '0 auto 30px',
              textAlign: 'left',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Nomination Reference ID:</span>
                <span className="font-mono" style={{ fontWeight: 700, color: 'var(--color-secondary)' }}>
                  {submittedNomination._id}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Program Code:</span>
                <span className="font-mono" style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {programData.programCode}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Trainee ID:</span>
                <span className="font-mono" style={{ color: 'var(--color-text-primary)' }}>
                  {verifiedTrainee.traineeId}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Endorsement / Officer:</span>
                <span style={{ color: 'var(--color-text-primary)', fontSize: '13px' }}>
                  {reportingOfficerName} ({reportingOfficerDesignation})
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Hostel Accommodation:</span>
                <span style={{ color: 'var(--color-text-primary)', fontSize: '13px' }}>
                  {accommodationRequired ? 'Requested' : 'Not Required'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
                <Printer size={16} /> Print Confirmation
              </button>
              <Link to="/login" className="btn btn-primary">
                Done
              </Link>
            </div>
          </div>
        ) : !verifiedTrainee ? (
          /* Step 1: Trainee Verification with OTP */
          <div className="card" style={{ padding: '32px', border: '1px solid var(--color-border)' }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-secondary)', marginBottom: '6px' }}>
                <ShieldCheck size={20} />
                <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Step 1 of 2: Master Trainee Verification
                </span>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                Identify Yourself in the HRDC Master Directory
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Please enter your registered government email address or mobile number to authenticate via a one-time passcode.
              </p>
            </div>

            {!otpSent ? (
              <form onSubmit={handleSendOtp} style={{ maxWidth: '520px' }}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label required">Registered Govt Email or Mobile Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. yourname@csir.res.in or 10-digit mobile"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
                    Must match your approved profile in the CSIR-HRDC Master Trainee Directory.
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button type="submit" className="btn btn-primary" disabled={isSendingOtp}>
                    {isSendingOtp ? 'Sending Passcode...' : 'Send Verification Passcode'}
                  </button>
                  <Link to="/register-trainee" className="btn btn-secondary" style={{ fontSize: '13px' }}>
                    Not Registered in Master List? Register Here
                  </Link>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} style={{ maxWidth: '460px' }}>
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(39, 174, 96, 0.08)',
                  border: '1px solid rgba(39, 174, 96, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '20px',
                  fontSize: '13px',
                  color: 'var(--color-text-primary)',
                }}>
                  A 6-digit one-time passcode (OTP) has been generated for <strong>{identifier}</strong>.
                </div>

                {devOtpHint && (
                  <div style={{
                    padding: '8px 12px',
                    background: 'rgba(200, 150, 62, 0.1)',
                    border: '1px dashed var(--color-secondary)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: 'var(--color-secondary)',
                    marginBottom: '16px',
                  }}>
                    Development Test Passcode: <strong>{devOtpHint}</strong> (Auto-filled)
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label required">Enter 6-Digit Passcode</label>
                  <input
                    type="text"
                    className="form-input font-mono"
                    placeholder="6-digit OTP"
                    maxLength={6}
                    style={{ fontSize: '18px', letterSpacing: '4px', textAlign: 'center' }}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button type="submit" className="btn btn-primary" disabled={isVerifyingOtp}>
                    {isVerifyingOtp ? 'Verifying...' : 'Verify Passcode & Proceed'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => { setOtpSent(false); setOtp(''); }}
                  >
                    Change Identifier
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* Step 2: Willingness to Participate & Endorsement Form */
          <div className="card" style={{ padding: '32px', border: '1px solid var(--color-border)' }}>
            {/* Verified Candidate Badge */}
            <div style={{
              background: 'rgba(36, 85, 181, 0.12)',
              border: '1px solid rgba(100, 130, 200, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                  VERIFIED MASTER TRAINEE PROFILE
                </div>
                <h4 style={{ margin: '4px 0 0', fontSize: '16px', color: 'var(--color-text-primary)' }}>
                  {verifiedTrainee.fullName} <span className="badge badge-primary font-mono">{verifiedTrainee.traineeId}</span>
                </h4>
                <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  {verifiedTrainee.designation} · {verifiedTrainee.organization} · {verifiedTrainee.email}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setVerifiedTrainee(null)}
              >
                Switch Account
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-secondary)', marginBottom: '6px' }}>
                <Award size={20} />
                <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Step 2 of 2: Willingness to Participate & Official Endorsement
                </span>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                Program Participation Form
              </h3>
            </div>

            <form onSubmit={handleSubmitNomination} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Statement of Purpose */}
              <div className="form-group">
                <label className="form-label">
                  Relevance to Job & Learning Objectives (Statement of Purpose)
                </label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Briefly state how this training program aligns with your laboratory duties, research goals, or career development..."
                  value={statementOfPurpose}
                  onChange={(e) => setStatementOfPurpose(e.target.value)}
                />
              </div>

              {/* Reporting Officer Information (Nomination Endorsement) */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 12px' }}>
                  Controlling / Reporting Officer Details (Endorsement)
                </h4>

                <div className="grid-3" style={{ gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label required">Reporting Officer Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Dr. V. K. Patel"
                      value={reportingOfficerName}
                      onChange={(e) => setReportingOfficerName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Officer Designation</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Head of Division / Director"
                      value={reportingOfficerDesignation}
                      onChange={(e) => setReportingOfficerDesignation(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Officer Official Email</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="e.g. hod@ncl.res.in"
                      value={reportingOfficerEmail}
                      onChange={(e) => setReportingOfficerEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Logistics & Special Needs */}
              <div className="grid-2" style={{ gap: '16px' }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', color: 'var(--color-text-primary)' }}>
                    <input
                      type="checkbox"
                      checked={accommodationRequired}
                      onChange={(e) => setAccommodationRequired(e.target.checked)}
                    />
                    <strong>Require Hostel Accommodation</strong>
                  </label>
                  <p style={{ margin: '6px 0 0 24px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    Applies for offline sessions at CSIR-HRDC Ghaziabad campus (subject to hostel room availability).
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Special Needs / Assistance (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Dietary preferences, accessibility requirements, etc."
                    value={specialAssistance}
                    onChange={(e) => setSpecialAssistance(e.target.value)}
                  />
                </div>
              </div>

              {/* Final Willingness Checkbox */}
              <div style={{
                background: 'rgba(200, 150, 62, 0.05)',
                border: '1px solid rgba(200, 150, 62, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
              }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '13px', color: 'var(--color-text-primary)', lineHeight: '1.5' }}>
                  <input
                    type="checkbox"
                    checked={availabilityConfirmed}
                    onChange={(e) => setAvailabilityConfirmed(e.target.checked)}
                    style={{ marginTop: '2px' }}
                    required
                  />
                  <span>
                    <strong>I confirm my willingness and availability:</strong> I have obtained verbal/written concurrence from my controlling authority to attend this entire program ({formatDate(programData.startDate)} to {formatDate(programData.endDate)}) without interruption.
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ minWidth: '220px' }}
                  disabled={isSubmitting || !availabilityConfirmed}
                >
                  {isSubmitting ? 'Submitting Nomination...' : 'Submit Willingness & Nomination'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgramNominationPage;
