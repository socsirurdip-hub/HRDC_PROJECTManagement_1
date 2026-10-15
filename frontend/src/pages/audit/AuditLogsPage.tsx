import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { auditApi } from '../../api/services';
import { formatDate } from '../../utils/helpers';
import type { AuditLog } from '../../types';

const AuditLogsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');

  const { data: logsData, isLoading, refetch } = useQuery({
    queryKey: ['audit-logs', { page, limit, action: actionFilter, resource: resourceFilter }],
    queryFn: () =>
      auditApi.getLogs({
        page,
        limit,
        action: actionFilter || undefined,
        resource: resourceFilter || undefined,
      }),
  });

  const logs: AuditLog[] = logsData?.data?.data || [];
  const pagination = logsData?.data?.pagination || {
    total: logsData?.data?.total || 0,
    pages: logsData?.data?.pages || 1,
    page: logsData?.data?.page || 1,
  };

  const getStatusBadge = (status: string) => {
    if (status === 'SUCCESS') {
      return (
        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <CheckCircle size={12} /> SUCCESS
        </span>
      );
    }
    return (
      <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <AlertTriangle size={12} /> FAILED
      </span>
    );
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('REGISTER')) return 'var(--color-success)';
    if (action.includes('UPDATE')) return 'var(--color-primary-light)';
    if (action.includes('DELETE')) return 'var(--color-danger)';
    if (action.includes('LOGIN')) return '#f59e0b';
    return 'var(--color-text-secondary)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={26} color="var(--color-primary-light)" />
            Security & Compliance Audit Trail
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '4px', marginBottom: 0 }}>
            Immutable chronological logging of all system actions, user logins, data modifications and exports
          </p>
        </div>

        <button className="btn btn-secondary" onClick={() => refetch()}>
          <RefreshCw size={15} />
          Refresh Feed
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            className="form-control"
            style={{ width: '200px' }}
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Actions</option>
            <option value="LOGIN">User Logins</option>
            <option value="CREATE">Creation Events</option>
            <option value="UPDATE">Update Events</option>
            <option value="DELETE">Deletion Events</option>
            <option value="EXPORT">Data Exports</option>
          </select>

          <select
            className="form-control"
            style={{ width: '200px' }}
            value={resourceFilter}
            onChange={(e) => {
              setResourceFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Resources</option>
            <option value="AUTH">Authentication</option>
            <option value="PROGRAM">Training Programs</option>
            <option value="TRAINEE">Trainees</option>
            <option value="ENROLLMENT">Enrollments</option>
            <option value="USER">User Accounts</option>
          </select>

          {(actionFilter || resourceFilter) && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                setActionFilter('');
                setResourceFilter('');
                setPage(1);
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Audit Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Operator</th>
                <th>Action</th>
                <th>Target Resource</th>
                <th>Status</th>
                <th>IP Address</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                    Loading audit trail events...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                    No audit records found matching your filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id}>
                    <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' }}>
                      {formatDate(log.createdAt, 'dd MMM yyyy, HH:mm:ss')}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{log.userName || 'System'}</div>
                      <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                        {log.userRole || 'Automated'}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          color: getActionColor(log.action),
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-primary">{log.resource}</span>
                      {log.resourceId && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                          ID: {log.resourceId.slice(0, 10)}...
                        </div>
                      )}
                    </td>
                    <td>{getStatusBadge(log.status)}</td>
                    <td style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td style={{ fontSize: '0.75rem', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' }}>
                      {log.details ? JSON.stringify(log.details) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              Showing Page {pagination.page} of {pagination.pages} ({pagination.total} audit logs)
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className="btn btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
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
    </div>
  );
};

export default AuditLogsPage;
