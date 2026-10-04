import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import {
  Users,
  ShieldCheck,
  Building2,
  Briefcase,
  FileSpreadsheet,
  Award,
  Video,
  Gift,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Activity,
  UserX,
  Lock,
  Calendar,
  Layers,
  BarChart3,
  ListOrdered,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'companies' | 'jobs' | 'audit'>('analytics');

  // Filters State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [applicationStatus, setApplicationStatus] = useState('');

  // Data States
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // User Management Filter
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (collegeId) params.collegeId = collegeId;
      if (companyId) params.companyId = companyId;
      if (applicationStatus) params.applicationStatus = applicationStatus;

      const [anaRes, userRes, compRes, colRes, jobRes, logRes] = await Promise.all([
        API.get('/admin/analytics', { params }),
        API.get('/admin/users', { params: { search: userSearch, role: userRoleFilter } }),
        API.get('/admin/companies'),
        API.get('/admin/colleges'),
        API.get('/admin/jobs'),
        API.get('/admin/audit-logs'),
      ]);

      setAnalytics(anaRes.data.data);
      setUsers(userRes.data.data.users);
      setCompanies(compRes.data.data);
      setColleges(colRes.data.data);
      setJobs(jobRes.data.data);
      setAuditLogs(logRes.data.data);
    } catch (err) {
      console.error('Failed to load admin dashboard statistics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [startDate, endDate, collegeId, companyId, applicationStatus, userSearch, userRoleFilter]);

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      await API.patch(`/admin/users/${userId}/status`, { status: nextStatus });
      fetchAdminData();
    } catch (err) {
      console.error('Failed to update user status', err);
    }
  };

  const toggleCompanyVerification = async (compId: string, currentStatus: boolean) => {
    try {
      await API.patch(`/admin/companies/${compId}/verify`, { isVerified: !currentStatus });
      fetchAdminData();
    } catch (err) {
      console.error('Failed to verify company', err);
    }
  };

  const toggleJobStatus = async (jId: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
      await API.patch(`/admin/jobs/${jId}/status`, { status: nextStatus });
      fetchAdminData();
    } catch (err) {
      console.error('Failed to update job status', err);
    }
  };

  if (loading && !analytics) {
    return <div className="p-8 text-center text-slate-400">Loading system governance analytics...</div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-3">
            <ShieldCheck className="h-7 w-7 text-indigo-400" />
            <span>PlaceMux System Governance & Analytics</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time PostgreSQL recruitment metrics, recruiter verification, job moderation, and audit logs
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold"
        >
          Refresh Data
        </button>
      </div>

      {/* Multi-Dimensional Filters Bar */}
      <div className="glass-panel p-4 space-y-3">
        <div className="text-xs font-semibold uppercase text-slate-400 flex items-center space-x-2">
          <Filter className="h-4 w-4 text-indigo-400" />
          <span>Real-Time Analytics Filter Bar</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Preset Date Filter */}
          <select
            onChange={(e) => {
              const val = e.target.value;
              if (val === '7d') {
                const d = new Date();
                d.setDate(d.getDate() - 7);
                setStartDate(d.toISOString());
              } else if (val === '30d') {
                const d = new Date();
                d.setDate(d.getDate() - 30);
                setStartDate(d.toISOString());
              } else {
                setStartDate('');
                setEndDate('');
              }
            }}
            className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Date Range: All Time</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>

          {/* College Filter */}
          <select
            value={collegeId}
            onChange={(e) => setCollegeId(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Colleges</option>
            {colleges.map((col) => (
              <option key={col.id} value={col.id}>
                {col.name} ({col.code})
              </option>
            ))}
          </select>

          {/* Company Filter */}
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Companies</option>
            {companies.map((comp) => (
              <option key={comp.id} value={comp.id}>
                {comp.name}
              </option>
            ))}
          </select>

          {/* Application Status Filter */}
          <select
            value={applicationStatus}
            onChange={(e) => setApplicationStatus(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Application Statuses</option>
            <option value="APPLIED">APPLIED</option>
            <option value="SHORTLISTED">SHORTLISTED</option>
            <option value="ASSESSMENT">ASSESSMENT</option>
            <option value="INTERVIEW">INTERVIEW</option>
            <option value="SELECTED">SELECTED</option>
            <option value="OFFERED">OFFERED</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="REJECTED">REJECTED</option>
          </select>

          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setCollegeId('');
              setCompanyId('');
              setApplicationStatus('');
            }}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs text-slate-300 font-semibold"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* 9 PostgreSQL KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="glass-card p-4 flex items-center space-x-3">
          <div className="p-3 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase text-slate-400">Total Users</div>
            <div className="text-xl font-bold text-white mt-0.5">{analytics?.totalUsers || 0}</div>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center space-x-3">
          <div className="p-3 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase text-slate-400">Active Students</div>
            <div className="text-xl font-bold text-white mt-0.5">{analytics?.activeStudents || 0}</div>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center space-x-3">
          <div className="p-3 bg-purple-600/10 border border-purple-500/20 text-purple-400 rounded-xl">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase text-slate-400">Verified Companies</div>
            <div className="text-xl font-bold text-white mt-0.5">{analytics?.activeCompanies || 0}</div>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center space-x-3">
          <div className="p-3 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-xl">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase text-slate-400">Job Drives</div>
            <div className="text-xl font-bold text-white mt-0.5">{analytics?.totalJobs || 0}</div>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center space-x-3">
          <div className="p-3 bg-amber-600/10 border border-amber-500/20 text-amber-400 rounded-xl">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase text-slate-400">Applications</div>
            <div className="text-xl font-bold text-white mt-0.5">{analytics?.totalApplications || 0}</div>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center space-x-3">
          <div className="p-3 bg-cyan-600/10 border border-cyan-500/20 text-cyan-400 rounded-xl">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase text-slate-400">Assessments</div>
            <div className="text-xl font-bold text-white mt-0.5">{analytics?.totalAssessments || 0}</div>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center space-x-3">
          <div className="p-3 bg-rose-600/10 border border-rose-500/20 text-rose-400 rounded-xl">
            <Video className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase text-slate-400">Interviews</div>
            <div className="text-xl font-bold text-white mt-0.5">{analytics?.totalInterviews || 0}</div>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center space-x-3">
          <div className="p-3 bg-amber-600/10 border border-amber-500/20 text-amber-400 rounded-xl">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase text-slate-400">Offers Issued</div>
            <div className="text-xl font-bold text-white mt-0.5">{analytics?.totalOffers || 0}</div>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center space-x-3 sm:col-span-2 lg:col-span-2">
          <div className="p-3 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase text-slate-400">Placements & Rate</div>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">
              {analytics?.placedStudents || 0} placed ({analytics?.placementRate || 0}%)
            </div>
          </div>
        </div>
      </div>

      {/* Admin Tab Navigation */}
      <div className="flex border-b border-slate-800 overflow-x-auto space-x-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 px-1 border-b-2 flex items-center space-x-2 transition-colors ${
            activeTab === 'analytics'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Real-Time Charts & Pipeline</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-1 border-b-2 flex items-center space-x-2 transition-colors ${
            activeTab === 'users'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>User Governance ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('companies')}
          className={`pb-3 px-1 border-b-2 flex items-center space-x-2 transition-colors ${
            activeTab === 'companies'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Company Verification ({companies.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('jobs')}
          className={`pb-3 px-1 border-b-2 flex items-center space-x-2 transition-colors ${
            activeTab === 'jobs'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Briefcase className="h-4 w-4" />
          <span>Job Moderation ({jobs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-1 border-b-2 flex items-center space-x-2 transition-colors ${
            activeTab === 'audit'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Audit Logs ({auditLogs.length})</span>
        </button>
      </div>

      {/* Tab 1: Real-Time PostgreSQL Charts & Visual Distributions */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Application Pipeline Status Distribution */}
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Layers className="h-4 w-4 text-indigo-400" />
              <span>Application Pipeline Distribution</span>
            </h3>

            <div className="space-y-3">
              {['APPLIED', 'SHORTLISTED', 'ASSESSMENT', 'INTERVIEW', 'SELECTED', 'OFFERED', 'ACCEPTED', 'REJECTED'].map(
                (st) => {
                  const count = analytics?.applicationsByStatus?.[st] || 0;
                  const total = analytics?.totalApplications || 1;
                  const pct = Math.round((count / (total || 1)) * 100);

                  return (
                    <div key={st} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-300">{st}</span>
                        <span className="text-indigo-400">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* Branch Placement Distribution */}
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Award className="h-4 w-4 text-emerald-400" />
              <span>Placements by Engineering Branch</span>
            </h3>

            <div className="space-y-3">
              {Object.keys(analytics?.placementsByBranch || {}).length === 0 ? (
                <div className="text-xs text-slate-500 italic p-4 text-center">
                  No placement branch data recorded yet.
                </div>
              ) : (
                Object.entries(analytics?.placementsByBranch || {}).map(([branch, count]: any) => (
                  <div key={branch} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-300">{branch}</span>
                      <span className="text-emerald-400">{count} placed</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (count / (analytics?.placedStudents || 1)) * 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: User Governance Table */}
      {activeTab === 'users' && (
        <div className="glass-panel p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users by email..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <select
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Roles</option>
              <option value="STUDENT">STUDENT</option>
              <option value="COMPANY">COMPANY</option>
              <option value="COLLEGE">COLLEGE</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Profile Info</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-semibold text-white">{u.email}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">
                      {u.student
                        ? `${u.student.firstName} ${u.student.lastName} (${u.student.branch || 'General'})`
                        : u.company
                        ? u.company.name
                        : u.college
                        ? u.college.name
                        : 'System Admin'}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => toggleUserStatus(u.id, u.status)}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-indigo-300"
                        >
                          {u.status === 'ACTIVE' ? 'Suspend User' : 'Activate User'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Company Verification Approvals */}
      {activeTab === 'companies' && (
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Recruiter & Company Verification Roster</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                  <th className="p-3">Company Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Industry</th>
                  <th className="p-3">Job Postings</th>
                  <th className="p-3">Verification</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {companies.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-semibold text-white">{c.name}</td>
                    <td className="p-3 text-slate-400">{c.user?.email}</td>
                    <td className="p-3 text-slate-300">{c.industry || 'Tech'}</td>
                    <td className="p-3 font-bold text-indigo-400">{c._count?.jobs || 0}</td>
                    <td className="p-3">
                      {c.verificationStatus === 'VERIFIED' ? (
                        <span className="text-emerald-400 font-semibold">Verified</span>
                      ) : (
                        <span className="text-amber-400 font-semibold">Pending Approval</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => toggleCompanyVerification(c.id, c.verificationStatus === 'VERIFIED')}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-indigo-300"
                      >
                        {c.verificationStatus === 'VERIFIED' ? 'Revoke Verification' : 'Approve & Verify'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Job Moderation */}
      {activeTab === 'jobs' && (
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Job Drive Moderation</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                  <th className="p-3">Job Title</th>
                  <th className="p-3">Company</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Applications</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {jobs.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-semibold text-white">{j.title}</td>
                    <td className="p-3 text-slate-300">{j.company?.name}</td>
                    <td className="p-3 text-slate-400">{j.location}</td>
                    <td className="p-3 font-bold text-indigo-400">{j._count?.applications || 0}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          j.status === 'ACTIVE'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        {j.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => toggleJobStatus(j.id, j.status)}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-indigo-300"
                      >
                        {j.status === 'ACTIVE' ? 'Close Drive' : 'Reactivate Drive'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Audit Log Trail */}
      {activeTab === 'audit' && (
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Activity className="h-4 w-4 text-indigo-400" />
            <span>Administrative & Security Audit Trail</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Admin Email</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40">
                    <td className="p-3 text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3 font-semibold text-indigo-400">{log.action}</td>
                    <td className="p-3 text-slate-300">{log.user?.email || 'System'}</td>
                    <td className="p-3 text-slate-400">{log.ipAddress || '127.0.0.1'}</td>
                    <td className="p-3 text-slate-400 max-w-xs truncate">
                      {JSON.stringify(log.details)}
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
