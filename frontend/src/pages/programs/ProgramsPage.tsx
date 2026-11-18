import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, Eye, Download, Filter, SlidersHorizontal, UserPlus } from 'lucide-react';
import { programsApi, reportsApi } from '../../api/services';
import { formatDate, getErrorMessage, downloadFile } from '../../utils/helpers';
import { useAuthStore } from '../../store/authStore';
import type { TrainingProgram } from '../../types';
import ProgramFormModal from './ProgramFormModal';
import ProgramDetailModal from './ProgramDetailModal';
import TargetedInviteModal from './TargetedInviteModal';
import { ColumnExportModal, type ColumnOption } from '../../components/ui/ColumnExportModal';
import toast from 'react-hot-toast';

const STATUSES = ['', 'Scheduled', 'Ongoing', 'Completed', 'Cancelled', 'Postponed'];
const CATEGORIES = ['', 'Technical Training', 'Leadership Development', 'Soft Skills', 'Compliance', 'Safety', 'Research Methodology', 'IT & Digital Skills', 'Management Development', 'Other'];

const PROGRAM_COLUMNS: ColumnOption[] = [
  { key: 'programCode', label: 'Program Code', category: 'General' },
  { key: 'title', label: 'Program Title', category: 'General' },
  { key: 'category', label: 'Category', category: 'General' },
  { key: 'mode', label: 'Delivery Mode', category: 'General' },
  { key: 'status', label: 'Status', category: 'General' },
  { key: 'startDate', label: 'Start Date', category: 'Schedule' },
  { key: 'endDate', label: 'End Date', category: 'Schedule' },
  { key: 'durationDays', label: 'Duration (Days)', category: 'Schedule' },
  { key: 'state', label: 'State', category: 'Location' },
  { key: 'district', label: 'District', category: 'Location' },
  { key: 'maxParticipants', label: 'Max Capacity', category: 'Attendance' },
  { key: 'enrolledCount', label: 'Enrolled Count', category: 'Attendance' },
  { key: 'completedCount', label: 'Completed Count', category: 'Attendance' },
  { key: 'completionRate', label: 'Completion Rate (%)', category: 'Attendance' },
  { key: 'createdBy', label: 'Created By', category: 'Metadata' },
];

const ProgramsPage: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editProgram, setEditProgram] = useState<TrainingProgram | null>(null);
  const [viewProgram, setViewProgram] = useState<TrainingProgram | null>(null);
  const [inviteModalProgram, setInviteModalProgram] = useState<TrainingProgram | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['programs', page, search, statusFilter, categoryFilter],
    queryFn: () =>
      programsApi.getAll({ page, limit: 10, search, status: statusFilter, category: categoryFilter })
        .then((r) => r.data),
    staleTime: 30000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => programsApi.delete(id),
    onSuccess: () => {
      toast.success('Program deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['programs'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleDelete = (program: TrainingProgram) => {
    if (window.confirm(`Are you sure you want to delete "${program.title}"? This cannot be undone.`)) {
      deleteMutation.mutate(program._id);
    }
  };

  const handleExport = async (format: string, columns?: string[]) => {
    setExportLoading(true);
    try {
      const res = await reportsApi.exportPrograms({
        format,
        status: statusFilter,
        columns: columns ? columns.join(',') : undefined,
      });
      const ext = format === 'csv' ? 'csv' : format === 'pdf' ? 'pdf' : 'xlsx';
      downloadFile(res.data, `programs_report.${ext}`);
      toast.success('Report exported successfully');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setExportLoading(false);
    }
  };

  const canEdit = user?.role === 'admin' || user?.role === 'super_admin';
  const canDelete = user?.role === 'super_admin';

  const programs: TrainingProgram[] = data?.data || [];
  const totalPages = data?.pages || 1;
  const total = data?.total || 0;

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>Training Programs</h2>
          <p>Manage, schedule and monitor all CSIR-HRDC training programs</p>
        </div>
        <div className="page-header-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setIsColumnModalOpen(true)}
            disabled={exportLoading}
            id="custom-export-btn"
            title="Choose specific fields and format to export"
          >
            <SlidersHorizontal size={14} />
            Custom Export
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleExport('excel')}
            disabled={exportLoading}
            id="export-excel-btn"
          >
            <Download size={14} />
            Quick Excel
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleExport('pdf')}
            disabled={exportLoading}
            id="export-pdf-btn"
          >
            <Download size={14} />
            Quick PDF
          </button>
          {canEdit && (
            <button
              className="btn btn-primary"
              onClick={() => { setEditProgram(null); setShowForm(true); }}
              id="add-program-btn"
            >
              <Plus size={16} />
              Add Program
            </button>
          )}
        </div>
      </div>

      {/* Table Card */}
      <div className="card">
        {/* Filter Bar */}
        <div className="filter-bar">
          <div className="search-bar" style={{ flex: 1, maxWidth: '320px' }}>
            <Search size={14} className="search-icon" />
            <input
              id="program-search"
              placeholder="Search programs..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Filter size={14} style={{ color: 'var(--color-text-muted)' }} />
          <select
            className="filter-select"
            id="status-filter"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s || 'All Statuses'}</option>
            ))}
          </select>
          <select
            className="filter-select"
            id="category-filter"
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c || 'All Categories'}</option>
            ))}
          </select>
          {(search || statusFilter || categoryFilter) && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { setSearch(''); setStatusFilter(''); setCategoryFilter(''); setPage(1); }}
              id="clear-filters-btn"
            >
              Clear
            </button>
          )}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : programs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No Programs Found</h3>
            <p>No training programs match your current filters.</p>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Program Code</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Mode</th>
                  <th>Start Date</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Enrolled</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {programs.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <span className="badge badge-primary font-mono" style={{ fontSize: '11px' }}>
                        {p.programCode}
                      </span>
                    </td>
                    <td style={{ maxWidth: '220px' }}>
                      <div className="truncate" style={{ fontWeight: 500 }}>{p.title}</div>
                      {p.state && (
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                          📍 {p.state}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      {p.category}
                    </td>
                    <td>
                      <span className={`badge ${
                        p.mode === 'Online' ? 'badge-info' :
                        p.mode === 'Hybrid' ? 'badge-warning' : 'badge-muted'
                      }`}>{p.mode}</span>
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                      {formatDate(p.startDate)}
                    </td>
                    <td style={{ fontSize: '12px', textAlign: 'center' }}>
                      {p.durationDays ? `${p.durationDays}d` : '-'}
                    </td>
                    <td>
                      <span className={`badge ${
                        p.status === 'Completed' ? 'badge-success' :
                        p.status === 'Ongoing' ? 'badge-info' :
                        p.status === 'Scheduled' ? 'badge-primary' :
                        p.status === 'Cancelled' ? 'badge-danger' : 'badge-warning'
                      }`}>{p.status}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>{p.enrolledCount}</span>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>/ {p.maxParticipants}</span>
                      </div>
                      <div className="progress-bar" style={{ marginTop: '4px', width: '60px' }}>
                        <div
                          className="progress-fill"
                          style={{ width: `${Math.min((p.enrolledCount / p.maxParticipants) * 100, 100)}%` }}
                        />
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-primary-light)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <UserPlus size={10} />
                        <span>{p.nominationsCount || 0} Invited</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {p.status !== 'Completed' && p.status !== 'Cancelled' && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setInviteModalProgram(p)}
                            title="Invite Master Trainees (Lab-wise / Designation-wise)"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', fontSize: '11px' }}
                            id={`invite-program-${p._id}`}
                          >
                            <UserPlus size={12} /> Invite
                          </button>
                        )}
                        <button
                          className="btn btn-secondary btn-sm btn-icon"
                          onClick={() => setViewProgram(p)}
                          title="View details & nominations"
                          id={`view-program-${p._id}`}
                        >
                          <Eye size={13} />
                        </button>
                        {canEdit && (
                          <button
                            className="btn btn-secondary btn-sm btn-icon"
                            onClick={() => { setEditProgram(p); setShowForm(true); }}
                            title="Edit program"
                            id={`edit-program-${p._id}`}
                          >
                            <Edit size={13} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            className="btn btn-danger btn-sm btn-icon"
                            onClick={() => handleDelete(p)}
                            title="Delete program"
                            id={`delete-program-${p._id}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && total > 0 && (
          <div className="pagination">
            <div className="pagination-info">
              Showing {(page - 1) * 10 + 1}–{Math.min(page * 10, total)} of {total} programs
            </div>
            <div className="pagination-controls">
              <button className="page-btn" onClick={() => setPage(1)} disabled={page === 1} id="first-page">«</button>
              <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1} id="prev-page">‹</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <button
                    key={pg}
                    className={`page-btn ${pg === page ? 'active' : ''}`}
                    onClick={() => setPage(pg)}
                    id={`page-${pg}`}
                  >{pg}</button>
                );
              })}
              <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages} id="next-page">›</button>
              <button className="page-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages} id="last-page">»</button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ColumnExportModal
        isOpen={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        title="Export Training Programs"
        availableColumns={PROGRAM_COLUMNS}
        onExport={(fmt, cols) => handleExport(fmt, cols)}
        isExporting={exportLoading}
      />
      {showForm && (
        <ProgramFormModal
          program={editProgram}
          onClose={() => { setShowForm(false); setEditProgram(null); }}
          onSuccess={() => {
            setShowForm(false);
            setEditProgram(null);
            queryClient.invalidateQueries({ queryKey: ['programs'] });
          }}
        />
      )}
      {viewProgram && (
        <ProgramDetailModal
          program={viewProgram}
          onClose={() => setViewProgram(null)}
        />
      )}
      {inviteModalProgram && (
        <TargetedInviteModal
          isOpen={Boolean(inviteModalProgram)}
          onClose={() => setInviteModalProgram(null)}
          programId={inviteModalProgram._id}
          programTitle={inviteModalProgram.title}
          programCode={inviteModalProgram.programCode}
          onInvitedSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['programs'] });
          }}
        />
      )}
    </div>
  );
};

export default ProgramsPage;
