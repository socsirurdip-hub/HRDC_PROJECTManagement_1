import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Search, Filter, Send, Users, CheckSquare, Square, Building2, Briefcase, Clock, CheckCircle, RotateCcw } from 'lucide-react';
import { traineesApi, nominationsApi } from '../../api/services';
import { getErrorMessage } from '../../utils/helpers';
import toast from 'react-hot-toast';
import type { Trainee, TraineeFilterOptions, Nomination } from '../../types';
import MultiSelectDropdown from '../../components/ui/MultiSelectDropdown';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  programId: string;
  programTitle: string;
  programCode: string;
  onInvitedSuccess?: () => void;
}

export const TargetedInviteModal: React.FC<Props> = ({
  isOpen,
  onClose,
  programId,
  programTitle,
  programCode,
  onInvitedSuccess,
}) => {
  const queryClient = useQueryClient();

  // Multi-select filter states
  const [selectedLabs, setSelectedLabs] = useState<string[]>([]);
  const [selectedDesignations, setSelectedDesignations] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [selectedTraineeIds, setSelectedTraineeIds] = useState<Set<string>>(new Set());

  // Fetch filter dropdown options
  const { data: filterOptionsData } = useQuery<{ data: TraineeFilterOptions }>({
    queryKey: ['trainee-filter-options'],
    queryFn: () => traineesApi.getFilterOptions().then((res) => res.data),
    enabled: isOpen,
  });

  const filterOptions = filterOptionsData?.data || { organizations: [], designations: [], states: [] };

  // Fetch approved trainees matching the multi-select filters
  const { data: candidatesData, isLoading: loadingCandidates } = useQuery({
    queryKey: ['approved-candidates-for-invite', selectedLabs, selectedDesignations, selectedStates, search],
    queryFn: () =>
      traineesApi
        .getAll({
          approvalStatus: 'APPROVED',
          organization: selectedLabs.length > 0 ? selectedLabs.join(',') : undefined,
          designation: selectedDesignations.length > 0 ? selectedDesignations.join(',') : undefined,
          state: selectedStates.length > 0 ? selectedStates.join(',') : undefined,
          search: search || undefined,
          limit: 150,
        })
        .then((res) => res.data),
    enabled: isOpen,
  });

  const candidates: Trainee[] = candidatesData?.data || [];

  // Fetch existing nominations for this program
  const { data: programNominationsData } = useQuery<{ data: Nomination[] }>({
    queryKey: ['program-nominations', programId],
    queryFn: () => nominationsApi.getByProgram(programId, { limit: 150 }).then((r) => r.data),
    enabled: isOpen,
  });

  const existingNominations: Nomination[] = programNominationsData?.data || [];
  const existingNominationMap = new Map<string, Nomination>();
  existingNominations.forEach((nom) => {
    const tId = typeof nom.trainee === 'string' ? nom.trainee : nom.trainee?._id;
    if (tId) existingNominationMap.set(tId, nom);
  });

  const eligibleCandidates = candidates.filter((c) => !existingNominationMap.has(c._id));

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    setSelectedTraineeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedTraineeIds.size === eligibleCandidates.length && eligibleCandidates.length > 0) {
      setSelectedTraineeIds(new Set());
    } else {
      setSelectedTraineeIds(new Set(eligibleCandidates.map((c) => c._id)));
    }
  };

  const handleResetFilters = () => {
    setSelectedLabs([]);
    setSelectedDesignations([]);
    setSelectedStates([]);
    setSearch('');
    setSelectedTraineeIds(new Set());
  };

  const hasActiveFilters =
    selectedLabs.length > 0 || selectedDesignations.length > 0 || selectedStates.length > 0 || search;

  // Dispatch Invitation Mutation
  const inviteMutation = useMutation({
    mutationFn: () =>
      nominationsApi.inviteCandidates({
        programId,
        traineeIds: Array.from(selectedTraineeIds),
        criteria: {
          organizations: selectedLabs,
          designations: selectedDesignations,
          states: selectedStates,
        },
      }),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Invitations dispatched successfully!');
      queryClient.invalidateQueries({ queryKey: ['program-nominations', programId] });
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['trainees'] });
      setSelectedTraineeIds(new Set());
      if (onInvitedSuccess) onInvitedSuccess();
      onClose();
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  if (!isOpen) return null;

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
        padding: '24px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000000,
        backgroundColor: 'rgba(3, 7, 18, 0.85)',
        backdropFilter: 'blur(8px)',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="modal-container"
        style={{
          maxWidth: '1200px',
          width: '95vw',
          height: 'calc(100vh - 80px)',
          maxHeight: 'calc(100vh - 80px)',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--color-bg-card, #ffffff)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          borderRadius: 'var(--radius-lg)',
          position: 'relative',
          margin: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
            <div
              className="modal-header"
              style={{
                padding: '12px 20px',
                flexShrink: 0,
                borderBottom: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-card, #ffffff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    background: 'rgba(0, 114, 206, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Users size={18} color="var(--color-primary-light)" />
                </div>
                <div>
                    <h2 className="modal-title" style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                      Targeted Program Invitations
                    </h2>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                        Multi-select CSIR Labs & Designations for{' '}
                        <span style={{ fontWeight: 600, color: 'var(--color-primary-light)' }}>
                          {programTitle} ({programCode})
                        </span>
                      </div>
                    </div>
                </div>
                  <button
                    type="button"
                    className="btn btn-icon btn-secondary"
                    onClick={onClose}
                    style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Close dialog"
                  >
                    <X size={18} />
                  </button>
              </div>

              {/* Multi-Select Filter Toolbar */}
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-alt)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '14px', alignItems: 'end' }}>
                  <MultiSelectDropdown
                    label="CSIR Lab / Organization"
                    icon={<Building2 size={12} />}
                    options={filterOptions.organizations}
                    selected={selectedLabs}
                    onChange={(labs) => { setSelectedLabs(labs); setSelectedTraineeIds(new Set()); }}
                    placeholder="All Laboratories"
                  />

                  <MultiSelectDropdown
                    label="Designation / Cadre"
                    icon={<Briefcase size={12} />}
                    options={filterOptions.designations}
                    selected={selectedDesignations}
                    onChange={(desigs) => { setSelectedDesignations(desigs); setSelectedTraineeIds(new Set()); }}
                    placeholder="All Designations"
                  />

                  <MultiSelectDropdown
                    label="State / Domicile"
                    icon={<Filter size={12} />}
                    options={filterOptions.states}
                    selected={selectedStates}
                    onChange={(sts) => { setSelectedStates(sts); setSelectedTraineeIds(new Set()); }}
                    placeholder="All States"
                  />

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '5px' }}>
                      <Search size={12} /> Search Name / ID / Email
                    </label>
                    <input
                      className="input"
                      placeholder="Search candidates..."
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setSelectedTraineeIds(new Set()); }}
                      style={{ width: '100%', fontSize: '12px', minHeight: '34px' }}
                    />
                  </div>
                </div>

                {/* Active Filter Badges */}
                {hasActiveFilters && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--color-border)' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Active Filters:</span>
                    {selectedLabs.map((l) => (
                      <span key={l} className="badge badge-primary font-mono" style={{ fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        Lab: {l}
                        <X size={10} style={{ cursor: 'pointer' }} onClick={() => setSelectedLabs((p) => p.filter((x) => x !== l))} />
                      </span>
                    ))}
                    {selectedDesignations.map((d) => (
                      <span key={d} className="badge badge-info font-mono" style={{ fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        Desig: {d}
                        <X size={10} style={{ cursor: 'pointer' }} onClick={() => setSelectedDesignations((p) => p.filter((x) => x !== d))} />
                      </span>
                    ))}
                    {selectedStates.map((s) => (
                      <span key={s} className="badge badge-secondary font-mono" style={{ fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        State: {s}
                        <X size={10} style={{ cursor: 'pointer' }} onClick={() => setSelectedStates((p) => p.filter((x) => x !== s))} />
                      </span>
                    ))}
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '10px', padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: '3px', marginLeft: 'auto' }}
                    >
                      <RotateCcw size={10} /> Reset Filters
                    </button>
                  </div>
                )}
              </div>

              {/* Selection summary & master checkbox bar */}
              <div style={{ padding: '10px 24px', background: 'rgba(0, 114, 206, 0.05)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', flexShrink: 0 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ border: 'none', background: 'transparent', padding: '2px 0', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
                  onClick={handleSelectAll}
                  disabled={eligibleCandidates.length === 0}
                >
                  {selectedTraineeIds.size === eligibleCandidates.length && eligibleCandidates.length > 0 ? (
                    <CheckSquare size={18} color="var(--color-primary-light)" />
                  ) : (
                    <Square size={18} color="var(--color-text-muted)" />
                  )}
                  <span style={{ fontWeight: 600 }}>Select All Eligible ({eligibleCandidates.length} available)</span>
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: selectedTraineeIds.size > 0 ? 'var(--color-primary-light)' : 'var(--color-text-secondary)' }}>
                    {selectedTraineeIds.size} Candidate(s) Selected for Invitation
                    {candidates.length - eligibleCandidates.length > 0 && (
                      <span style={{ color: 'var(--color-warning)', marginLeft: '8px', fontWeight: 500, fontSize: '12px' }}>
                        ({candidates.length - eligibleCandidates.length} already invited or enrolled)
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={selectedTraineeIds.size === 0 || inviteMutation.isPending}
                    onClick={() => inviteMutation.mutate()}
                    title={selectedTraineeIds.size === 0 ? 'Select candidates to enable dispatch' : 'Dispatch invitations to selected candidates'}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 18px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: selectedTraineeIds.size === 0 ? 'not-allowed' : 'pointer',
                      opacity: selectedTraineeIds.size === 0 ? 0.6 : 1,
                    }}
                  >
                    <Send size={13} />
                    {inviteMutation.isPending
                      ? 'Dispatching...'
                      : `Dispatch Invitations (${selectedTraineeIds.size})`}
                  </button>
                </div>
              </div>

              {/* Spacious Candidates Table List */}
              <div style={{ flex: '1 1 0', minHeight: 0, overflowY: 'auto' }}>
                <table className="data-table" style={{ fontSize: '13px', width: '100%' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'var(--color-bg-card, #ffffff)' }}>
                    <tr>
                      <th style={{ width: '45px', textAlign: 'center' }}></th>
                      <th style={{ minWidth: '220px' }}>Candidate Name & ID</th>
                      <th style={{ minWidth: '180px' }}>Organization / CSIR Lab</th>
                      <th style={{ minWidth: '160px' }}>Designation / Cadre</th>
                      <th style={{ minWidth: '120px' }}>State / Region</th>
                      <th style={{ minWidth: '160px' }}>Program Invite Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingCandidates ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                          Loading matching approved candidates...
                        </td>
                      </tr>
                    ) : candidates.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                          No approved trainees found matching the selected filter criteria.
                        </td>
                      </tr>
                    ) : (
                      candidates.map((trainee) => {
                        const existingNom = existingNominationMap.get(trainee._id);
                        const isAlreadyInvited = Boolean(existingNom);
                        const isSelected = selectedTraineeIds.has(trainee._id);

                        return (
                          <tr
                            key={trainee._id}
                            onClick={() => !isAlreadyInvited && handleToggleSelect(trainee._id)}
                            style={{
                              cursor: isAlreadyInvited ? 'default' : 'pointer',
                              background: isSelected
                                ? 'rgba(0, 114, 206, 0.08)'
                                : isAlreadyInvited
                                  ? 'rgba(200, 150, 62, 0.04)'
                                  : undefined,
                              opacity: isAlreadyInvited ? 0.75 : 1,
                            }}
                          >
                            <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={isAlreadyInvited}
                                onChange={() => handleToggleSelect(trainee._id)}
                                style={{ cursor: isAlreadyInvited ? 'not-allowed' : 'pointer' }}
                              />
                            </td>
                            <td>
                              <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '13px' }}>
                                {trainee.firstName} {trainee.lastName}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                <span className="badge badge-primary font-mono" style={{ fontSize: '10px' }}>
                                  {trainee.traineeId}
                                </span>
                                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                                  {trainee.email}
                                </span>
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 500 }}>{trainee.organization || '-'}</div>
                            </td>
                            <td>
                              <div>{trainee.designation || '-'}</div>
                            </td>
                            <td>
                              <div>{trainee.address?.state || '-'}</div>
                            </td>
                            <td>
                              {isAlreadyInvited ? (
                                <span
                                  className={`badge ${existingNom?.status === 'APPROVED'
                                      ? 'badge-success'
                                      : existingNom?.status === 'SUBMITTED'
                                        ? 'badge-primary'
                                        : 'badge-warning'
                                    }`}
                                  style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px' }}
                                >
                                  <Clock size={11} />
                                  {existingNom?.status === 'INVITED'
                                    ? 'Already Invited'
                                    : existingNom?.status === 'SUBMITTED'
                                      ? 'Willingness Recvd'
                                      : existingNom?.status === 'APPROVED'
                                        ? 'Already Enrolled'
                                        : existingNom?.status}
                                </span>
                              ) : (
                                <span
                                  className="badge badge-success"
                                  style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px' }}
                                >
                                  <CheckCircle size={11} /> Ready to Invite
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div
                className="modal-footer"
                style={{
                  padding: '12px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexShrink: 0,
                  borderTop: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-card, #ffffff)',
                }}
              >
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  Only uninvited, verified master candidates can receive new invitations. Duplicate invites are prevented automatically.
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-secondary" onClick={onClose} disabled={inviteMutation.isPending}>
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    disabled={selectedTraineeIds.size === 0 || inviteMutation.isPending}
                    onClick={() => inviteMutation.mutate()}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px' }}
                  >
                    <Send size={15} />
                    {inviteMutation.isPending
                      ? 'Dispatching Invitations...'
                      : `Dispatch Invitations (${selectedTraineeIds.size})`}
                  </button>
                </div>
              </div>
            </div>
        </div>,
        document.body
        );
};

        export default TargetedInviteModal;
