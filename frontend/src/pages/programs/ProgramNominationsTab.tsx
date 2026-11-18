import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, ExternalLink, CheckCircle, XCircle, Bed, UserPlus, Layers } from 'lucide-react';
import { nominationsApi, batchesApi } from '../../api/services';
import { getErrorMessage } from '../../utils/helpers';
import toast from 'react-hot-toast';
import type { TrainingProgram, Nomination, Batch } from '../../types';
import TargetedInviteModal from './TargetedInviteModal';
import MapToBatchModal from './MapToBatchModal';

interface Props {
  program: TrainingProgram;
}

const ProgramNominationsTab: React.FC<Props> = ({ program }) => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [mappingNomination, setMappingNomination] = useState<Nomination | null>(null);

  const inviteUrl = `${window.location.origin}/nominate/${program.programCode}`;

  const { data: nominationsData, isLoading } = useQuery({
    queryKey: ['program-nominations', program._id, statusFilter],
    queryFn: () =>
      nominationsApi
        .getByProgram(program._id, {
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          limit: 100,
        })
        .then((r) => r.data),
  });

  const { data: batchesData } = useQuery<{ data: Batch[] }>({
    queryKey: ['program-batches', program._id],
    queryFn: () => batchesApi.getByProgram(program._id).then((r) => r.data),
  });

  const batches: Batch[] = batchesData?.data || [];
  const nominations: Nomination[] = nominationsData?.data || [];
  const counts = nominationsData?.counts || { invited: 0, submitted: 0, approved: 0, rejected: 0, waitlisted: 0 };

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, rejectionReason }: { id: string; status: string; rejectionReason?: string }) =>
      nominationsApi.review(id, { status, rejectionReason }),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Nomination updated');
      queryClient.invalidateQueries({ queryKey: ['program-nominations', program._id] });
      queryClient.invalidateQueries({ queryKey: ['program-enrollments', program._id] });
      queryClient.invalidateQueries({ queryKey: ['programs'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    toast.success('Nomination invitation link copied to clipboard!');
  };

  const handleApprove = (nomination: Nomination) => {
    if (batches.length > 0) {
      setMappingNomination(nomination);
    } else {
      reviewMutation.mutate({ id: nomination._id, status: 'APPROVED' });
    }
  };

  const handleReject = (nomination: Nomination) => {
    const reason = window.prompt('Enter rejection reason (optional):', 'Eligibility criteria not met / Batch oversubscribed');
    if (reason !== null) {
      reviewMutation.mutate({ id: nomination._id, status: 'REJECTED', rejectionReason: reason });
    }
  };

  const handleWaitlist = (nomination: Nomination) => {
    reviewMutation.mutate({ id: nomination._id, status: 'WAITLISTED' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Action / Invite Banner */}
      <div
        style={{
          background: 'rgba(200, 150, 62, 0.08)',
          border: '1px solid rgba(200, 150, 62, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ fontSize: '11px', color: 'var(--color-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '2px' }}>
            Candidate Nomination & Invitation Hub
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-primary)', wordBreak: 'break-all', fontFamily: 'monospace' }}>
            {inviteUrl}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '3px' }}>
            Select verified candidates lab-wise or copy this link for candidate willingness submissions.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setIsInviteModalOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <UserPlus size={13} /> Invite Master Trainees (Targeted)
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleCopyLink} title="Copy link to clipboard">
            <Copy size={13} /> Copy Link
          </button>
          <a
            href={`/nominate/${program.programCode}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <ExternalLink size={13} /> Open Portal
          </a>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          className={`btn ${statusFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setStatusFilter('ALL')}
        >
          All ({nominationsData?.total || 0})
        </button>
        <button
          className={`btn ${statusFilter === 'INVITED' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setStatusFilter('INVITED')}
        >
          Invited ({counts.invited || 0})
        </button>
        <button
          className={`btn ${statusFilter === 'SUBMITTED' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setStatusFilter('SUBMITTED')}
        >
          Willingness Received ({counts.submitted || 0})
        </button>
        <button
          className={`btn ${statusFilter === 'APPROVED' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setStatusFilter('APPROVED')}
        >
          Approved ({counts.approved || 0})
        </button>
        <button
          className={`btn ${statusFilter === 'WAITLISTED' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setStatusFilter('WAITLISTED')}
        >
          Waitlisted ({counts.waitlisted || 0})
        </button>
        <button
          className={`btn ${statusFilter === 'REJECTED' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setStatusFilter('REJECTED')}
        >
          Rejected ({counts.rejected || 0})
        </button>
      </div>

      {/* Nominations List Table */}
      <div className="table-container" style={{ maxHeight: '380px', overflowY: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Applicant Trainee</th>
              <th>Organization & Designation</th>
              <th>Endorsement / Officer</th>
              <th>Assigned Batch</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-secondary)' }}>
                  Loading nominations...
                </td>
              </tr>
            ) : nominations.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-secondary)' }}>
                  No nominations found for this filter.
                </td>
              </tr>
            ) : (
              nominations.map((nom) => {
                const t = nom.trainee;
                const batch = typeof nom.assignedBatch === 'object' ? nom.assignedBatch : null;

                return (
                  <tr key={nom._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {t?.firstName} {t?.lastName}
                      </div>
                      <span className="badge badge-primary font-mono" style={{ fontSize: '10px', marginTop: '2px' }}>
                        {t?.traineeId}
                      </span>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        {t?.email}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>{t?.organization || '-'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{t?.designation || '-'}</div>
                    </td>

                    <td>
                      {nom.willingnessDetails?.reportingOfficerName ? (
                        <>
                          <div style={{ fontSize: '12px', fontWeight: 500 }}>
                            {nom.willingnessDetails.reportingOfficerName}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                            {nom.willingnessDetails.reportingOfficerDesignation}
                          </div>
                        </>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                          Awaiting Submission
                        </span>
                      )}
                      {nom.willingnessDetails?.accommodationRequired && (
                        <div style={{ marginTop: '2px' }}>
                          <span className="badge badge-warning" style={{ fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Bed size={10} /> Hostel Needed
                          </span>
                        </div>
                      )}
                    </td>

                    <td>
                      {batch ? (
                        <span className="badge badge-primary font-mono" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Layers size={10} /> {batch.batchName || batch.batchCode}
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Unassigned</span>
                      )}
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          nom.status === 'APPROVED'
                            ? 'badge-success'
                            : nom.status === 'REJECTED'
                            ? 'badge-danger'
                            : nom.status === 'WAITLISTED'
                            ? 'badge-info'
                            : nom.status === 'INVITED'
                            ? 'badge-warning'
                            : 'badge-secondary'
                        }`}
                      >
                        {nom.status === 'INVITED' ? 'INVITED' : nom.status === 'SUBMITTED' ? 'WILLINGNESS RECVD' : nom.status}
                      </span>
                      {nom.rejectionReason && (
                        <div style={{ fontSize: '10px', color: 'var(--color-danger)', marginTop: '3px', maxWidth: '140px' }}>
                          {nom.rejectionReason}
                        </div>
                      )}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px', flexWrap: 'wrap' }}>
                        {batches.length > 0 && (
                          <button
                            className="btn btn-sm btn-secondary"
                            style={{ padding: '3px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                            title="Map Participant to Batch"
                            onClick={() => setMappingNomination(nom)}
                          >
                            <Layers size={11} /> {batch ? 'Change Batch' : 'Map Batch'}
                          </button>
                        )}
                        {nom.status !== 'APPROVED' && (
                          <button
                            className="btn btn-sm btn-primary"
                            style={{ background: 'var(--color-success)', borderColor: 'var(--color-success)', padding: '3px 8px', fontSize: '11px' }}
                            title="Approve Nomination"
                            disabled={reviewMutation.isPending}
                            onClick={() => handleApprove(nom)}
                          >
                            <CheckCircle size={11} /> Approve
                          </button>
                        )}
                        {nom.status !== 'WAITLISTED' && (
                          <button
                            className="btn btn-sm btn-secondary"
                            style={{ padding: '3px 8px', fontSize: '11px' }}
                            title="Waitlist Nomination"
                            disabled={reviewMutation.isPending}
                            onClick={() => handleWaitlist(nom)}
                          >
                            Waitlist
                          </button>
                        )}
                        {nom.status !== 'REJECTED' && (
                          <button
                            className="btn btn-sm btn-danger"
                            style={{ padding: '3px 8px', fontSize: '11px' }}
                            title="Reject Nomination"
                            disabled={reviewMutation.isPending}
                            onClick={() => handleReject(nom)}
                          >
                            <XCircle size={11} /> Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <TargetedInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        programId={program._id}
        programTitle={program.title}
        programCode={program.programCode}
        onInvitedSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['program-nominations', program._id] });
        }}
      />

      <MapToBatchModal
        isOpen={Boolean(mappingNomination)}
        onClose={() => setMappingNomination(null)}
        nomination={mappingNomination}
        batches={batches}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['program-nominations', program._id] });
        }}
      />
    </div>
  );
};

export default ProgramNominationsTab;
