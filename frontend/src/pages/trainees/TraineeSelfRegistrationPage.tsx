import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  UserCheck, Shield, AlertTriangle, CheckCircle, ArrowLeft,
  MapPin, GraduationCap, Briefcase, Printer
} from 'lucide-react';
import { traineesApi } from '../../api/services';
import { getErrorMessage } from '../../utils/helpers';
import toast from 'react-hot-toast';

const TRUSTED_DOMAINS_REGEX = /@([a-zA-Z0-9-]+\.)*(csir\.res\.in|gov\.in|res\.in|nic\.in)$/i;

const TraineeSelfRegistrationPage: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'Male',
    socialCategory: 'General',
    isMinority: false,
    isPWD: false,
    pwdType: '',
    domicileType: 'Urban',
    email: '',
    phone: '',
    alternatePhone: '',
    'address.street': '',
    'address.city': '',
    'address.district': '',
    'address.state': 'Delhi',
    'address.pincode': '',
    highestQualification: 'Post Graduate',
    specialization: '',
    institution: '',
    employmentStatus: 'Government Employee',
    organization: '',
    designation: '',
    employeeId: '',
  });

  const [declaration, setDeclaration] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<any | null>(null);

  // Status lookup state
  const [isLookupMode, setIsLookupMode] = useState(false);
  const [lookupIdentifier, setLookupIdentifier] = useState('');
  const [lookupResult, setLookupResult] = useState<any | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const email = formData.email.trim();
  const isTrustedEmail = email ? TRUSTED_DOMAINS_REGEX.test(email) : true;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!declaration) {
      toast.error('Please accept the declaration before submitting.');
      return;
    }

    try {
      setIsSubmitting(true);
      // Format address object properly for backend
      const payload: Record<string, any> = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender,
        socialCategory: formData.socialCategory,
        isMinority: formData.isMinority,
        isPWD: formData.isPWD,
        pwdType: formData.isPWD ? formData.pwdType : undefined,
        domicileType: formData.domicileType,
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        alternatePhone: formData.alternatePhone.trim() || undefined,
        address: {
          street: formData['address.street'] || '',
          city: formData['address.city'] || '',
          district: formData['address.district'] || '',
          state: formData['address.state'] || 'Delhi',
          pincode: formData['address.pincode'] || '',
        },
        highestQualification: formData.highestQualification,
        specialization: formData.specialization || '',
        institution: formData.institution || '',
        employmentStatus: formData.employmentStatus,
        organization: formData.organization || '',
        designation: formData.designation || '',
        employeeId: formData.employeeId || '',
      };

      const res = await traineesApi.register(payload);
      setSubmittedData(res.data.data);
      toast.success('Registration submitted successfully!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupIdentifier.trim()) {
      toast.error('Please enter your email or mobile number');
      return;
    }
    try {
      setIsLookingUp(true);
      const res = await traineesApi.lookup(lookupIdentifier.trim());
      setLookupResult(res.data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLookingUp(false);
    }
  };

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
          <img src="/csir-hrdc-logo.svg" alt="CSIR HRDC" style={{ height: '44px' }} />
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              CSIR-HRDC Training Portal
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
              Human Resource Development Centre, Council of Scientific & Industrial Research
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => { setIsLookupMode(!isLookupMode); setLookupResult(null); }}
          >
            {isLookupMode ? 'Back to Registration' : 'Check Application Status'}
          </button>
          <Link to="/login" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={14} /> Back to Login
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: '900px', margin: '30px auto', padding: '0 20px' }}>
        {/* Status Lookup View */}
        {isLookupMode ? (
          <div className="card" style={{ padding: '30px', border: '1px solid var(--color-border-active)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
              Check Registration Status
            </h2>
            <p style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
              Enter your registered government email address or mobile number to track your Master Trainee approval status.
            </p>

            <form onSubmit={handleLookup} style={{ display: 'flex', gap: '12px', maxWidth: '500px', marginBottom: '24px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Enter email or 10-digit mobile"
                value={lookupIdentifier}
                onChange={(e) => setLookupIdentifier(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary" disabled={isLookingUp}>
                {isLookingUp ? 'Searching...' : 'Track Status'}
              </button>
            </form>

            {lookupResult && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)'
              }}>
                {!lookupResult.registered ? (
                  <div style={{ color: 'var(--color-text-warning)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={18} />
                    <span>No trainee registration found with identifier <strong>{lookupIdentifier}</strong>. Please complete the registration below.</span>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <h4 style={{ margin: 0, fontSize: '16px', color: 'var(--color-text-primary)' }}>
                        {lookupResult.fullName || `${lookupResult.firstName} ${lookupResult.lastName}`}
                      </h4>
                      <span className={`badge ${
                        lookupResult.approvalStatus === 'APPROVED' ? 'badge-success' :
                        lookupResult.approvalStatus === 'REJECTED' ? 'badge-danger' : 'badge-warning'
                      }`}>
                        Status: {lookupResult.approvalStatus}
                      </span>
                    </div>

                    <div className="grid-2" style={{ fontSize: '13px', gap: '12px' }}>
                      <div><strong>Trainee ID / App ID:</strong> <span className="font-mono">{lookupResult.traineeId}</span></div>
                      <div><strong>Organization:</strong> {lookupResult.organization || '-'}</div>
                      <div><strong>Designation:</strong> {lookupResult.designation || '-'}</div>
                      <div><strong>Registered Email:</strong> {lookupResult.email}</div>
                    </div>

                    {lookupResult.approvalStatus === 'APPROVED' && (
                      <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(39, 174, 96, 0.1)', border: '1px solid rgba(39, 174, 96, 0.3)', borderRadius: '6px', color: '#27AE60', fontSize: '13px' }}>
                        <CheckCircle size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                        Your profile is active in the Master Trainee Directory. You are eligible to submit nominations for scheduled training programs!
                      </div>
                    )}

                    {lookupResult.approvalStatus === 'PENDING' && (
                      <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(243, 156, 18, 0.1)', border: '1px solid rgba(243, 156, 18, 0.3)', borderRadius: '6px', color: '#F39C12', fontSize: '13px' }}>
                        <AlertTriangle size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                        Your registration has been received and is under review by the HRDC Super Administrator. You will be able to nominate once approved.
                      </div>
                    )}

                    {lookupResult.approvalStatus === 'REJECTED' && (
                      <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(231, 76, 60, 0.1)', border: '1px solid rgba(231, 76, 60, 0.3)', borderRadius: '6px', color: '#E74C3C', fontSize: '13px' }}>
                        <strong>Rejection Reason:</strong> {lookupResult.rejectionReason || 'Verification criteria not met.'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : submittedData ? (
          /* Submission Success State */
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
              Registration Submitted Successfully!
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', maxWidth: '580px', margin: '0 auto 24px' }}>
              Your profile has been placed in the HRDC Master Trainee pending queue for Super Administrator verification.
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
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Application Tracking ID:</span>
                <span className="font-mono" style={{ fontWeight: 700, color: 'var(--color-secondary)' }}>
                  {submittedData.traineeId}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Applicant Name:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '13px' }}>
                  {submittedData.firstName} {submittedData.lastName}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Registered Email:</span>
                <span style={{ color: 'var(--color-text-primary)', fontSize: '13px' }}>{submittedData.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Initial Status:</span>
                <span className="badge badge-warning">Pending Super Admin Approval</span>
              </div>

              {submittedData.domainWarning && (
                <div style={{
                  marginTop: '16px',
                  padding: '10px 12px',
                  background: 'rgba(243, 156, 18, 0.1)',
                  border: '1px solid rgba(243, 156, 18, 0.3)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: 'var(--color-warning)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertTriangle size={16} />
                  <span>Your email domain is flagged for manual government employment verification.</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
                <Printer size={16} /> Print Acknowledgement
              </button>
              <Link to="/login" className="btn btn-primary">
                Return to Portal
              </Link>
            </div>
          </div>
        ) : (
          /* Main Registration Form */
          <div className="card" style={{ padding: '32px', border: '1px solid var(--color-border)' }}>
            <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-secondary)', marginBottom: '6px' }}>
                <Shield size={20} />
                <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  CSIR-HRDC Master Trainee Directory
                </span>
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                One-Time Trainee Self-Registration
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Register yourself in the master directory once. After Super Admin verification, you can easily submit nominations for CSIR-HRDC training programs with a single click.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Section 1: Official Identity & Credentials */}
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <UserCheck size={18} style={{ color: 'var(--color-secondary)' }} />
                  1. Official Identity & Contact Information
                </h3>

                <div className="grid-2" style={{ gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label className="form-label required">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      className="form-input"
                      placeholder="e.g. Dr. Rajesh"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      className="form-input"
                      placeholder="e.g. Kumar"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid-2" style={{ gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label className="form-label required">Government / Institutional Email</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="email"
                        name="email"
                        className="form-input"
                        placeholder="e.g. rajesh@ncl.res.in, rajesh@gov.in"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    {/* Live Domain Validation Indicator */}
                    {email && (
                      <div style={{ marginTop: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isTrustedEmail ? (
                          <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={14} /> Official Govt/CSIR Domain Verified (@csir.res.in, @gov.in, @res.in, @nic.in)
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertTriangle size={14} /> Non-Government Domain: Requires manual Super Admin approval before activation.
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Primary Mobile Number (Unique)</label>
                    <input
                      type="tel"
                      name="phone"
                      className="form-input"
                      placeholder="10-digit mobile number"
                      pattern="[0-9]{10}"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid-3" style={{ gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Alternate Phone (Optional)</label>
                    <input
                      type="tel"
                      name="alternatePhone"
                      className="form-input"
                      placeholder="Alternate phone"
                      value={formData.alternatePhone}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      className="form-input"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Gender</label>
                    <select name="gender" className="form-select" value={formData.gender} onChange={handleChange} required>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Transgender">Transgender</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Institutional & Employment Details */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <Briefcase size={18} style={{ color: 'var(--color-secondary)' }} />
                  2. Institutional & Employment Details
                </h3>

                <div className="grid-2" style={{ gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label className="form-label required">Employment Status</label>
                    <select
                      name="employmentStatus"
                      className="form-select"
                      value={formData.employmentStatus}
                      onChange={handleChange}
                      required
                    >
                      <option value="Government Employee">Government Employee</option>
                      <option value="PSU Employee">PSU Employee</option>
                      <option value="Autonomous Body">Autonomous Body / CSIR Lab</option>
                      <option value="Private Sector">Private Sector</option>
                      <option value="Self-Employed">Self-Employed</option>
                      <option value="Student">Student / Research Scholar</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Organization / Lab Name</label>
                    <input
                      type="text"
                      name="organization"
                      className="form-input"
                      placeholder="e.g. CSIR-National Chemical Laboratory, Pune"
                      value={formData.organization}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid-2" style={{ gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label required">Designation / Role</label>
                    <input
                      type="text"
                      name="designation"
                      className="form-input"
                      placeholder="e.g. Principal Scientist, Technical Officer"
                      value={formData.designation}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Employee ID / Cadre (Optional)</label>
                    <input
                      type="text"
                      name="employeeId"
                      className="form-input"
                      placeholder="e.g. EMP-2024-987"
                      value={formData.employeeId}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Demographics & Social Category (GIGW 3.0 / DPDPA) */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <MapPin size={18} style={{ color: 'var(--color-secondary)' }} />
                  3. Demographics, Address & Inclusivity
                </h3>

                <div className="grid-3" style={{ gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label className="form-label required">Social Category</label>
                    <select
                      name="socialCategory"
                      className="form-select"
                      value={formData.socialCategory}
                      onChange={handleChange}
                      required
                    >
                      <option value="General">General</option>
                      <option value="OBC">OBC</option>
                      <option value="SC">SC</option>
                      <option value="ST">ST</option>
                      <option value="EWS">EWS</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Domicile Type</label>
                    <select
                      name="domicileType"
                      className="form-select"
                      value={formData.domicileType}
                      onChange={handleChange}
                      required
                    >
                      <option value="Urban">Urban</option>
                      <option value="Rural">Rural</option>
                      <option value="Semi-Urban">Semi-Urban</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label required">State of Posting/Residence</label>
                    <input
                      type="text"
                      name="address.state"
                      className="form-input"
                      placeholder="e.g. Maharashtra, Delhi"
                      value={formData['address.state']}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid-3" style={{ gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">City / Campus</label>
                    <input
                      type="text"
                      name="address.city"
                      className="form-input"
                      placeholder="e.g. Pune"
                      value={formData['address.city']}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">District</label>
                    <input
                      type="text"
                      name="address.district"
                      className="form-input"
                      placeholder="e.g. Pune"
                      value={formData['address.district']}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pincode</label>
                    <input
                      type="text"
                      name="address.pincode"
                      className="form-input"
                      placeholder="6-digit pincode"
                      value={formData['address.pincode']}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '30px', marginTop: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', color: 'var(--color-text-primary)' }}>
                    <input
                      type="checkbox"
                      name="isMinority"
                      checked={formData.isMinority}
                      onChange={handleChange}
                    />
                    Belongs to Minority Community
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', color: 'var(--color-text-primary)' }}>
                    <input
                      type="checkbox"
                      name="isPWD"
                      checked={formData.isPWD}
                      onChange={handleChange}
                    />
                    Person with Disability (PWD / Divyangjan)
                  </label>
                </div>

                {formData.isPWD && (
                  <div style={{ marginTop: '12px', maxWidth: '350px' }}>
                    <label className="form-label">Disability Category / Specification</label>
                    <input
                      type="text"
                      name="pwdType"
                      className="form-input"
                      placeholder="e.g. Orthopedic, Visual, Hearing"
                      value={formData.pwdType}
                      onChange={handleChange}
                    />
                  </div>
                )}
              </div>

              {/* Section 4: Educational Qualifications */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <GraduationCap size={18} style={{ color: 'var(--color-secondary)' }} />
                  4. Educational Qualifications
                </h3>

                <div className="grid-3" style={{ gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label required">Highest Qualification</label>
                    <select
                      name="highestQualification"
                      className="form-select"
                      value={formData.highestQualification}
                      onChange={handleChange}
                      required
                    >
                      <option value="PhD">PhD</option>
                      <option value="Post Graduate">Post Graduate (M.Tech / M.Sc / MBA)</option>
                      <option value="Graduate">Graduate (B.Tech / B.Sc / B.Com)</option>
                      <option value="Diploma">Diploma</option>
                      <option value="12th / HSC">12th / HSC</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Specialization / Discipline</label>
                    <input
                      type="text"
                      name="specialization"
                      className="form-input"
                      placeholder="e.g. Chemical Engineering, AI, HR"
                      value={formData.specialization}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">University / Institute</label>
                    <input
                      type="text"
                      name="institution"
                      className="form-input"
                      placeholder="e.g. IIT Bombay, Delhi University"
                      value={formData.institution}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Declaration & Submission */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                marginTop: '10px'
              }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                  <input
                    type="checkbox"
                    checked={declaration}
                    onChange={(e) => setDeclaration(e.target.checked)}
                    style={{ marginTop: '2px' }}
                    required
                  />
                  <span>
                    I hereby declare that the particulars furnished in this registration are true, complete and correct to the best of my knowledge and belief. I understand that my details are subject to verification by the CSIR-HRDC Super Administrator under official IT security & compliance policies.
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <Link to="/login" className="btn btn-secondary">
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ minWidth: '180px' }}
                  disabled={isSubmitting || !declaration}
                >
                  {isSubmitting ? 'Registering...' : 'Submit Registration'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default TraineeSelfRegistrationPage;
