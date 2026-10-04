import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { Briefcase, Plus, Users, CheckCircle2, AlertCircle, Eye, Edit3, X, FileText } from 'lucide-react';

export const CompanyJobManager: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('FULL_TIME');
  const [salaryRange, setSalaryRange] = useState('');
  const [minCgpa, setMinCgpa] = useState<number | ''>('');
  const [eligibleBranches, setEligibleBranches] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Status Update state
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusRemarks, setStatusRemarks] = useState('');

  const fetchCompanyJobs = async () => {
    setLoading(true);
    try {
      const res = await API.get('/jobs/company/my-jobs');
      setJobs(res.data.data);
    } catch (err) {
      console.error('Failed to fetch company jobs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyJobs();
  }, []);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      await API.post('/jobs', {
        title,
        description,
        location,
        jobType,
        salaryRange,
        minCgpa: minCgpa !== '' ? Number(minCgpa) : 0,
        eligibleBranches: eligibleBranches ? eligibleBranches.split(',').map((b) => b.trim()) : [],
        requiredSkillNames: requiredSkills ? requiredSkills.split(',').map((s) => s.trim()) : [],
      });
      setMessage({ type: 'success', text: 'Job posting published successfully!' });
      setShowModal(false);
      fetchCompanyJobs();
      // Reset form
      setTitle('');
      setDescription('');
      setLocation('');
      setSalaryRange('');
      setMinCgpa('');
      setEligibleBranches('');
      setRequiredSkills('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create job.' });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleJobStatus = async (jobId: string, currentStatus: string) => {
    const targetStatus = currentStatus === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
    try {
      await API.patch(`/jobs/${jobId}/status`, { status: targetStatus });
      fetchCompanyJobs();
    } catch (err) {
      console.error('Failed to toggle job status', err);
    }
  };

  const viewApplicants = async (jobId: string) => {
    setSelectedJobId(jobId);
    setLoadingApps(true);
    try {
      const res = await API.get(`/applications/job/${jobId}`);
      setApplications(res.data.data);
    } catch (err) {
      console.error('Failed to fetch job applications', err);
    } finally {
      setLoadingApps(false);
    }
  };

  const handleUpdateApplicantStatus = async (appId: string) => {
    if (!newStatus) return;
    try {
      await API.patch(`/applications/${appId}/status`, {
        status: newStatus,
        remarks: statusRemarks,
      });
      setUpdatingAppId(null);
      setNewStatus('');
      setStatusRemarks('');
      if (selectedJobId) viewApplicants(selectedJobId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status.');
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="glass-panel p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Company Recruitment & Job Manager</h1>
          <p className="text-sm text-slate-400">
            Post new campus jobs, configure eligibility criteria, and manage candidate pipelines.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg flex items-center space-x-2 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Post New Job</span>
        </button>
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

      {/* Posted Jobs Grid */}
      {loading ? (
        <div className="p-8 text-center text-slate-400">Loading posted jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="p-12 text-center glass-panel space-y-2">
          <Briefcase className="h-10 w-10 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Jobs Posted Yet</h3>
          <p className="text-sm text-slate-400">Click "Post New Job" to list your first recruitment opening.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((job) => (
            <div key={job.id} className="glass-panel p-6 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      job.status === 'ACTIVE'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {job.status}
                  </span>
                  <span className="text-xs text-slate-400">{job.jobType}</span>
                </div>
                <h3 className="text-xl font-bold text-white mt-2">{job.title}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{job.description}</p>
                <div className="text-xs text-slate-500 pt-2">
                  Location: {job.location} • Min CGPA: {job.minCgpa || 0}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => viewApplicants(job.id)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center space-x-1"
                >
                  <Users className="h-4 w-4" />
                  <span>View {job._count?.applications || 0} Applicants</span>
                </button>

                <button
                  onClick={() => toggleJobStatus(job.id, job.status)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300"
                >
                  {job.status === 'ACTIVE' ? 'Close Posting' : 'Activate Posting'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Applicants View Modal */}
      {selectedJobId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-4xl glass-panel p-6 md:p-8 space-y-6 my-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Candidate Applications Pipeline</h2>
              <button onClick={() => setSelectedJobId(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingApps ? (
              <div className="p-8 text-center text-slate-400">Loading applicants...</div>
            ) : applications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No student applications received yet.</div>
            ) : (
              <div className="divide-y divide-slate-800">
                {applications.map((app) => (
                  <div key={app.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-white">
                        {app.student?.firstName} {app.student?.lastName}
                      </div>
                      <div className="text-xs text-slate-400">
                        Email: {app.student?.user?.email} • CGPA: {app.student?.cgpa || 'N/A'} • Branch: {app.student?.branch || 'N/A'}
                      </div>
                      <div className="text-xs text-indigo-400 font-semibold">
                        Match Score: {app.matchScore || 75}% • Current Status: {app.currentStatus}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {updatingAppId === app.id ? (
                        <div className="flex items-center space-x-2">
                          <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white"
                          >
                            <option value="">Select Status</option>
                            <option value="SHORTLISTED">SHORTLISTED</option>
                            <option value="ASSESSMENT">ASSESSMENT</option>
                            <option value="ASSESSMENT_PASSED">ASSESSMENT_PASSED</option>
                            <option value="INTERVIEW">INTERVIEW</option>
                            <option value="SELECTED">SELECTED</option>
                            <option value="OFFERED">OFFERED</option>
                            <option value="REJECTED">REJECTED</option>
                          </select>
                          <button
                            onClick={() => handleUpdateApplicantStatus(app.id)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold text-white"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setUpdatingAppId(null)}
                            className="px-2 py-1.5 bg-slate-800 rounded-lg text-xs text-slate-400"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setUpdatingAppId(app.id);
                            setNewStatus(app.currentStatus);
                          }}
                          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-indigo-300 border border-slate-700"
                        >
                          Update Status
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Job Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-xl glass-panel p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Create New Job Posting</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Job Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Senior Frontend Developer"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Location</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="San Francisco, CA / Remote"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Job Type</label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="INTERNSHIP">Internship</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Salary Range</label>
                  <input
                    type="text"
                    value={salaryRange}
                    onChange={(e) => setSalaryRange(e.target.value)}
                    placeholder="$80,000 - $120,000"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Min CGPA</label>
                  <input
                    type="number"
                    step="0.1"
                    value={minCgpa}
                    onChange={(e) => setMinCgpa(e.target.value ? Number(e.target.value) : '')}
                    placeholder="7.5"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Eligible Branches (comma separated)</label>
                <input
                  type="text"
                  value={eligibleBranches}
                  onChange={(e) => setEligibleBranches(e.target.value)}
                  placeholder="Computer Science, Information Technology"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Required Skills (comma separated)</label>
                <input
                  type="text"
                  value={requiredSkills}
                  onChange={(e) => setRequiredSkills(e.target.value)}
                  placeholder="React, TypeScript, Node.js"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Job Description</label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed job description and responsibilities..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white shadow-lg disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : 'Publish Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
