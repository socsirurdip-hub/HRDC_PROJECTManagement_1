import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, Eye, Download, Users, RefreshCw } from 'lucide-react';
import { traineesApi, reportsApi } from '../../api/services';
import { useAuthStore } from '../../store/authStore';
import { getErrorMessage, downloadBlob } from '../../utils/helpers';
import toast from 'react-hot-toast';
import type { Trainee } from '../../types';
import TraineeDetailModal from './TraineeDetailModal';
import TraineeFormModal from './TraineeFormModal';

const TraineesPage: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const canEdit = user?.role === 'super_admin' || user?.role === 'admin';

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

  // Trainees query
  const { data: traineesData, isLoading, refetch } = useQuery({
    queryKey: ['trainees', { search, gender: genderFilter, socialCategory: categoryFilter, domicileType: domicileFilter, page, limit }],
    queryFn: () =>
      traineesApi.getAll({
        search: search || undefined,
        gender: genderFilter || undefined,
        socialCategory: categoryFilter || undefined,
        domicileType: domicileFilter || undefined,
        page,
        limit,
      }),
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

  const handleDelete = (trainee: Trainee) => {
    if (window.confirm(`Are you sure you want to delete ${trainee.firstName} ${trainee.lastName} (${trainee.traineeId})?`)) {
      deleteMutation.mutate(trainee._id);
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const res = await reportsApi.exportTrainees({
        gender: genderFilter || undefined,
        socialCategory: categoryFilter || undefined,
      });
      downloadBlob(res.data, `trainees_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Trainees exported successfully');
    } catch (err) {
      toast.error('Failed to export trainees: ' + getErrorMessage(err));
    } finally {
      setIsExporting(false);
    }
  };

  const traineesList: Trainee[] = traineesData?.data?.data || [];
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

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={handleExport} disabled={isExporting}>
            <Download size={16} />
            {isExporting ? 'Exporting...' : 'Export Excel'}
          </button>
          {canEdit && (
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
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                    Loading trainees records...
                  </td>
                </tr>
              ) : traineesList.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                    No trainees found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                traineesList.map((trainee) => (
                  <tr key={trainee._id}>
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
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
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
                        {canEdit && (
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
        />
      )}

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
    </div>
  );
};

export default TraineesPage;
