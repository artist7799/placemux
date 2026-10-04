import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { ApplicationItem } from '../../types';
import { FileCheck2, Clock, Ban, ChevronRight, AlertCircle, CheckCircle2, History } from 'lucide-react';

export const MyApplications: React.FC = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await API.get('/applications/my-applications');
      setApplications(res.data.data);
    } catch (err) {
      console.error('Failed to fetch applications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleWithdraw = async (applicationId: string) => {
    if (!window.confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      return;
    }
    setWithdrawing(true);
    setMessage(null);
    try {
      await API.patch(`/applications/${applicationId}/withdraw`);
      setMessage({ type: 'success', text: 'Application withdrawn successfully.' });
      fetchApplications();
      setSelectedApp(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to withdraw application.' });
    } finally {
      setWithdrawing(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
      case 'OFFERED':
      case 'SELECTED':
        return 'bg-emerald-950 text-emerald-400 border-emerald-800';
      case 'INTERVIEW':
      case 'ASSESSMENT_PASSED':
        return 'bg-purple-950 text-purple-400 border-purple-800';
      case 'SHORTLISTED':
      case 'ASSESSMENT':
        return 'bg-indigo-950 text-indigo-400 border-indigo-800';
      case 'REJECTED':
        return 'bg-rose-950 text-rose-400 border-rose-800';
      case 'WITHDRAWN':
        return 'bg-slate-900 text-slate-400 border-slate-700';
      default:
        return 'bg-blue-950 text-blue-400 border-blue-800';
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="glass-panel p-6">
        <h1 className="text-2xl font-bold text-white">Application Pipeline & Tracking</h1>
        <p className="text-sm text-slate-400">
          Track real-time application status, interview schedules, placement offers, and status history logs.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl flex items-center space-x-2 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
              : 'bg-rose-950/60 border border-rose-800 text-rose-300'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-slate-400">Loading your submitted applications...</div>
      ) : applications.length === 0 ? (
        <div className="p-12 text-center glass-panel space-y-2">
          <FileCheck2 className="h-10 w-10 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Applications Found</h3>
          <p className="text-sm text-slate-400">You haven't submitted any job applications yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app.id} className="glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-bold text-white">{app.job?.title}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(
                      app.currentStatus
                    )}`}
                  >
                    {app.currentStatus}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Company: <span className="text-slate-200 font-semibold">{app.job?.company?.name}</span> • Location: {app.job?.location}
                </div>
                <div className="text-xs text-slate-500 pt-1">
                  Submitted: {new Date(app.submittedAt).toLocaleDateString()} • Match Compatibility: {app.matchScore || 75}%
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSelectedApp(app)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-all flex items-center space-x-1"
                >
                  <History className="h-3.5 w-3.5" />
                  <span>View History</span>
                </button>

                {app.currentStatus !== 'WITHDRAWN' && app.currentStatus !== 'ACCEPTED' && (
                  <button
                    disabled={withdrawing}
                    onClick={() => handleWithdraw(app.id)}
                    className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-xs font-semibold text-rose-300 transition-all flex items-center space-x-1"
                  >
                    <Ban className="h-3.5 w-3.5" />
                    <span>Withdraw</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status History Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg glass-panel p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Application Audit Timeline</h3>
                <p className="text-xs text-slate-400">{selectedApp.job?.title} at {selectedApp.job?.company?.name}</p>
              </div>
              <button onClick={() => setSelectedApp(null)} className="text-slate-400 hover:text-white text-sm">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {selectedApp.statusHistory?.map((history: any, idx: number) => (
                <div key={history.id} className="relative pl-6 border-l-2 border-indigo-500/40 pb-4 last:pb-0">
                  <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-indigo-600 border-2 border-slate-950"></div>
                  <div className="text-xs font-bold text-indigo-300">{history.status}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{history.remarks || 'Status update logged.'}</div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {new Date(history.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
