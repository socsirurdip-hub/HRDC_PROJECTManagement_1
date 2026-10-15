import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, User, MapPin, GraduationCap, Award } from 'lucide-react';
import { enrollmentsApi } from '../../api/services';
import { formatDate } from '../../utils/helpers';
import type { Trainee, Enrollment } from '../../types';

interface TraineeDetailModalProps {
  trainee: Trainee;
  onClose: () => void;
}

const TraineeDetailModal: React.FC<TraineeDetailModalProps> = ({ trainee, onClose }) => {
  const { data: enrollmentsData, isLoading: loadingEnrollments } = useQuery({
    queryKey: ['enrollments-trainee', trainee._id],
    queryFn: () => enrollmentsApi.getByTrainee(trainee._id),
  });

  const enrollments: Enrollment[] = enrollmentsData?.data?.data || [];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        style={{ maxWidth: '850px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-primary">{trainee.traineeId}</span>
              <span className="badge badge-secondary">{trainee.socialCategory}</span>
              {trainee.isPWD && <span className="badge badge-warning">PWD</span>}
              {trainee.isMinority && <span className="badge badge-info">Minority</span>}
            </div>
            <h2 className="modal-title" style={{ fontSize: '1.25rem' }}>
              {trainee.firstName} {trainee.lastName}
            </h2>
          </div>
          <button className="btn btn-icon btn-secondary" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Key Trainee Info Grid */}
          <div className="grid grid-2" style={{ gap: '16px' }}>
            {/* Contact & Personal */}
            <div className="card" style={{ padding: '16px', background: 'var(--color-bg-secondary)' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-primary-light)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={16} /> Personal & Contact Details
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Gender:</span>
                  <span style={{ fontWeight: 500 }}>{trainee.gender}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Date of Birth:</span>
                  <span>{formatDate(trainee.dateOfBirth)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Email:</span>
                  <a href={`mailto:${trainee.email}`} style={{ color: 'var(--color-primary-light)' }}>{trainee.email}</a>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Phone:</span>
                  <span>{trainee.phone}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Area Type:</span>
                  <span>{trainee.domicileType}</span>
                </div>
              </div>
            </div>

            {/* Address & Academic */}
            <div className="card" style={{ padding: '16px', background: 'var(--color-bg-secondary)' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-primary-light)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <GraduationCap size={16} /> Academic & Professional
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Qualification:</span>
                  <span style={{ fontWeight: 500 }}>{trainee.highestQualification}</span>
                </div>
                {trainee.specialization && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Specialization:</span>
                    <span>{trainee.specialization}</span>
                  </div>
                )}
                {trainee.institution && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Institution:</span>
                    <span>{trainee.institution}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Employment:</span>
                  <span className="badge badge-info">{trainee.employmentStatus}</span>
                </div>
                {trainee.organization && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Organization:</span>
                    <span>{trainee.organization}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Location & Address */}
          <div className="card" style={{ padding: '16px', background: 'var(--color-bg-secondary)' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-primary-light)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={16} /> Residential Address
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0 }}>
              {[
                trainee.address?.street,
                trainee.address?.city,
                trainee.address?.district,
                trainee.address?.state,
                trainee.address?.pincode ? `PIN: ${trainee.address.pincode}` : ''
              ].filter(Boolean).join(', ') || 'Address not recorded'}
            </p>
          </div>

          {/* Enrolled Programs History */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} color="var(--color-primary-light)" /> Enrolled Training Programs ({enrollments.length})
            </h3>

            {loadingEnrollments ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-secondary)' }}>
                Loading enrollment history...
              </div>
            ) : enrollments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', background: 'var(--color-bg-secondary)', borderRadius: '8px', color: 'var(--color-text-secondary)' }}>
                No training programs enrolled yet.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Program Title</th>
                      <th>Enrolled On</th>
                      <th>Attendance</th>
                      <th>Status</th>
                      <th>Certificate</th>
                      <th>Score (Pre/Post)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((enr) => {
                      const programObj = typeof enr.program === 'object' ? enr.program : null;
                      return (
                        <tr key={enr._id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{programObj?.title || 'Training Program'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                              {programObj?.programCode}
                            </div>
                          </td>
                          <td style={{ fontSize: '0.85rem' }}>{formatDate(enr.enrollmentDate)}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ width: '48px', height: '6px', background: 'var(--color-bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div
                                  style={{
                                    width: `${enr.attendancePercentage}%`,
                                    height: '100%',
                                    background: enr.attendancePercentage >= 75 ? 'var(--color-success)' : 'var(--color-warning)',
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: '0.8rem' }}>{enr.attendancePercentage}%</span>
                            </div>
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                enr.completionStatus === 'Completed'
                                  ? 'badge-success'
                                  : enr.completionStatus === 'Attending'
                                  ? 'badge-info'
                                  : 'badge-secondary'
                              }`}
                            >
                              {enr.completionStatus}
                            </span>
                          </td>
                          <td>
                            {enr.certificateIssued ? (
                              <span className="badge badge-success" title={enr.certificateNumber}>
                                Issued ({enr.certificateNumber || 'Verified'})
                              </span>
                            ) : (
                              <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>Not Issued</span>
                            )}
                          </td>
                          <td style={{ fontSize: '0.85rem' }}>
                            {enr.preTestScore !== undefined || enr.postTestScore !== undefined ? (
                              <span>
                                {enr.preTestScore ?? '-'} / {enr.postTestScore ?? '-'}
                                {enr.scoreImprovement ? ` (+${enr.scoreImprovement}%)` : ''}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TraineeDetailModal;
