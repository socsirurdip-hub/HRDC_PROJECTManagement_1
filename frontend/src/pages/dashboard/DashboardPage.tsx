import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  BookOpen, Users, GraduationCap, TrendingUp,
  MapPin, Award
} from 'lucide-react';
import { analyticsApi } from '../../api/services';
import { formatNumber, formatDate, getMonthName } from '../../utils/helpers';
import type { DashboardData, MonthlyTrend, StatBreakdown } from '../../types';

const CHART_COLORS = ['#2455B5', '#C8963E', '#27AE60', '#E74C3C', '#16A085', '#9B59B6', '#F39C12'];

const StatCard: React.FC<{
  icon: React.ElementType;
  value: string | number;
  label: string;
  color: string;
  subtitle?: string;
}> = ({ icon: Icon, value, label, color, subtitle }) => (
  <div className={`stat-card ${color}`}>
    <div className={`stat-icon ${color}`}>
      <Icon size={22} />
    </div>
    <div className="stat-info">
      <div className="stat-value">{formatNumber(Number(value))}</div>
      <div className="stat-label">{label}</div>
      {subtitle && (
        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
          {subtitle}
        </div>
      )}
    </div>
  </div>
);

const DashboardPage: React.FC = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-analytics'],
    queryFn: () => analyticsApi.getDashboard().then((r) => r.data.data as DashboardData),
    staleTime: 60000,
  });

  const monthlyChartData = data?.monthlyTrend?.map((m: MonthlyTrend) => ({
    name: `${getMonthName(m._id.month)} ${m._id.year}`,
    enrollments: m.enrollments,
    completions: m.completions,
  })) || [];

  const genderData = data?.genderBreakdown?.map((g: StatBreakdown) => ({
    name: g._id,
    value: g.count,
  })) || [];

  const statusData = data?.programsByStatus?.map((s: StatBreakdown) => ({
    name: s._id,
    count: s.count,
  })) || [];

  if (isLoading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚠️</div>
        <h3>Failed to load dashboard data</h3>
        <p>Please ensure the backend server is running and the database is connected.</p>
      </div>
    );
  }

  const { summary, categoryBreakdown, stateDistribution, recentPrograms } = data;

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>Training Analytics Dashboard</h2>
          <p>Comprehensive overview of CSIR-HRDC training programs and trainee data</p>
        </div>
        <div
          style={{
            padding: '8px 16px',
            background: 'var(--color-success-bg)',
            border: '1px solid rgba(39, 174, 96, 0.3)',
            borderRadius: 'var(--radius-md)',
            fontSize: '12px',
            color: 'var(--color-success)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <div
            style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: 'var(--color-success)',
              animation: 'pulse-glow 2s infinite',
            }}
          />
          Live Data
        </div>
      </div>

      {/* Stats Row */}
      <div className="stat-grid stagger-children">
        <StatCard
          icon={BookOpen}
          value={summary.totalPrograms}
          label="Total Programs"
          color="blue"
          subtitle={`${summary.completedPrograms} completed`}
        />
        <StatCard
          icon={GraduationCap}
          value={summary.totalTrainees}
          label="Registered Trainees"
          color="gold"
          subtitle={`${summary.uniqueTraineesThisYear} this year`}
        />
        <StatCard
          icon={TrendingUp}
          value={summary.totalEnrollments}
          label="Total Enrollments"
          color="green"
        />
        <StatCard
          icon={Users}
          value={summary.totalUsers}
          label="Active Admins"
          color="teal"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Monthly Trend */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Monthly Enrollment Trend</h3>
            <span className="badge badge-info">Last 12 months</span>
          </div>
          <div className="card-body">
            {monthlyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={monthlyChartData}>
                  <defs>
                    <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2455B5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2455B5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="completeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#27AE60" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#27AE60" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,130,200,0.1)" />
                  <XAxis dataKey="name" tick={{ fill: '#8B9EC7', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#8B9EC7', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      background: '#0D1526', border: '1px solid rgba(100,130,200,0.3)',
                      borderRadius: '8px', color: '#E8EEFF',
                    }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="enrollments" stroke="#2455B5" fill="url(#enrollGrad)" name="Enrollments" strokeWidth={2} />
                  <Area type="monotone" dataKey="completions" stroke="#27AE60" fill="url(#completeGrad)" name="Completions" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ padding: '60px 0' }}>
                <p>No enrollment data available yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Program Status */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Program Status</h3>
          </div>
          <div className="card-body">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={statusData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,130,200,0.1)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#8B9EC7', fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#8B9EC7', fontSize: 11 }} width={80} />
                  <Tooltip
                    contentStyle={{
                      background: '#0D1526', border: '1px solid rgba(100,130,200,0.3)',
                      borderRadius: '8px', color: '#E8EEFF',
                    }}
                  />
                  <Bar dataKey="count" name="Programs" radius={[0, 4, 4, 0]}>
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ padding: '60px 0' }}>
                <p>No programs available yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Gender Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Gender Distribution</h3>
            <span className="badge badge-primary">Trainees</span>
          </div>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {genderData.length > 0 ? (
              <>
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {genderData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: '#0D1526', border: '1px solid rgba(100,130,200,0.3)',
                        borderRadius: '8px', color: '#E8EEFF',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1 }}>
                  {genderData.map((g, i) => (
                    <div key={g.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', flex: 1 }}>{g.name}</span>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{formatNumber(g.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state" style={{ padding: '40px 0', width: '100%' }}>
                <p>No trainee data yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* State Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top States (Trainees)</h3>
            <MapPin size={16} style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <div className="card-body">
            {stateDistribution.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {stateDistribution.slice(0, 6).map((s: StatBreakdown, i) => {
                  const maxCount = stateDistribution[0]?.count || 1;
                  const pct = Math.round((s.count / maxCount) * 100);
                  return (
                    <div key={s._id || i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{s._id || 'Unknown'}</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{formatNumber(s.count)}</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '40px 0' }}>
                <p>No geographic data yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Distribution */}
      {categoryBreakdown.length > 0 && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <h3 className="card-title">Programs by Category</h3>
            <Award size={16} style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,130,200,0.1)" />
                <XAxis dataKey="_id" tick={{ fill: '#8B9EC7', fontSize: 10 }} />
                <YAxis tick={{ fill: '#8B9EC7', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    background: '#0D1526', border: '1px solid rgba(100,130,200,0.3)',
                    borderRadius: '8px', color: '#E8EEFF',
                  }}
                />
                <Bar dataKey="count" name="Programs" radius={[4, 4, 0, 0]}>
                  {categoryBreakdown.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Programs */}
      {recentPrograms.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Programs</h3>
            <span className="badge badge-muted">Latest 5</span>
          </div>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Program Code</th>
                  <th>Title</th>
                  <th>Start Date</th>
                  <th>Status</th>
                  <th>Enrolled</th>
                </tr>
              </thead>
              <tbody>
                {recentPrograms.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <span className="badge badge-primary font-mono">{p.programCode}</span>
                    </td>
                    <td style={{ maxWidth: '280px' }}>
                      <span className="truncate" style={{ display: 'block' }}>{p.title}</span>
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>
                      {formatDate(p.startDate)}
                    </td>
                    <td>
                      <span className={`badge ${
                        p.status === 'Completed' ? 'badge-success' :
                        p.status === 'Ongoing' ? 'badge-info' :
                        p.status === 'Scheduled' ? 'badge-primary' :
                        p.status === 'Cancelled' ? 'badge-danger' : 'badge-warning'
                      }`}>{p.status}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {p.enrolledCount} / {p.maxParticipants}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
