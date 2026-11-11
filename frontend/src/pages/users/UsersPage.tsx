import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Shield, Trash2, Edit2, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { usersApi } from '../../api/services';
import { formatDate, getErrorMessage } from '../../utils/helpers';
import toast from 'react-hot-toast';
import type { User } from '../../types';

const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Users query
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
  });

  // Toggle user status mutation
  const toggleMutation = useMutation({
    mutationFn: (id: string) => usersApi.toggleStatus(id),
    onSuccess: () => {
      toast.success('User status updated');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      toast.success('User deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const handleDelete = (u: User) => {
    if (window.confirm(`Are you sure you want to delete user ${u.name} (${u.email})?`)) {
      deleteMutation.mutate(u._id);
    }
  };

  const users: User[] = usersData?.data?.data || [];

  // Form for creating / editing user
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<any>();

  const createMutation = useMutation({
    mutationFn: (data: any) => usersApi.create(data),
    onSuccess: () => {
      toast.success('User registered successfully');
      setIsModalOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => usersApi.update(id, data),
    onSuccess: () => {
      toast.success('User updated and logged to immutable audit trail');
      setIsModalOpen(false);
      setEditingUser(null);
      reset();
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const openCreateModal = () => {
    setEditingUser(null);
    reset({
      name: '',
      email: '',
      password: '',
      role: 'admin',
      department: '',
      phone: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setValue('name', u.name);
    setValue('email', u.email);
    setValue('role', u.role);
    setValue('department', u.department || '');
    setValue('phone', u.phone || '');
    setIsModalOpen(true);
  };

  const onSubmit = (data: any) => {
    if (editingUser) {
      updateMutation.mutate({
        id: editingUser._id,
        data: {
          name: data.name,
          email: data.email,
          role: data.role,
          department: data.department,
          phone: data.phone,
        },
      });
    } else {
      createMutation.mutate(data);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <span className="badge badge-warning">Super Admin</span>;
      case 'admin':
        return <span className="badge badge-primary">Program Admin</span>;
      case 'viewer':
      default:
        return <span className="badge badge-secondary">Viewer</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={26} color="var(--color-primary-light)" />
            User & Access Management
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '4px', marginBottom: 0 }}>
            Manage administrative personnel, assign roles, and control portal authorization
          </p>
        </div>

        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={16} />
          Create New User
        </button>
      </div>

      {/* Users Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Role</th>
                <th>Department / Phone</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                    Loading user accounts...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{u.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{u.email}</div>
                    </td>
                    <td>{getRoleBadge(u.role)}</td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{u.department || 'CSIR-HRDC'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{u.phone || '-'}</div>
                    </td>
                    <td>
                      <button
                        className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                        title="Click to toggle active status"
                        onClick={() => toggleMutation.mutate(u._id)}
                      >
                        {u.isActive ? 'Active' : 'Suspended'}
                      </button>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      {u.lastLogin ? formatDate(u.lastLogin, 'dd MMM yyyy HH:mm') : 'Never'}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      {formatDate(u.createdAt)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          className="btn btn-icon btn-secondary"
                          title="Edit User"
                          onClick={() => openEditModal(u)}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn btn-icon btn-secondary"
                          style={{ color: 'var(--color-danger)' }}
                          title="Delete User"
                          onClick={() => handleDelete(u)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit User Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-container" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingUser ? 'Edit Administrative User' : 'Create New Administrative User'}</h2>
              <button className="btn btn-icon btn-secondary" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    className="form-control"
                    placeholder="e.g. Dr. Rajesh Sharma"
                    {...register('name', { required: 'Name is required' })}
                  />
                  {errors.name && <span className="form-error">{String(errors.name.message)}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="user@hrdc.csir.res.in"
                    {...register('email', { required: 'Email is required' })}
                  />
                  {errors.email && <span className="form-error">{String(errors.email.message)}</span>}
                </div>

                {!editingUser && (
                  <div className="form-group">
                    <label className="form-label">Initial Password *</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Min 6 characters"
                      {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Minimum 6 chars' } })}
                    />
                    {errors.password && <span className="form-error">{String(errors.password.message)}</span>}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">System Role *</label>
                  <select className="form-control" {...register('role', { required: true })}>
                    <option value="admin">Program Admin (CRUD Programs & Trainees)</option>
                    <option value="viewer">Viewer (Read-only Access)</option>
                    <option value="super_admin">Super Admin (Full Portal Control)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Department / Lab</label>
                  <input
                    className="form-control"
                    placeholder="e.g. CSIR-HRDC Ghaziabad / Training Division"
                    {...register('department')}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    className="form-control"
                    placeholder="e.g. +91 9876543210"
                    {...register('phone')}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingUser
                    ? 'Save Changes'
                    : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
