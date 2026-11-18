import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Calendar, UserPlus, Send, AlertCircle, BookOpen, CheckCircle, Clock } from 'lucide-react';
import { programsApi, nominationsApi } from '../../api/services';
import { formatDate, getErrorMessage } from '../../utils/helpers';
import toast from 'react-hot-toast';
import type { Trainee, TrainingProgram, Nomination } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedTrainees: Trainee[];
  onSuccess?: () => void;
}

export const InviteToProgramModal: React.FC<Props> = ({
  isOpen,
  onClose,
  selectedTrainees,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');

  // Fetch active programs
  const { data: programsData, isLoading: loadingPrograms } = useQuery<{ data: TrainingProgram[] }>({
    queryKey: ['available-programs-for-invite'],
    queryFn: () => programsApi.getAll({ limit: 100 }).then((res) => res.data),
    enabled: isOpen,
  });

  const allPrograms: TrainingProgram[] = programsData?.data || [];
  const activePrograms = allPrograms.filter(
    (p) => p.status !== 'Completed' && p.status !== 'Cancelled'
  );

  React.useEffect(() => {
    if (activePrograms.length > 0 && !selectedProgramId) {
      setSelectedProgramId(activePrograms[0]._id);
    }
  }, [activePrograms, selectedProgramId]);

  // Fetch existing nominations for the selected program to check duplicate invite status
  const { data: programNominationsData, isLoading: loadingNominations } = useQuery<{
    data: Nomination[];
  }>({
    queryKey: ['program-nominations', selectedProgramId],
    queryFn: () =>
      nominationsApi.getByProgram(selectedProgramId, { limit: 150 }).then((r) => r.data),
    enabled: Boolean(selectedProgramId),
  });

  const existingNominations: Nomination[] = programNominationsData?.data || [];
  const existingNominationMap = new Map<string, Nomination>();
  existingNominations.forEach((nom) => {
    const tId = typeof nom.trainee === 'string' ? nom.trainee : nom.trainee?._id;
    if (tId) existingNominationMap.set(tId, nom);
  });

  // Calculate ready vs already invited candidates
  const candidatesStatus = selectedTrainees.map((trainee) => {
    const nom = existingNominationMap.get(trainee._id);
    return {
      trainee,
      existingNomination: nom,
      isAlreadyInvited: Boolean(nom),
    };
  });

  const readyToInvite = candidatesStatus.filter((c) => !c.isAlreadyInvited);
  const alreadyInvitedCount = candidatesStatus.filter((c) => c.isAlreadyInvited).length;

  const inviteMutation = useMutation({
    mutationFn: () =>
      nominationsApi.inviteCandidates({
        programId: selectedProgramId,
        traineeIds: readyToInvite.map((c) => c.trainee._id),
      }),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Invitations dispatched successfully!');
      queryClient.invalidateQueries({ queryKey: ['trainees'] });
      queryClient.invalidateQueries({ queryKey: ['program-nominations', selectedProgramId] });
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  if (!isOpen) return null;

  const targetProgram = activePrograms.find((p) => p._id === selectedProgramId);

      return createPortal(
      <div
        className="modal-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 1000000,
          backgroundColor: 'rgba(3, 7, 18, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          boxSizing: 'border-box',
        }}
      >
        <div
          className="modal-container"
          style={{
            maxWidth: '640px',
            width: '95%',
            maxHeight: 'calc(100vh - 80px)',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--color-bg-card, #ffffff)',
            position: 'relative',
            margin: 'auto',
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus size={18} color="var(--color-primary-light)" />
              <h3 className="modal-title" style={{ fontSize: '1.1rem' }}>
                Invite Candidates to Training Program
              </h3>
            </div>
            <button className="btn btn-icon btn-secondary" onClick={onClose}>
              <X size={16} />
            </button>
          </div>

          <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
            {/* Program Selector */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px', display: 'block' }}>
                Select Training Program
              </label>
              {loadingPrograms ? (
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', padding: '8px' }}>Loading active programs...</div>
              ) : activePrograms.length === 0 ? (
                <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-md)', fontSize: '12px', color: 'var(--color-danger)' }}>
                  No active or scheduled training programs found. Please create or schedule a program first.
                </div>
              ) : (
                <select
                  className="input"
                  value={selectedProgramId}
                  onChange={(e) => setSelectedProgramId(e.target.value)}
                  style={{ width: '100%', fontSize: '13px' }}
                >
                  {activePrograms.map((p) => (
                    <option key={p._id} value={p._id}>
                      [{p.programCode}] {p.title} ({formatDate(p.startDate)} - {formatDate(p.endDate)})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Program Card */}
            {targetProgram && (
              <div
                style={{
                  background: 'rgba(0, 114, 206, 0.05)',
                  border: '1px solid rgba(0, 114, 206, 0.2)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <BookOpen size={14} color="var(--color-primary-light)" />
                  <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-primary)' }}>
                    {targetProgram.title}
                  </span>
                  <span className="badge badge-primary font-mono" style={{ fontSize: '10px', marginLeft: 'auto' }}>
                    {targetProgram.programCode}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} /> {formatDate(targetProgram.startDate)} to {formatDate(targetProgram.endDate)}
                  </span>
                  <span>Mode: {targetProgram.mode}</span>
                  <span>Capacity: {targetProgram.maxParticipants || 'N/A'} seats</span>
                </div>
              </div>
            )}

            {/* Candidates Status List */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                  Candidate Invite Status ({selectedTrainees.length} Selected)
                </span>
                {loadingNominations ? (
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Checking program invite status...</span>
                ) : alreadyInvitedCount > 0 ? (
                  <span style={{ fontSize: '11px', color: 'var(--color-warning)', fontWeight: 600 }}>
                    {alreadyInvitedCount} candidate(s) already invited (will be skipped)
                  </span>
                ) : (
                  <span style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 600 }}>
                    All candidates eligible for new invitation
                  </span>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  padding: '8px',
                  background: 'var(--color-bg-alt)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {candidatesStatus.map(({ trainee, existingNomination, isAlreadyInvited }) => (
                  <div
                    key={trainee._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: isAlreadyInvited ? 'rgba(200, 150, 62, 0.08)' : 'rgba(0, 114, 206, 0.04)',
                      border: `1px solid ${isAlreadyInvited ? 'rgba(200, 150, 62, 0.25)' : 'rgba(0, 114, 206, 0.15)'}`,
                      fontSize: '12px',
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {trainee.firstName} {trainee.lastName}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginLeft: '6px' }}>
                        ({trainee.organization || trainee.traineeId})
                      </span>
                    </div>

                    <div>
                      {isAlreadyInvited ? (
                        <span
                          className={`badge ${existingNomination?.status === 'APPROVED'
                              ? 'badge-success'
                              : existingNomination?.status === 'SUBMITTED'
                                ? 'badge-primary'
                                : 'badge-warning'
                            }`}
                          style={{ fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                        >
                          <Clock size={10} />
                          {existingNomination?.status === 'INVITED'
                            ? 'Already Invited'
                            : existingNomination?.status === 'SUBMITTED'
                              ? 'Willingness Recvd'
                              : existingNomination?.status === 'APPROVED'
                                ? 'Already Enrolled'
                                : existingNomination?.status}
                        </span>
                      ) : (
                        <span
                          className="badge badge-success"
                          style={{ fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                        >
                          <CheckCircle size={10} /> Ready to Invite
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
              <AlertCircle size={13} />
              Candidates will receive an invite notification and can complete their willingness confirmation with OTP.
            </div>
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              {readyToInvite.length} new invite(s) will be sent.
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={onClose} disabled={inviteMutation.isPending}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={!selectedProgramId || readyToInvite.length === 0 || inviteMutation.isPending}
                onClick={() => inviteMutation.mutate()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Send size={14} />
                {inviteMutation.isPending
                  ? 'Dispatching...'
                  : `Dispatch Invitations (${readyToInvite.length})`}
              </button>
            </div>
          </div>
        </div>
    </div>,
    document.body
  );
};

export default InviteToProgramModal;
