import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, Edit, Trash2, Eye, Download, Users, RefreshCw,
  SlidersHorizontal, CheckCircle, XCircle, AlertTriangle, ShieldCheck, UserPlus
} from 'lucide-react';
import { traineesApi, reportsApi } from '../../api/services';
import { useAuthStore } from '../../store/authStore';
import { getErrorMessage, downloadBlob, isTrustedGovEmail } from '../../utils/helpers';
import toast from 'react-hot-toast';
import type { Trainee } from '../../types';
import TraineeDetailModal from './TraineeDetailModal';
import TraineeFormModal from './TraineeFormModal';
import { ColumnExportModal, type ColumnOption } from '../../components/ui/ColumnExportModal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { InviteToProgramModal } from './InviteToProgramModal';

const TRAINEE_COLUMNS: ColumnOption[] = [
  { key: 'traineeId', label: 'Trainee ID', category: 'Identity' },
  { key: 'firstName', label: 'First Name', category: 'Identity' },
  { key: 'lastName', label: 'Last Name', category: 'Identity' },
  { key: 'gender', label: 'Gender', category: 'Demographics' },
  { key: 'socialCategory', label: 'Social Category', category: 'Demographics' },
  { key: 'isMinority', label: 'Minority Status', category: 'Demographics' },
  { key: 'isPWD', label: 'PWD Status', category: 'Demographics' },
  { key: 'domicileType', label: 'Domicile Type', category: 'Demographics' },
  { key: 'email', label: 'Email Address', category: 'Contact' },
  { key: 'phone', label: 'Phone Number', category: 'Contact' },
  { key: 'alternatePhone', label: 'Alternate Phone', category: 'Contact' },
  { key: 'state', label: 'State', category: 'Location' },
  { key: 'district', label: 'District', category: 'Location' },
  { key: 'city', label: 'City', category: 'Location' },
  { key: 'pincode', label: 'Pincode', category: 'Location' },
  { key: 'highestQualification', label: 'Qualification', category: 'Education' },
  { key: 'specialization', label: 'Specialization', category: 'Education' },
  { key: 'institution', label: 'Institution', category: 'Education' },
  { key: 'employmentStatus', label: 'Employment Status', category: 'Employment' },
  { key: 'organization', label: 'Organization', category: 'Employment' },
  { key: 'designation', label: 'Designation', category: 'Employment' },
];

const TraineesPage: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isSuperAdmin = user?.role === 'super_admin';

  // Tabs: APPROVED (Master Directory), PENDING (Awaiting Super Admin Approval), REJECTED
  const [activeTab, setActiveTab] = useState<'APPROVED' | 'PENDING' | 'REJECTED'>('APPROVED');

  // State
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [domicileFilter, setDomicileFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Modals
  const [selectedTrainee, setSelectedTrainee] = useState<Trainee | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTrainee, setEditingTrainee] = useState<Trainee | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);

  // Rejection Dialog State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingTrainee, setRejectingTrainee] = useState<Trainee | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Verification criteria not met');

  // Non-Gov Domain Warning Modal State
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [pendingApprovalTrainee, setPendingApprovalTrainee] = useState<Trainee | null>(null);

  // Direct Program Invitation State
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<string>>(new Set());
  const [isDirectInviteOpen, setIsDirectInviteOpen] = useState(false);
  const [singleInviteTrainee, setSingleInviteTrainee] = useState<Trainee | null>(null);

  // Trainees query with approvalStatus
  const { data: traineesData, isLoading, refetch } = useQuery({
    queryKey: ['trainees', { search, gender: genderFilter, socialCategory: categoryFilter, domicileType: domicileFilter, approvalStatus: activeTab, page, limit }],
    queryFn: () =>
      traineesApi.getAll({
        search: search || undefined,
        gender: genderFilter || undefined,
        socialCategory: categoryFilter || undefined,
        domicileType: domicileFilter || undefined,
        approvalStatus: activeTab,
        page,
        limit,
      }),
  });

  // Approve Trainee Mutation (Super Admin)
  const approveMutation = useMutation({
    mutationFn: (id: string) => traineesApi.approve(id),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Trainee approved successfully');
      queryClient.invalidateQueries({ queryKey: ['trainees'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Reject Trainee Mutation (Super Admin)
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => traineesApi.reject(id, reason),
    onSuccess: () => {
      toast.success('Trainee registration rejected');
      setRejectModalOpen(false);
      setRejectingTrainee(null);
      queryClient.invalidateQueries({ queryKey: ['trainees'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => traineesApi.delete(id),
    onSuccess: () => {
      toast.success('Trainee removed successfully');
      queryClient.invalidateQueries({ queryKey: ['trainees'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Handler for approving trainee: gives explicit warning modal for non-gov emails
  const handleApproveClick = (trainee: Trainee) => {
    const isNonGov = trainee.domainWarning || !isTrustedGovEmail(trainee.email);
    if (isNonGov) {
      setPendingApprovalTrainee(trainee);
      setWarningModalOpen(true);
    } else {
      approveMutation.mutate(trainee._id);
    }
  };

  const handleDelete = (trainee: Trainee) => {
    if (window.confirm(`Are you sure you want to delete ${trainee.firstName} ${trainee.lastName} (${trainee.traineeId})?`)) {
      deleteMutation.mutate(trainee._id);
    }
  };

  const handleExport = async (format: 'excel' | 'csv' | 'pdf' = 'excel', columns?: string[]) => {
    try {
      setIsExporting(true);
      const res = await reportsApi.exportTrainees({
        format,
        gender: genderFilter || undefined,
        socialCategory: categoryFilter || undefined,
        columns: columns ? columns.join(',') : undefined,
      });
      const ext = format === 'pdf' ? 'pdf' : format === 'csv' ? 'csv' : 'xlsx';
      downloadBlob(res.data, `trainees_export_${new Date().toISOString().slice(0, 10)}.${ext}`);
      toast.success(`Trainees ${format.toUpperCase()} exported successfully`);
    } catch (err) {
      toast.error('Failed to export trainees: ' + getErrorMessage(err));
    } finally {
      setIsExporting(false);
    }
  };

  const traineesList: Trainee[] = traineesData?.data?.data || [];
  const counts = traineesData?.data?.counts || { approved: 0, pending: 0, rejected: 0 };
  const pagination = traineesData?.data?.pagination || {
    total: traineesData?.data?.total || 0,
    pages: traineesData?.data?.pages || 1,
    page: traineesData?.data?.page || 1,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={26} color="var(--color-primary-light)" />
            Trainee Repository
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '4px', marginBottom: 0 }}>
            Directory of registered scientists, researchers, and technical staff across India
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setIsColumnModalOpen(true)}
            disabled={isExporting}
            title="Choose specific fields and format to export"
          >
            <SlidersHorizontal size={14} />
            Custom Export
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => handleExport('excel')} disabled={isExporting}>
            <Download size={14} />
            Quick Excel
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => handleExport('pdf')} disabled={isExporting}>
            <Download size={14} />
            Quick PDF
          </button>
          {isSuperAdmin && (
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditingTrainee(null);
                setIsFormOpen(true);
              }}
            >
              <Plus size={16} />
              Register Trainee
            </button>
          )}
        </div>
      </div>

      {/* Trainee Lifecycle Status Tabs */}
      {isSuperAdmin ? (
        <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px', flexWrap: 'wrap' }}>
          <button
            className={`btn ${activeTab === 'APPROVED' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => { setActiveTab('APPROVED'); setPage(1); }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <CheckCircle size={14} />
            Master Directory (Approved)
            <span className="badge badge-primary font-mono" style={{ marginLeft: '4px' }}>
              {counts.approved}
            </span>
          </button>

          <button
            className={`btn ${activeTab === 'PENDING' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => { setActiveTab('PENDING'); setPage(1); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderColor: counts.pending > 0 ? 'var(--color-warning)' : undefined,
            }}
          >
            <AlertTriangle size={14} style={{ color: counts.pending > 0 ? 'var(--color-warning)' : undefined }} />
            Pending Approvals
            {counts.pending > 0 && (
              <span className="badge badge-warning font-mono" style={{ marginLeft: '4px' }}>
                {counts.pending}
              </span>
            )}
          </button>

          <button
            className={`btn ${activeTab === 'REJECTED' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => { setActiveTab('REJECTED'); setPage(1); }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <XCircle size={14} />
            Rejected Requests
            <span className="badge badge-danger font-mono" style={{ marginLeft: '4px' }}>
              {counts.rejected}
            </span>
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '10px 16px',
            background: 'rgba(0, 114, 206, 0.06)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(0, 114, 206, 0.2)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span className="badge badge-primary" style={{ fontSize: '0.85rem', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={15} /> Approved Master Directory ({counts.approved} Trainees Available)
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              Select candidates using checkboxes to invite them directly to a program, or use the <strong>Training Programs &rarr; Nominations</strong> console.
            </span>
          </div>

          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              if (selectedCandidateIds.size === 0) {
                toast.error('Please select at least one candidate using the table checkboxes to invite.');
                return;
              }
              setSingleInviteTrainee(null);
              setIsDirectInviteOpen(true);
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <UserPlus size={14} />
            Invite Selected to Program {selectedCandidateIds.size > 0 ? `(${selectedCandidateIds.size})` : ''}
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search by name, ID, email, or phone..."
              style={{ paddingLeft: '36px' }}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            className="form-control"
            style={{ width: '150px' }}
            value={genderFilter}
            onChange={(e) => {
              setGenderFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Transgender">Transgender</option>
            <option value="Other">Other</option>
          </select>

          <select
            className="form-control"
            style={{ width: '150px' }}
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Categories</option>
            <option value="General">General</option>
            <option value="OBC">OBC</option>
            <option value="SC">SC</option>
            <option value="ST">ST</option>
            <option value="EWS">EWS</option>
          </select>

          <select
            className="form-control"
            style={{ width: '150px' }}
            value={domicileFilter}
            onChange={(e) => {
              setDomicileFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Domiciles</option>
            <option value="Rural">Rural</option>
            <option value="Urban">Urban</option>
            <option value="Semi-Urban">Semi-Urban</option>
          </select>

          {(search || genderFilter || categoryFilter || domicileFilter) && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSearch('');
                setGenderFilter('');
                setCategoryFilter('');
                setDomicileFilter('');
                setPage(1);
              }}
            >
              Reset
            </button>
          )}

          <button className="btn btn-icon btn-secondary" onClick={() => refetch()} title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Trainees Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                {activeTab === 'APPROVED' && (
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={traineesList.length > 0 && selectedCandidateIds.size === traineesList.length}
                      onChange={() => {
                        if (selectedCandidateIds.size === traineesList.length) {
                          setSelectedCandidateIds(new Set());
                        } else {
                          setSelectedCandidateIds(new Set(traineesList.map((t) => t._id)));
                        }
                      }}
                      title="Select all on this page"
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                )}
                <th>Trainee ID & Name</th>
                <th>Contact</th>
                <th>Demographics</th>
                <th>Qualification</th>
                <th>State / Region</th>
                <th>Organization</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={activeTab === 'APPROVED' ? 8 : 7} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                    Loading trainees records...
                  </td>
                </tr>
              ) : traineesList.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'APPROVED' ? 8 : 7} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                    No trainees found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                traineesList.map((trainee) => (
                  <tr
                    key={trainee._id}
                    style={{
                      background: selectedCandidateIds.has(trainee._id) ? 'rgba(0, 114, 206, 0.05)' : undefined,
                    }}
                  >
                    {activeTab === 'APPROVED' && (
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedCandidateIds.has(trainee._id)}
                          onChange={() => {
                            setSelectedCandidateIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(trainee._id)) next.delete(trainee._id);
                              else next.add(trainee._id);
                              return next;
                            });
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                    )}
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                        {trainee.firstName} {trainee.lastName}
                      </div>
                      <span className="badge badge-primary" style={{ fontSize: '0.7rem', marginTop: '2px' }}>
                        {trainee.traineeId}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{trainee.email}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{trainee.phone}</div>
                      {activeTab === 'PENDING' && (
                        <div style={{ marginTop: '4px' }}>
                          {trainee.domainWarning ? (
                            <span className="badge badge-warning" style={{ fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <AlertTriangle size={11} /> Non-Gov Domain (Manual Check)
                            </span>
                          ) : (
                            <span className="badge badge-success" style={{ fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <ShieldCheck size={11} /> Gov Domain Verified
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        <span className="badge badge-secondary">{trainee.gender}</span>
                        <span className="badge badge-info">{trainee.socialCategory}</span>
                        {trainee.isMinority && <span className="badge badge-warning">Minority</span>}
                        {trainee.isPWD && <span className="badge badge-danger">PWD</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{trainee.highestQualification}</div>
                      {trainee.specialization && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{trainee.specialization}</div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{trainee.address?.state || '-'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{trainee.domicileType}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{trainee.organization || trainee.employmentStatus}</div>
                      {trainee.designation && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{trainee.designation}</div>
                      )}
                      {activeTab === 'APPROVED' && (
                        <div style={{ marginTop: '4px' }}>
                          {trainee.activeNominations && trainee.activeNominations.length > 0 ? (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {trainee.activeNominations.map((nom) => (
                                <span
                                  key={nom._id}
                                  className={`badge ${
                                    nom.status === 'APPROVED'
                                      ? 'badge-success'
                                      : nom.status === 'INVITED'
                                      ? 'badge-warning'
                                      : nom.status === 'SUBMITTED'
                                      ? 'badge-primary'
                                      : 'badge-secondary'
                                  }`}
                                  style={{ fontSize: '10px', padding: '1px 5px' }}
                                  title={`${nom.programTitle || nom.programCode}: Status ${nom.status}`}
                                >
                                  {nom.status === 'INVITED'
                                    ? '✉ Invite Sent: '
                                    : nom.status === 'APPROVED'
                                    ? '✓ Enrolled: '
                                    : nom.status === 'SUBMITTED'
                                    ? '★ Willing: '
                                    : ''}
                                  {nom.programCode}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                              No active invites
                            </span>
                          )}
                        </div>
                      )}
                      {activeTab === 'REJECTED' && trainee.rejectionReason && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: '4px' }}>
                          Reason: {trainee.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', alignItems: 'center' }}>
                        {activeTab === 'PENDING' && isSuperAdmin && (
                          <>
                            <button
                              className="btn btn-sm btn-primary"
                              style={{ background: 'var(--color-success)', borderColor: 'var(--color-success)', padding: '4px 8px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              title="Approve Trainee Registration"
                              disabled={approveMutation.isPending}
                              onClick={() => handleApproveClick(trainee)}
                            >
                              <CheckCircle size={13} /> Approve
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              style={{ padding: '4px 8px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              title="Reject Trainee Registration"
                              onClick={() => {
                                setRejectingTrainee(trainee);
                                setRejectionReason('Verification criteria not met');
                                setRejectModalOpen(true);
                              }}
                            >
                              <XCircle size={13} /> Reject
                            </button>
                          </>
                        )}
                        <button
                          className="btn btn-icon btn-secondary"
                          title="View Details & Enrollments"
                          onClick={() => {
                            setSelectedTrainee(trainee);
                            setIsDetailOpen(true);
                          }}
                        >
                          <Eye size={15} />
                        </button>
                        {activeTab === 'APPROVED' && (
                          <button
                            className="btn btn-icon btn-secondary"
                            title="Invite to Training Program"
                            style={{ color: 'var(--color-primary-light)' }}
                            onClick={() => {
                              setSingleInviteTrainee(trainee);
                              setIsDirectInviteOpen(true);
                            }}
                          >
                            <UserPlus size={15} />
                          </button>
                        )}
                        {isSuperAdmin && activeTab === 'APPROVED' && (
                          <>
                            <button
                              className="btn btn-icon btn-secondary"
                              title="Edit Trainee"
                              onClick={() => {
                                setEditingTrainee(trainee);
                                setIsFormOpen(true);
                              }}
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              className="btn btn-icon btn-secondary"
                              style={{ color: 'var(--color-danger)' }}
                              title="Delete Trainee"
                              onClick={() => handleDelete(trainee)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              Showing Page {pagination.page} of {pagination.pages} ({pagination.total} total trainees)
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className="btn btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                .slice(Math.max(0, page - 3), Math.min(pagination.pages, page + 2))
                .map((p) => (
                  <button
                    key={p}
                    className={`btn ${p === page ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
              <button
                className="btn btn-secondary"
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Trainee Detail Modal */}
      {isDetailOpen && selectedTrainee && (
        <TraineeDetailModal
          trainee={selectedTrainee}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedTrainee(null);
          }}
          onApprove={isSuperAdmin ? handleApproveClick : undefined}
          onReject={isSuperAdmin ? (t) => {
            setSelectedTrainee(null);
            setIsDetailOpen(false);
            setRejectingTrainee(t);
            setRejectModalOpen(true);
          } : undefined}
        />
      )}

      {/* Column Selection Export Modal */}
      <ColumnExportModal
        isOpen={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        title="Export Trainee Directory"
        availableColumns={TRAINEE_COLUMNS}
        onExport={(fmt, cols) => handleExport(fmt, cols)}
        isExporting={isExporting}
      />

      {/* Trainee Form Modal (Add / Edit) */}
      {isFormOpen && (
        <TraineeFormModal
          trainee={editingTrainee}
          onClose={() => {
            setIsFormOpen(false);
            setEditingTrainee(null);
          }}
          onSuccess={() => {
            setIsFormOpen(false);
            setEditingTrainee(null);
            queryClient.invalidateQueries({ queryKey: ['trainees'] });
          }}
        />
      )}

      {/* Super Admin Rejection Dialog Modal */}
      {rejectModalOpen && rejectingTrainee && (
        <div className="modal-backdrop" onClick={() => setRejectModalOpen(false)}>
          <div className="modal-container" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ fontSize: '1.1rem', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} /> Reject Trainee Registration
              </h3>
              <button className="btn btn-icon btn-secondary" onClick={() => setRejectModalOpen(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                You are rejecting the registration for <strong>{rejectingTrainee.firstName} {rejectingTrainee.lastName}</strong> ({rejectingTrainee.email}).
              </p>
              <div className="form-group">
                <label className="form-label required">Rejection Reason</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Please specify why this registration is being rejected..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button className="btn btn-secondary" onClick={() => setRejectModalOpen(false)}>Cancel</button>
                <button
                  className="btn btn-danger"
                  disabled={rejectMutation.isPending || !rejectionReason.trim()}
                  onClick={() => rejectMutation.mutate({ id: rejectingTrainee._id, reason: rejectionReason.trim() })}
                >
                  {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Non-Government Domain Warning Modal */}
      <ConfirmModal
        isOpen={warningModalOpen && !!pendingApprovalTrainee}
        onClose={() => {
          setWarningModalOpen(false);
          setPendingApprovalTrainee(null);
        }}
        onConfirm={() => {
          if (pendingApprovalTrainee) {
            approveMutation.mutate(pendingApprovalTrainee._id, {
              onSettled: () => {
                setWarningModalOpen(false);
                setPendingApprovalTrainee(null);
              },
            });
          }
        }}
        variant="warning"
        title="Non-Government Domain Warning"
        subtitle="Manual Verification & Authorization Required"
        confirmLabel="Verify & Approve Trainee"
        cancelLabel="Cancel"
        isLoading={approveMutation.isPending}
        requiresCheckbox={true}
        checkboxLabel="I have manually verified this applicant's institutional employment credentials and authorize their admission into the CSIR-HRDC Master Trainee Directory."
        maxWidth="540px"
      >
        {pendingApprovalTrainee && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                background: 'rgba(243, 156, 18, 0.1)',
                border: '1px solid rgba(243, 156, 18, 0.35)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                color: 'var(--color-warning)',
                fontSize: '13px',
                lineHeight: '1.5',
                display: 'flex',
                gap: '10px',
              }}
            >
              <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Security Alert:</strong> The applicant registered with an email address (
                <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 5px', borderRadius: '4px', color: '#ffcc66' }}>
                  {pendingApprovalTrainee.email}
                </code>
                ) outside the pre-approved Government & CSIR domain whitelist (<code>@csir.res.in</code>, <code>@*.gov.in</code>, <code>@*.res.in</code>, <code>@nic.in</code>).
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                fontSize: '13px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Applicant Name:</span>
                <strong style={{ color: 'var(--color-text-primary)' }}>
                  {pendingApprovalTrainee.firstName} {pendingApprovalTrainee.lastName}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Organization:</span>
                <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
                  {pendingApprovalTrainee.organization || 'Not Specified'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Designation:</span>
                <span style={{ color: 'var(--color-text-primary)' }}>
                  {pendingApprovalTrainee.designation || '-'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Mobile Number:</span>
                <span className="font-mono" style={{ color: 'var(--color-text-primary)' }}>
                  {pendingApprovalTrainee.phone}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Application ID:</span>
                <span className="font-mono badge badge-primary">{pendingApprovalTrainee.traineeId}</span>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
              CSIR-HRDC Safe-to-Host guidelines require Super Administrators to manually confirm external / private institutional candidates before issuing a permanent Trainee ID.
            </p>
          </div>
        )}
      </ConfirmModal>

      {/* Direct Program Invitation Modal */}
      <InviteToProgramModal
        isOpen={isDirectInviteOpen}
        onClose={() => {
          setIsDirectInviteOpen(false);
          setSingleInviteTrainee(null);
        }}
        selectedTrainees={
          singleInviteTrainee
            ? [singleInviteTrainee]
            : traineesList.filter((t) => selectedCandidateIds.has(t._id))
        }
        onSuccess={() => {
          setSelectedCandidateIds(new Set());
          setSingleInviteTrainee(null);
        }}
      />
    </div>
  );
};

export default TraineesPage;
