import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Layers, CheckCircle, Calendar, Users, AlertCircle } from 'lucide-react';
import { nominationsApi } from '../../api/services';
import { formatDate, getErrorMessage } from '../../utils/helpers';
import toast from 'react-hot-toast';
import type { Nomination, Batch } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  nomination: Nomination | null;
  batches: Batch[];
  onSuccess?: () => void;
}

export const MapToBatchModal: React.FC<Props> = ({
  isOpen,
  onClose,
  nomination,
  batches,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');

  const currentBatchId =
    typeof nomination?.assignedBatch === 'string'
      ? nomination.assignedBatch
      : nomination?.assignedBatch?._id || '';

  // Pre-select current batch or first batch when modal opens
  React.useEffect(() => {
    if (currentBatchId) {
      setSelectedBatchId(currentBatchId);
    } else if (batches.length > 0) {
      setSelectedBatchId(batches[0]._id);
    }
  }, [currentBatchId, batches]);

  const mapMutation = useMutation({
    mutationFn: (batchId: string) =>
      nominationsApi.mapToBatch(nomination!._id, { batchId, status: 'APPROVED' }),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Participant successfully mapped to batch!');
      queryClient.invalidateQueries({ queryKey: ['program-nominations'] });
      queryClient.invalidateQueries({ queryKey: ['program-batches'] });
      queryClient.invalidateQueries({ queryKey: ['program-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  if (!isOpen || !nomination) return null;

  const trainee = nomination.trainee;
  const selectedBatch = batches.find((b) => b._id === selectedBatchId);
  const isFull =
    selectedBatch &&
    selectedBatch.maxCapacity > 0 &&
    selectedBatch.assignedCount >= selectedBatch.maxCapacity &&
    selectedBatch._id !== currentBatchId;

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
          style={{ maxWidth: '540px', width: '95%', backgroundColor: 'var(--color-bg-card, #ffffff)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="var(--color-primary-light)" />
              <h3 className="modal-title" style={{ fontSize: '1.1rem' }}>
                Map Candidate to Training Batch
              </h3>
            </div>
            <button className="btn btn-icon btn-secondary" onClick={onClose}>
              <X size={16} />
            </button>
          </div>

          <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Candidate Profile Summary */}
            <div style={{ background: 'var(--color-bg-alt)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {trainee?.firstName} {trainee?.lastName}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                {trainee?.traineeId} &bull; {trainee?.organization} ({trainee?.designation})
              </div>
              {nomination.willingnessDetails?.reportingOfficerName && (
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  Endorsed by: {nomination.willingnessDetails.reportingOfficerName} ({nomination.willingnessDetails.reportingOfficerDesignation})
                </div>
              )}
            </div>

            {/* Batch Selector */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px', display: 'block' }}>
                Select Scheduled Batch
              </label>
              {batches.length === 0 ? (
                <div style={{ padding: '12px', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                  No active batches found for this program. Please create batches in the &apos;Batches&apos; tab first.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {batches.map((batch) => {
                    const isSelected = selectedBatchId === batch._id;
                    const batchFull =
                      batch.maxCapacity > 0 &&
                      batch.assignedCount >= batch.maxCapacity &&
                      batch._id !== currentBatchId;

                    return (
                      <div
                        key={batch._id}
                        onClick={() => !batchFull && setSelectedBatchId(batch._id)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-md)',
                          border: `1.5px solid ${isSelected ? 'var(--color-primary-light)' : 'var(--color-border)'}`,
                          background: isSelected ? 'rgba(0, 114, 206, 0.05)' : 'var(--color-bg-alt)',
                          cursor: batchFull ? 'not-allowed' : 'pointer',
                          opacity: batchFull ? 0.6 : 1,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 600, fontSize: '13px' }}>{batch.batchName || batch.batchCode}</span>
                            <span className="badge badge-secondary font-mono" style={{ fontSize: '10px' }}>
                              {batch.batchCode}
                            </span>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                            <Calendar size={11} /> {formatDate(batch.startDate)} - {formatDate(batch.endDate)}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span
                            className={`badge ${batchFull ? 'badge-danger' : 'badge-primary'}`}
                            style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Users size={11} />
                            {batch.assignedCount} / {batch.maxCapacity || '∞'} seats
                          </span>
                          {batchFull && (
                            <div style={{ fontSize: '10px', color: 'var(--color-danger)', marginTop: '2px' }}>
                              Batch Full
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {isFull && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)', fontSize: '12px' }}>
                <AlertCircle size={15} />
                The selected batch has reached its maximum capacity.
              </div>
            )}
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={onClose} disabled={mapMutation.isPending}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              disabled={!selectedBatchId || isFull || mapMutation.isPending}
              onClick={() => mapMutation.mutate(selectedBatchId)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <CheckCircle size={14} />
              {mapMutation.isPending ? 'Mapping...' : 'Approve & Map to Batch'}
            </button>
          </div>
        </div>
    </div>,
    document.body
  );
};

export default MapToBatchModal;
