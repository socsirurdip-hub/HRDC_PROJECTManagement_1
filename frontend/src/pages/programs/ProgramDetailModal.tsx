import React from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { X, MapPin, Calendar, Users, Award, CheckCircle, Clock } from 'lucide-react';
import { enrollmentsApi } from '../../api/services';
import { formatDate } from '../../utils/helpers';
import type { TrainingProgram, Enrollment } from '../../types';

interface Props {
  program: TrainingProgram;
  onClose: () => void;
}

const ProgramDetailModal: React.FC<Props> = ({ program, onClose }) => {
  const { data: enrollData } = useQuery({
    queryKey: ['program-enrollments', program._id],
    queryFn: () => enrollmentsApi.getByProgram(program._id, { limit: 20 }).then((r) => r.data),
  });

  const enrollments: Enrollment[] = enrollData?.data || [];

  const statusColor =
    program.status === 'Completed' ? '#27AE60' :
    program.status === 'Ongoing' ? '#2980B9' :
    program.status === 'Cancelled' ? '#E74C3C' : '#C8963E';

  return createPortal(
    <div className="modal-overlay" id="program-detail-overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth: '820px', maxHeight: 'calc(100vh - 48px)' }}
        id="program-detail-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <span className="badge badge-primary font-mono" style={{ marginBottom: '6px' }}>{program.programCode}</span>
            <h3 className="modal-title" style={{ fontSize: '18px' }}>{program.title}</h3>
          </div>
          <button className="modal-close" onClick={onClose} id="close-detail-modal"><X size={16} /></button>
        </div>

        <div className="modal-body" style={{ maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}>
          {/* Status Banner */}
          <div style={{
            padding: '12px 16px',
            background: `${statusColor}18`,
            border: `1px solid ${statusColor}40`,
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <CheckCircle size={16} style={{ color: statusColor }} />
            <span style={{ color: statusColor, fontWeight: 600, fontSize: '13px' }}>{program.status}</span>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>
              · {program.mode} · {program.category}
            </span>
          </div>

          {/* Info Grid */}
          <div className="grid-2" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <DetailRow icon={Calendar} label="Start Date" value={formatDate(program.startDate)} />
              <DetailRow icon={Calendar} label="End Date" value={formatDate(program.endDate)} />
              <DetailRow icon={Clock} label="Duration" value={program.durationDays ? `${program.durationDays} days` : '-'} />
              <DetailRow icon={MapPin} label="State" value={program.state || '-'} />
              <DetailRow icon={MapPin} label="Venue" value={program.venue || '-'} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <DetailRow icon={Users} label="Max Participants" value={String(program.maxParticipants)} />
              <DetailRow icon={Users} label="Enrolled" value={String(program.enrolledCount)} />
              <DetailRow icon={Award} label="Completed" value={String(program.completedCount)} />
              <DetailRow icon={Users} label="Coordinator" value={program.coordinatorName || '-'} />
              <DetailRow icon={Users} label="Target Audience" value={program.targetAudience || '-'} />
            </div>
          </div>

          {/* Progress */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Enrollment Progress</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {program.enrolledCount}/{program.maxParticipants} ({Math.round((program.enrolledCount / program.maxParticipants) * 100)}%)
              </span>
            </div>
            <div className="progress-bar" style={{ height: '8px' }}>
              <div className="progress-fill" style={{ width: `${Math.min((program.enrolledCount / program.maxParticipants) * 100, 100)}%` }} />
            </div>
          </div>

          {program.description && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Description
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.7' }}>
                {program.description}
              </p>
            </div>
          )}

          {/* Enrolled Trainees */}
          {enrollments.length > 0 && (
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Enrolled Trainees ({enrollments.length})
              </h4>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Trainee ID</th>
                      <th>Name</th>
                      <th>Gender</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((e) => {
                      const t = e.trainee as { firstName?: string; lastName?: string; traineeId?: string; gender?: string; socialCategory?: string };
                      return (
                        <tr key={e._id}>
                          <td><span className="badge badge-muted font-mono">{t.traineeId}</span></td>
                          <td>{t.firstName} {t.lastName}</td>
                          <td style={{ fontSize: '12px' }}>{t.gender}</td>
                          <td><span className="badge badge-muted">{t.socialCategory}</span></td>
                          <td>
                            <span className={`badge ${
                              e.completionStatus === 'Completed' ? 'badge-success' :
                              e.completionStatus === 'Attending' ? 'badge-info' :
                              e.completionStatus === 'Dropped' ? 'badge-danger' : 'badge-primary'
                            }`}>{e.completionStatus}</span>
                          </td>
                          <td>{e.attendancePercentage}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} id="close-detail-footer">Close</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const DetailRow: React.FC<{ icon: React.ElementType; label: string; value: string }> = ({ icon: Icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
    <Icon size={14} style={{ color: 'var(--color-text-muted)', marginTop: '2px', flexShrink: 0 }} />
    <div>
      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</div>
      <div style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: 500 }}>{value}</div>
    </div>
  </div>
);

export default ProgramDetailModal;
