import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import {
  Users,
  Award,
  TrendingUp,
  Briefcase,
  Building2,
  Gift,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Download,
} from 'lucide-react';

export const CollegeDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [drives, setDrives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Directory Filters
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('');
  const [minCgpa, setMinCgpa] = useState('');
  const [placementStatus, setPlacementStatus] = useState('');

  const fetchCollegeData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (branch) params.branch = branch;
      if (minCgpa) params.minCgpa = minCgpa;
      if (placementStatus) params.placementStatus = placementStatus;

      const [metRes, studRes, driveRes] = await Promise.all([
        API.get('/colleges/dashboard'),
        API.get('/colleges/students', { params }),
        API.get('/colleges/drives'),
      ]);

      setMetrics(metRes.data.data);
      setStudents(studRes.data.data);
      setDrives(driveRes.data.data);
    } catch (err) {
      console.error('Failed to load college placement data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollegeData();
  }, [search, branch, minCgpa, placementStatus]);

  const toggleStudentVerification = async (studentId: string, currentStatus: boolean) => {
    try {
      await API.patch(`/colleges/students/${studentId}/verify`, {
        isVerified: !currentStatus,
      });
      fetchCollegeData();
    } catch (err) {
      console.error('Failed to verify student', err);
    }
  };

  if (loading && !metrics) {
    return <div className="p-8 text-center text-slate-400">Loading college placement statistics...</div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {metrics?.collegeName || 'College'} Placement Portal & Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            College Code: <span className="text-indigo-400 font-semibold">{metrics?.collegeCode || 'COL-2026'}</span> • Campus Roster & Drive Governance
          </p>
        </div>

        <button
          onClick={fetchCollegeData}
          className="px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold"
        >
          Refresh Statistics
        </button>
      </div>

      {/* 7 Key Dashboard Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card flex items-center space-x-4">
          <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase text-slate-400">Total Enrolled</div>
            <div className="text-2xl font-bold text-white mt-0.5">{metrics?.totalStudents || 0}</div>
          </div>
        </div>

        <div className="glass-card flex items-center space-x-4">
          <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase text-slate-400">Students Placed</div>
            <div className="text-2xl font-bold text-white mt-0.5">{metrics?.placedStudents || 0}</div>
          </div>
        </div>

        <div className="glass-card flex items-center space-x-4">
          <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-purple-600/10 border border-purple-500/20 text-purple-400">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase text-slate-400">Placement Rate</div>
            <div className="text-2xl font-bold text-indigo-400 mt-0.5">{metrics?.placementPercentage || 0}%</div>
            <div className="w-20 bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full"
                style={{ width: `${metrics?.placementPercentage || 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="glass-card flex items-center space-x-4">
          <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-amber-600/10 border border-amber-500/20 text-amber-400">
            <Gift className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase text-slate-400">Total Offers</div>
            <div className="text-2xl font-bold text-amber-400 mt-0.5">{metrics?.totalOffers || 0}</div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-panel p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase text-slate-400">Eligible Candidates</div>
            <div className="text-xl font-bold text-white mt-1">{metrics?.eligibleStudents || 0}</div>
          </div>
          <Award className="h-6 w-6 text-emerald-400" />
        </div>

        <div className="glass-panel p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase text-slate-400">Active Campus Drives</div>
            <div className="text-xl font-bold text-white mt-1">{metrics?.activeDrives || 0}</div>
          </div>
          <Briefcase className="h-6 w-6 text-indigo-400" />
        </div>

        <div className="glass-panel p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase text-slate-400">Visiting Companies</div>
            <div className="text-xl font-bold text-white mt-1">{metrics?.totalCompanies || 0}</div>
          </div>
          <Building2 className="h-6 w-6 text-purple-400" />
        </div>
      </div>

      {/* Student Directory & Verification Table */}
      <div className="glass-panel p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Users className="h-5 w-5 text-indigo-400" />
            <span>Student Roster Directory ({students.length})</span>
          </h2>
        </div>

        {/* Directory Search & Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name or email..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <input
            type="text"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder="Filter Branch (e.g. Computer Science)"
            className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          />

          <select
            value={placementStatus}
            onChange={(e) => setPlacementStatus(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Placement Statuses</option>
            <option value="UNPLACED">UNPLACED</option>
            <option value="PLACED">PLACED</option>
            <option value="OPTED_OUT">OPTED OUT</option>
          </select>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="p-3">Student Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Branch</th>
                <th className="p-3">CGPA</th>
                <th className="p-3">Placement Status</th>
                <th className="p-3">Verification</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {students.map((stud) => (
                <tr key={stud.id} className="hover:bg-slate-900/40">
                  <td className="p-3 font-semibold text-white">
                    {stud.firstName} {stud.lastName}
                  </td>
                  <td className="p-3 text-slate-400">{stud.user?.email}</td>
                  <td className="p-3 text-slate-300">{stud.branch || 'Unassigned'}</td>
                  <td className="p-3 font-bold text-indigo-400">{stud.cgpa || 'N/A'}</td>
                  <td className="p-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        stud.placementStatus === 'PLACED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {stud.placementStatus}
                    </span>
                  </td>
                  <td className="p-3">
                    {stud.isVerified ? (
                      <span className="inline-flex items-center space-x-1 text-emerald-400 font-semibold">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-amber-400 font-semibold">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        <span>Pending</span>
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => toggleStudentVerification(stud.id, stud.isVerified)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-indigo-300"
                    >
                      {stud.isVerified ? 'Revoke Verification' : 'Verify Student'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
