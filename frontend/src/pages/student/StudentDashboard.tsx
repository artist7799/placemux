import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { StudentDashboardData } from '../../types';
import {
  FileText,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  Award,
  ChevronRight,
  TrendingUp,
  FileCheck2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const StudentDashboard: React.FC = () => {
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get('/students/dashboard');
      setData(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse max-w-7xl mx-auto">
        <div className="h-10 bg-slate-800/60 rounded-xl w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-900/60 rounded-2xl border border-slate-800"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 bg-slate-900/60 rounded-2xl border border-slate-800"></div>
          <div className="h-64 bg-slate-900/60 rounded-2xl border border-slate-800"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <div className="inline-flex p-4 rounded-full bg-rose-950/60 border border-rose-800 text-rose-400">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Dashboard Unavailable</h2>
        <p className="text-sm text-slate-400">{error || 'Could not load student metrics.'}</p>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 border-l-4 border-l-indigo-500">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Welcome back, <span className="gradient-text">{data.name || 'Student'}</span> 👋
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {data.branch ? `${data.branch} • ` : ''}
            {data.cgpa ? `CGPA: ${data.cgpa}` : 'Complete your profile to unlock custom matches'}
          </p>
        </div>
        <Link
          to="/student/profile"
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition-all"
        >
          <span>Update Profile</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Profile Completion */}
        <div className="glass-card flex items-center space-x-4">
          <div className="relative flex items-center justify-center h-14 w-14 shrink-0 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase text-slate-400">Profile Match Score</div>
            <div className="text-2xl font-bold text-white mt-0.5">{data.profileCompletion}%</div>
            <div className="w-24 bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${data.profileCompletion}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Resume Score */}
        <div className="glass-card flex items-center space-x-4">
          <div className="flex items-center justify-center h-14 w-14 shrink-0 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase text-slate-400">Resume Status</div>
            <div className="text-lg font-bold text-white mt-0.5">
              {data.resumeStatus === 'UPLOADED' ? (
                <span className="text-emerald-400 font-semibold text-sm">
                  Uploaded ({data.resumeScore || 75} ATS Score)
                </span>
              ) : (
                <span className="text-amber-400 font-semibold text-sm">Not Uploaded</span>
              )}
            </div>
            <Link to="/student/profile" className="text-xs text-indigo-400 hover:underline mt-1 block">
              Manage Resume →
            </Link>
          </div>
        </div>

        {/* Pending Assessments */}
        <div className="glass-card flex items-center space-x-4">
          <div className="flex items-center justify-center h-14 w-14 shrink-0 rounded-2xl bg-purple-600/10 border border-purple-500/20 text-purple-400">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase text-slate-400">Pending Tests</div>
            <div className="text-2xl font-bold text-white mt-0.5">{data.pendingAssessments.length}</div>
            <div className="text-xs text-slate-500 mt-1">Assessments in progress</div>
          </div>
        </div>

        {/* Active Offers */}
        <div className="glass-card flex items-center space-x-4">
          <div className="flex items-center justify-center h-14 w-14 shrink-0 rounded-2xl bg-amber-600/10 border border-amber-500/20 text-amber-400">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase text-slate-400">Offers Extended</div>
            <div className="text-2xl font-bold text-white mt-0.5">{data.offers.length}</div>
            <div className="text-xs text-amber-400/80 mt-1">Placement Drives</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Applications & Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Applications */}
        <div className="lg:col-span-2 glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <FileCheck2 className="h-5 w-5 text-indigo-400" />
              <span>Recent Applications</span>
            </h3>
            <span className="text-xs font-semibold text-slate-500 uppercase">
              {data.recentApplications.length} Active
            </span>
          </div>

          {data.recentApplications.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl space-y-2">
              <Briefcase className="h-8 w-8 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400">You haven't submitted any job applications yet.</p>
              <Link to="/student/jobs" className="text-xs text-indigo-400 font-semibold hover:underline block">
                Browse Campus Jobs →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {data.recentApplications.map((app) => (
                <div key={app.id} className="py-3.5 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-white">{app.jobTitle}</div>
                    <div className="text-xs text-slate-400">{app.companyName}</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                      {app.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Widgets: Upcoming Interviews & Offers */}
        <div className="space-y-6">
          {/* Upcoming Interviews */}
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-md font-bold text-white flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-purple-400" />
              <span>Upcoming Interviews</span>
            </h3>

            {data.upcomingInterviews.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/40 text-center text-xs text-slate-500 border border-slate-800">
                No scheduled interviews at this time.
              </div>
            ) : (
              <div className="space-y-3">
                {data.upcomingInterviews.map((interview) => (
                  <div key={interview.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="text-xs font-bold text-indigo-300">{interview.jobTitle}</div>
                    <div className="text-xs text-slate-400">{interview.companyName}</div>
                    <div className="text-xs text-purple-400 flex items-center space-x-1 pt-1">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(interview.scheduledAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Offers */}
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-md font-bold text-white flex items-center space-x-2">
              <Award className="h-5 w-5 text-amber-400" />
              <span>Placement Offers</span>
            </h3>

            {data.offers.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/40 text-center text-xs text-slate-500 border border-slate-800">
                No active placement offers yet.
              </div>
            ) : (
              <div className="space-y-3">
                {data.offers.map((offer) => (
                  <div key={offer.id} className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-1">
                    <div className="text-xs font-bold text-amber-300">{offer.positionTitle}</div>
                    <div className="text-xs text-slate-300">{offer.companyName}</div>
                    <div className="text-xs text-emerald-400 font-semibold">{offer.salary}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recommended Jobs */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Briefcase className="h-5 w-5 text-indigo-400" />
            <span>Recommended Job Openings</span>
          </h3>
        </div>

        {data.recommendedJobs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 border border-slate-800 rounded-xl">
            No active jobs found matching your criteria. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.recommendedJobs.map((job) => (
              <div key={job.id} className="glass-card space-y-3 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">
                    {job.company.name}
                  </div>
                  <h4 className="text-base font-bold text-white mt-1">{job.title}</h4>
                  <div className="text-xs text-slate-400 mt-1 flex items-center space-x-2">
                    <span>{job.location}</span>
                    <span>•</span>
                    <span>{job.jobType}</span>
                  </div>
                  {job.salaryRange && (
                    <div className="text-xs font-semibold text-emerald-400 mt-2">{job.salaryRange}</div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Matching criteria high</span>
                  <button className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors">
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
