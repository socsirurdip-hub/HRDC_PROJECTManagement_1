import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText, Download, BarChart2, TrendingUp, Users
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, Legend, PieChart, Pie, Cell, CartesianGrid
} from 'recharts';
import { reportsApi, traineesApi } from '../../api/services';
import { downloadBlob, getErrorMessage } from '../../utils/helpers';
import toast from 'react-hot-toast';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];

const ReportsPage: React.FC = () => {
  const [programFilter, setProgramFilter] = useState({
    status: '',
    category: '',
    startDate: '',
    endDate: '',
  });

  const [traineeFilter, setTraineeFilter] = useState({
    gender: '',
    socialCategory: '',
    state: '',
  });

  const [exportingPrograms, setExportingPrograms] = useState(false);
  const [exportingTrainees, setExportingTrainees] = useState(false);

  // Demographics query
  const { data: demoData } = useQuery({
    queryKey: ['trainees-demographics'],
    queryFn: () => traineesApi.getDemographics(),
  });

  const handleExportPrograms = async (format: 'excel' | 'pdf' = 'excel') => {
    try {
      setExportingPrograms(true);
      const res = await reportsApi.exportPrograms({
        format,
        status: programFilter.status || undefined,
        category: programFilter.category || undefined,
        startDate: programFilter.startDate || undefined,
        endDate: programFilter.endDate || undefined,
      });
      const ext = format === 'pdf' ? 'pdf' : 'xlsx';
      downloadBlob(res.data, `training_programs_report_${new Date().toISOString().slice(0, 10)}.${ext}`);
      toast.success(`Programs ${format.toUpperCase()} report exported successfully!`);
    } catch (err) {
      toast.error('Export failed: ' + getErrorMessage(err));
    } finally {
      setExportingPrograms(false);
    }
  };

  const handleExportTrainees = async (format: 'excel' | 'pdf' = 'excel') => {
    try {
      setExportingTrainees(true);
      const res = await reportsApi.exportTrainees({
        format,
        gender: traineeFilter.gender || undefined,
        socialCategory: traineeFilter.socialCategory || undefined,
        state: traineeFilter.state || undefined,
      });
      const ext = format === 'pdf' ? 'pdf' : 'xlsx';
      downloadBlob(res.data, `trainees_report_${new Date().toISOString().slice(0, 10)}.${ext}`);
      toast.success(`Trainees ${format.toUpperCase()} report exported successfully!`);
    } catch (err) {
      toast.error('Export failed: ' + getErrorMessage(err));
    } finally {
      setExportingTrainees(false);
    }
  };

  const demographics = demoData?.data?.data || {};

  const genderData = demographics.gender?.map((g: any) => ({ name: g._id || 'Unknown', value: g.count })) || [];
  const socialCategoryData = demographics.socialCategory?.map((s: any) => ({ name: s._id || 'General', value: s.count })) || [];
  const domicileData = demographics.domicile?.map((d: any) => ({ name: d._id || 'Urban', value: d.count })) || [];
  const stateData = demographics.state?.slice(0, 8).map((s: any) => ({ name: s._id || 'Unknown', count: s.count })) || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Title */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BarChart2 size={26} color="var(--color-primary-light)" />
          Reports & Analytics Intelligence
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '4px', marginBottom: 0 }}>
          Comprehensive statistical reporting, demographic analysis, and institutional data exports
        </p>
      </div>

      {/* Export Section Cards */}
      <div className="grid grid-2" style={{ gap: '20px' }}>
        {/* Programs Export Card */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={22} color="var(--color-primary-light)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Programs Comprehensive Report</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                Includes participants, duration, venue, completion rates & coordinator details
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            <div className="grid grid-2" style={{ gap: '12px' }}>
              <div>
                <label className="form-label">Program Status</label>
                <select
                  className="form-control"
                  value={programFilter.status}
                  onChange={(e) => setProgramFilter({ ...programFilter, status: e.target.value })}
                >
                  <option value="">All Statuses</option>
                  <option value="Completed">Completed</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Scheduled">Scheduled</option>
                </select>
              </div>

              <div>
                <label className="form-label">Category</label>
                <select
                  className="form-control"
                  value={programFilter.category}
                  onChange={(e) => setProgramFilter({ ...programFilter, category: e.target.value })}
                >
                  <option value="">All Categories</option>
                  <option value="Technical Training">Technical Training</option>
                  <option value="Scientific Skills">Scientific Skills</option>
                  <option value="Leadership & Management">Leadership & Management</option>
                  <option value="Safety & Compliance">Safety & Compliance</option>
                  <option value="Digital Transformation">Digital Transformation</option>
                </select>
              </div>
            </div>

            <div className="grid grid-2" style={{ gap: '12px' }}>
              <div>
                <label className="form-label">From Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={programFilter.startDate}
                  onChange={(e) => setProgramFilter({ ...programFilter, startDate: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">To Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={programFilter.endDate}
                  onChange={(e) => setProgramFilter({ ...programFilter, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => handleExportPrograms('excel')}
              disabled={exportingPrograms}
            >
              <Download size={14} />
              {exportingPrograms ? 'Generating...' : 'Excel (.xlsx)'}
            </button>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => handleExportPrograms('pdf')}
              disabled={exportingPrograms}
            >
              <Download size={14} />
              {exportingPrograms ? 'Generating...' : 'PDF Report'}
            </button>
          </div>
        </div>

        {/* Trainees Export Card */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={22} color="var(--color-success)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Trainees Demographics Export</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                Filter by demographic parameters, education, employment, and location
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            <div className="grid grid-2" style={{ gap: '12px' }}>
              <div>
                <label className="form-label">Gender</label>
                <select
                  className="form-control"
                  value={traineeFilter.gender}
                  onChange={(e) => setTraineeFilter({ ...traineeFilter, gender: e.target.value })}
                >
                  <option value="">All Genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Transgender">Transgender</option>
                </select>
              </div>

              <div>
                <label className="form-label">Social Category</label>
                <select
                  className="form-control"
                  value={traineeFilter.socialCategory}
                  onChange={(e) => setTraineeFilter({ ...traineeFilter, socialCategory: e.target.value })}
                >
                  <option value="">All Categories</option>
                  <option value="General">General</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="EWS">EWS</option>
                </select>
              </div>
            </div>

            <div>
              <label className="form-label">State / Region</label>
              <input
                className="form-control"
                placeholder="e.g. Uttar Pradesh, Maharashtra, Delhi"
                value={traineeFilter.state}
                onChange={(e) => setTraineeFilter({ ...traineeFilter, state: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center', background: '#059669', borderColor: '#059669' }}
              onClick={() => handleExportTrainees('excel')}
              disabled={exportingTrainees}
            >
              <Download size={14} />
              {exportingTrainees ? 'Generating...' : 'Excel (.xlsx)'}
            </button>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => handleExportTrainees('pdf')}
              disabled={exportingTrainees}
            >
              <Download size={14} />
              {exportingTrainees ? 'Generating...' : 'PDF Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Visual Demographics Analytics */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={20} color="var(--color-primary-light)" /> National Outreach & Demographics Analytics
        </h2>

        <div className="grid grid-3" style={{ gap: '20px', marginBottom: '20px' }}>
          {/* Social Category Chart */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '16px', textAlign: 'center' }}>
              Social Category Representation
            </h3>
            {socialCategoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={socialCategoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {socialCategoryData.map((_: any, index: number) => (
                      <Cell key={`cell-cat-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>No data available</div>
            )}
          </div>

          {/* Domicile Type Chart */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '16px', textAlign: 'center' }}>
              Urban vs. Rural Outreach
            </h3>
            {domicileData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={domicileData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                  >
                    {domicileData.map((_: any, index: number) => (
                      <Cell key={`cell-dom-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>No data available</div>
            )}
          </div>

          {/* Gender Ratio */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '16px', textAlign: 'center' }}>
              Gender Inclusivity
            </h3>
            {genderData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={genderData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                  >
                    {genderData.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-gen-${index}`}
                        fill={entry.name === 'Female' ? '#ec4899' : entry.name === 'Male' ? '#3b82f6' : '#10b981'}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>No data available</div>
            )}
          </div>
        </div>

        {/* State-Wise Trainee Distribution */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '16px' }}>
            Top State Representation (Trainees Registered)
          </h3>
          {stateData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stateData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="var(--color-text-secondary)" tick={{ fontSize: 12 }} />
                <YAxis stroke="var(--color-text-secondary)" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderColor: 'var(--color-border)',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" name="Registered Trainees" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>No state data available</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
