import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { Search, MapPin, Briefcase, DollarSign, Award, CheckCircle2, AlertCircle, X, ExternalLink } from 'lucide-react';

export const JobDiscovery: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [jobType, setJobType] = useState('');
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (jobType) params.jobType = jobType;

      const res = await API.get('/jobs', { params });
      setJobs(res.data.data);
    } catch (err) {
      console.error('Failed to fetch jobs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [search, jobType]);

  const openJobDetails = async (jobId: string) => {
    setMessage(null);
    try {
      const res = await API.get(`/jobs/${jobId}`);
      setSelectedJob(res.data.data);
    } catch (err) {
      console.error('Failed to load job details', err);
    }
  };

  const handleApply = async (jobId: string) => {
    setApplying(true);
    setMessage(null);
    try {
      await API.post('/applications/apply', { jobId });
      setMessage({ type: 'success', text: 'Application submitted successfully!' });
      openJobDetails(jobId);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to submit application.' });
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header & Filter Controls */}
      <div className="glass-panel p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Campus Job Discovery</h1>
          <p className="text-sm text-slate-400">
            Explore active recruitment drives and apply directly with your PlaceMux student profile.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by job title, skill, or company name..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Job Types</option>
            <option value="FULL_TIME">Full Time</option>
            <option value="INTERNSHIP">Internship</option>
            <option value="PART_TIME">Part Time</option>
            <option value="CONTRACT">Contract</option>
          </select>
        </div>
      </div>

      {/* Job Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-slate-900/60 rounded-2xl border border-slate-800"></div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="p-12 text-center glass-panel space-y-2">
          <Briefcase className="h-10 w-10 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Jobs Found</h3>
          <p className="text-sm text-slate-400">Try clearing filters or search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div key={job.id} className="glass-card flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">
                    {job.company?.name || 'Company'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                    {job.jobType}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">{job.title}</h3>
                <div className="flex items-center space-x-3 text-xs text-slate-400">
                  <span className="flex items-center space-x-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-500" />
                    <span>{job.location}</span>
                  </span>
                  {job.minCgpa > 0 && (
                    <span className="flex items-center space-x-1">
                      <Award className="h-3.5 w-3.5 text-amber-400" />
                      <span>Min {job.minCgpa} CGPA</span>
                    </span>
                  )}
                </div>
                {job.salaryRange && (
                  <div className="text-xs font-semibold text-emerald-400 flex items-center space-x-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>{job.salaryRange}</span>
                  </div>
                )}
              </div>

              {/* Required Skills Badges */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {job.jobSkills?.map((js: any) => (
                  <span
                    key={js.id}
                    className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-indigo-950/80 text-indigo-300 border border-indigo-900/60"
                  >
                    {js.skill.name}
                  </span>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-500">{job._count?.applications || 0} applicants</span>
                <button
                  onClick={() => openJobDetails(job.id)}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl glass-panel p-6 md:p-8 space-y-6 my-8">
            <button
              onClick={() => setSelectedJob(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <div className="text-xs font-semibold uppercase text-indigo-400">{selectedJob.company?.name}</div>
              <h2 className="text-2xl font-bold text-white mt-1">{selectedJob.title}</h2>
              <div className="flex items-center space-x-4 text-xs text-slate-400 mt-2">
                <span>📍 {selectedJob.location}</span>
                <span>💼 {selectedJob.jobType}</span>
                {selectedJob.salaryRange && <span className="text-emerald-400 font-semibold">💰 {selectedJob.salaryRange}</span>}
              </div>
            </div>

            {message && (
              <div
                className={`p-3 rounded-xl flex items-center space-x-2 text-xs ${
                  message.type === 'success'
                    ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/80 border border-rose-800 text-rose-300'
                }`}
              >
                {message.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                <span>{message.text}</span>
              </div>
            )}

            {/* Eligibility Banner */}
            <div
              className={`p-4 rounded-xl border flex items-start space-x-3 text-xs ${
                selectedJob.isEligible
                  ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                  : 'bg-amber-950/30 border-amber-800/60 text-amber-300'
              }`}
            >
              {selectedJob.isEligible ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0 text-amber-400" />
              )}
              <div>
                <div className="font-bold">
                  {selectedJob.isEligible ? 'You are eligible to apply for this role' : 'Eligibility Notice'}
                </div>
                {selectedJob.eligibilityReasons && selectedJob.eligibilityReasons.length > 0 && (
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-300">
                    {selectedJob.eligibilityReasons.map((reason: string, idx: number) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-white">Job Description</h4>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                {selectedJob.description}
              </p>
            </div>

            {/* Requirements */}
            {selectedJob.requirements && selectedJob.requirements.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white">Requirements</h4>
                <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                  {selectedJob.requirements.map((req: string, idx: number) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Apply Button Action */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              {selectedJob.hasApplied ? (
                <span className="px-4 py-2 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-300 font-semibold text-xs">
                  ✓ Application Submitted ({selectedJob.existingApplication?.currentStatus})
                </span>
              ) : (
                <button
                  disabled={!selectedJob.isEligible || applying}
                  onClick={() => handleApply(selectedJob.id)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {applying ? 'Submitting Application...' : 'Apply Now'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
