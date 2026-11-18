import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Layers, Plus, Calendar, MapPin, Users,
  CheckCircle, UserPlus, Trash2, X, UserMinus
} from 'lucide-react';
import { batchesApi, nominationsApi } from '../../api/services';
import { formatDate, getErrorMessage } from '../../utils/helpers';
import toast from 'react-hot-toast';
import type { TrainingProgram, Batch, Nomination } from '../../types';

interface Props {
  program: TrainingProgram;
}

const ProgramBatchesTab: React.FC<Props> = ({ program }) => {
  const queryClient = useQueryClient();

  // Create Batch Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [batchCode, setBatchCode] = useState('');
  const [batchName, setBatchName] = useState('');
  const [startDate, setStartDate] = useState(program.startDate?.slice(0, 10) || '');
  const [endDate, setEndDate] = useState(program.endDate?.slice(0, 10) || '');
  const [maxCapacity, setMaxCapacity] = useState(30);
  const [venueOrMeetingLink, setVenueOrMeetingLink] = useState(program.venue || '');
  const [coordinatorInCharge, setCoordinatorInCharge] = useState(program.coordinatorName || '');

  // Participant Assignment Modal State
  const [assignModalBatch, setAssignModalBatch] = useState<Batch | null>(null);

  // Fetch batches for this program
  const { data: batchesData, isLoading } = useQuery({
    queryKey: ['program-batches', program._id],
    queryFn: () => batchesApi.getByProgram(program._id).then((r) => r.data),
  });

  // Fetch approved nominations to allocate
  const { data: nominationsData } = useQuery({
    queryKey: ['program-nominations-approved', program._id],
    queryFn: () => nominationsApi.getByProgram(program._id, { status: 'APPROVED', limit: 100 }).then((r) => r.data),
    enabled: !!assignModalBatch,
  });

  const batches: Batch[] = batchesData?.data || [];
  const approvedNominations: Nomination[] = nominationsData?.data || [];

  // Create batch mutation
  const createBatchMutation = useMutation({
    mutationFn: (data: Record<string, any>) => batchesApi.create(data),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Batch created successfully');
      setIsCreateOpen(false);
      setBatchCode('');
      setBatchName('');
      queryClient.invalidateQueries({ queryKey: ['program-batches', program._id] });
      queryClient.invalidateQueries({ queryKey: ['programs'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Assign participant mutation
  const assignMutation = useMutation({
    mutationFn: ({ batchId, traineeId, nominationId }: { batchId: string; traineeId: string; nominationId?: string }) =>
      batchesApi.assign(batchId, { traineeId, nominationId }),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Participant assigned to batch');
      queryClient.invalidateQueries({ queryKey: ['program-batches', program._id] });
      queryClient.invalidateQueries({ queryKey: ['program-enrollments', program._id] });
      queryClient.invalidateQueries({ queryKey: ['program-nominations', program._id] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Remove participant from batch mutation
  const removeParticipantMutation = useMutation({
    mutationFn: ({ batchId, enrollmentId }: { batchId: string; enrollmentId: string }) =>
      batchesApi.removeParticipant(batchId, enrollmentId),
    onSuccess: () => {
      toast.success('Participant unassigned from batch');
      queryClient.invalidateQueries({ queryKey: ['program-batches', program._id] });
      queryClient.invalidateQueries({ queryKey: ['program-enrollments', program._id] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Delete batch mutation
  const deleteBatchMutation = useMutation({
    mutationFn: (id: string) => batchesApi.delete(id),
    onSuccess: () => {
      toast.success('Batch deleted');
      queryClient.invalidateQueries({ queryKey: ['program-batches', program._id] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchCode.trim() || !batchName.trim() || !startDate || !endDate) {
      toast.error('Please enter batch code, name, and distinct start/end dates');
      return;
    }

    createBatchMutation.mutate({
      programId: program._id,
      batchCode: batchCode.trim().toUpperCase(),
      batchName: batchName.trim(),
      startDate,
      endDate,
      maxCapacity: Number(maxCapacity),
      venueOrMeetingLink: venueOrMeetingLink.trim(),
      coordinatorInCharge: coordinatorInCharge.trim(),
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--color-text-primary)' }}>
            Batch Scheduling & Participant Allocation
          </h4>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            Manage distinct cohorts with custom dates, venue locations, and allocate approved nominees.
          </p>
        </div>

        <button
          className="btn btn-primary btn-sm"
          onClick={() => {
            const nextIdx = batches.length + 1;
            setBatchCode(`BATCH-0${nextIdx}`);
            setBatchName(`Batch ${nextIdx}`);
            setIsCreateOpen(true);
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={14} /> Create New Batch
        </button>
      </div>

      {/* Batches List */}
      {isLoading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          Loading batches...
        </div>
      ) : batches.length === 0 ? (
        <div style={{
          padding: '36px',
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px dashed var(--color-border)',
          borderRadius: 'var(--radius-md)',
        }}>
          <Layers size={36} style={{ color: 'var(--color-text-muted)', marginBottom: '10px' }} />
          <h4 style={{ margin: '0 0 6px', color: 'var(--color-text-primary)' }}>No Batches Created Yet</h4>
          <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            For multi-cohort or staggered programs, create batches with distinct start/end dates and assign approved candidates.
          </p>
          <button className="btn btn-primary btn-sm" onClick={() => setIsCreateOpen(true)}>
            <Plus size={14} /> Create First Batch
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {batches.map((batch) => {
            const enrollmentsList = batch.enrollments || [];
            const occupancyPct = Math.min(Math.round((batch.assignedCount / batch.maxCapacity) * 100), 100);

            return (
              <div
                key={batch._id}
                className="card"
                style={{
                  padding: '18px 20px',
                  border: '1px solid var(--color-border)',
                  background: 'rgba(255, 255, 255, 0.02)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <span className="badge badge-primary font-mono" style={{ marginRight: '8px' }}>
                      {batch.batchCode}
                    </span>
                    <strong style={{ fontSize: '15px', color: 'var(--color-text-primary)' }}>
                      {batch.batchName}
                    </strong>
                    <span className="badge badge-success" style={{ marginLeft: '8px', fontSize: '11px' }}>
                      {batch.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setAssignModalBatch(batch)}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <UserPlus size={13} /> Allocate Trainees
                    </button>
                    {batch.assignedCount === 0 && (
                      <button
                        className="btn btn-icon btn-secondary"
                        style={{ color: 'var(--color-danger)' }}
                        title="Delete Batch"
                        onClick={() => {
                          if (window.confirm(`Delete ${batch.batchName}?`)) {
                            deleteBatchMutation.mutate(batch._id);
                          }
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Batch Specific Schedule & Venue Grid */}
                <div className="grid-3" style={{ fontSize: '12.5px', gap: '12px', marginBottom: '14px', background: 'rgba(0,0,0,0.2)', padding: '10px 14px', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} style={{ color: 'var(--color-secondary)' }} />
                    <span><strong>Dates:</strong> {formatDate(batch.startDate)} - {formatDate(batch.endDate)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} style={{ color: 'var(--color-secondary)' }} />
                    <span><strong>Venue:</strong> {batch.venueOrMeetingLink || 'Main Campus'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={14} style={{ color: 'var(--color-secondary)' }} />
                    <span><strong>In-Charge:</strong> {batch.coordinatorInCharge || '-'}</span>
                  </div>
                </div>

                {/* Capacity Progress Bar */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Batch Capacity:</span>
                    <strong>{batch.assignedCount} / {batch.maxCapacity} seats ({occupancyPct}%)</strong>
                  </div>
                  <div className="progress-bar" style={{ height: '6px' }}>
                    <div
                      className="progress-fill"
                      style={{
                        width: `${occupancyPct}%`,
                        background: occupancyPct >= 100 ? 'var(--color-danger)' : 'var(--color-secondary)'
                      }}
                    />
                  </div>
                </div>

                {/* Assigned Participants List */}
                {enrollmentsList.length > 0 && (
                  <div style={{ marginTop: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Assigned Trainees ({enrollmentsList.length}):
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {enrollmentsList.map((e: any) => {
                        const t = e.trainee;
                        return (
                          <span
                            key={e._id}
                            style={{
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid var(--color-border)',
                              borderRadius: '4px',
                              padding: '3px 8px',
                              fontSize: '11px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <strong>{t?.firstName} {t?.lastName}</strong> ({t?.traineeId})
                            <button
                              type="button"
                              onClick={() => removeParticipantMutation.mutate({ batchId: batch._id, enrollmentId: e._id })}
                              title="Remove from batch"
                              style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: 0 }}
                            >
                              <UserMinus size={11} />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create New Batch */}
      {isCreateOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateOpen(false)}>
          <div className="modal" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ fontSize: '16px' }}>Create Program Batch</h3>
              <button className="modal-close" onClick={() => setIsCreateOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="grid-2" style={{ gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label required">Batch Code</label>
                    <input
                      type="text"
                      className="form-input font-mono"
                      placeholder="e.g. BATCH-01"
                      value={batchCode}
                      onChange={(e) => setBatchCode(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Batch Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Batch 1 (Western Labs)"
                      value={batchName}
                      onChange={(e) => setBatchName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid-2" style={{ gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label required">Batch Start Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Batch End Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid-2" style={{ gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label required">Max Capacity</label>
                    <input
                      type="number"
                      min={1}
                      max={200}
                      className="form-input"
                      value={maxCapacity}
                      onChange={(e) => setMaxCapacity(Number(e.target.value))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Coordinator In-Charge</label>
                    <input
                      type="text"
                      className="form-input"
                      value={coordinatorInCharge}
                      onChange={(e) => setCoordinatorInCharge(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Venue / Meeting URL</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Hall A, CSIR-CECRI or MS Teams Link"
                    value={venueOrMeetingLink}
                    onChange={(e) => setVenueOrMeetingLink(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createBatchMutation.isPending}>
                  {createBatchMutation.isPending ? 'Creating...' : 'Create Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Allocate Approved Nominations to Batch */}
      {assignModalBatch && (
        <div className="modal-overlay" onClick={() => setAssignModalBatch(null)}>
          <div className="modal" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="badge badge-primary font-mono">{assignModalBatch.batchCode}</span>
                <h3 className="modal-title" style={{ fontSize: '16px', marginTop: '4px' }}>
                  Allocate Candidates to {assignModalBatch.batchName}
                </h3>
              </div>
              <button className="modal-close" onClick={() => setAssignModalBatch(null)}><X size={16} /></button>
            </div>

            <div className="modal-body" style={{ maxHeight: '420px', overflowY: 'auto' }}>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '14px' }}>
                Showing approved nominations for this program. Click <strong>Allocate</strong> to place a trainee into this batch.
              </div>

              {approvedNominations.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No approved nominations available for allocation. Review nominations first.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {approvedNominations.map((nom) => {
                    const t = nom.trainee;
                    const isAlreadyInBatch = (assignModalBatch.enrollments || []).some(
                      (e: any) => e.trainee?._id === t._id
                    );

                    return (
                      <div
                        key={nom._id}
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '6px',
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '13.5px', color: 'var(--color-text-primary)' }}>
                            {t.firstName} {t.lastName}
                          </strong>{' '}
                          <span className="badge badge-primary font-mono" style={{ fontSize: '10px' }}>{t.traineeId}</span>
                          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            {t.designation} · {t.organization}
                          </div>
                        </div>

                        {isAlreadyInBatch ? (
                          <span className="badge badge-success" style={{ fontSize: '11px' }}>
                            <CheckCircle size={12} /> Assigned
                          </span>
                        ) : (
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={assignMutation.isPending || assignModalBatch.assignedCount >= assignModalBatch.maxCapacity}
                            onClick={() =>
                              assignMutation.mutate({
                                batchId: assignModalBatch._id,
                                traineeId: t._id,
                                nominationId: nom._id,
                              })
                            }
                          >
                            Allocate
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setAssignModalBatch(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramBatchesTab;
