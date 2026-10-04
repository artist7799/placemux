import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { StudentProfile as IStudentProfile } from '../../types';
import {
  User,
  GraduationCap,
  Award,
  Code,
  FolderGit2,
  FileUp,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Save,
} from 'lucide-react';

export const StudentProfile: React.FC = () => {
  const [profile, setProfile] = useState<IStudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [address, setAddress] = useState('');
  const [cgpa, setCgpa] = useState<number | ''>('');
  const [branch, setBranch] = useState('');
  const [graduationYear, setGraduationYear] = useState<number | ''>('');

  // Skill Add Modal state
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('TECHNICAL');
  const [newSkillProficiency, setNewSkillProficiency] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'>('INTERMEDIATE');

  // Education Add state
  const [degree, setDegree] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [institution, setInstitution] = useState('');
  const [eduStartDate, setEduStartDate] = useState('');
  const [eduGrade, setEduGrade] = useState('');

  // Project Add state
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectTechs, setProjectTechs] = useState('');

  // Certification Add state
  const [certTitle, setCertTitle] = useState('');
  const [certOrg, setCertOrg] = useState('');
  const [certIssueDate, setCertIssueDate] = useState('');

  // Resume Upload state
  const [resumeUrl, setResumeUrl] = useState('');

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await API.get('/students/profile');
      const p: IStudentProfile = res.data.data;
      setProfile(p);
      setFirstName(p.firstName || '');
      setLastName(p.lastName || '');
      setPhone(p.phone || '');
      setBio(p.bio || '');
      setAddress(p.address || '');
      setCgpa(p.cgpa ?? '');
      setBranch(p.branch || '');
      setGraduationYear(p.graduationYear ?? '');
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to load profile details.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdatePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await API.put('/students/profile', {
        firstName,
        lastName,
        phone,
        bio,
        address,
        cgpa: cgpa !== '' ? Number(cgpa) : undefined,
        branch,
        graduationYear: graduationYear !== '' ? Number(graduationYear) : undefined,
      });
      setProfile(res.data.data);
      setMessage({ type: 'success', text: 'Personal details updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    try {
      await API.post('/students/skills', {
        skillName: newSkillName,
        category: newSkillCategory,
        proficiency: newSkillProficiency,
      });
      setNewSkillName('');
      fetchProfile();
      setMessage({ type: 'success', text: 'Skill added successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to add skill.' });
    }
  };

  const handleRemoveSkill = async (skillId: string) => {
    try {
      await API.delete(`/students/skills/${skillId}`);
      fetchProfile();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to remove skill.' });
    }
  };

  const handleAddEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await API.post('/students/education', {
        degree,
        fieldOfStudy,
        institution,
        startDate: eduStartDate || '2022-09-01',
        grade: eduGrade,
      });
      setDegree('');
      setFieldOfStudy('');
      setInstitution('');
      fetchProfile();
      setMessage({ type: 'success', text: 'Education record added!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to add education record.' });
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await API.post('/students/projects', {
        title: projectTitle,
        description: projectDesc,
        technologies: projectTechs.split(',').map((t) => t.trim()),
      });
      setProjectTitle('');
      setProjectDesc('');
      setProjectTechs('');
      fetchProfile();
      setMessage({ type: 'success', text: 'Project record added!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to add project.' });
    }
  };

  const handleAddCertification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await API.post('/students/certifications', {
        title: certTitle,
        issuingOrganization: certOrg,
        issueDate: certIssueDate || '2024-01-01',
      });
      setCertTitle('');
      setCertOrg('');
      fetchProfile();
      setMessage({ type: 'success', text: 'Certification added!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to add certification.' });
    }
  };

  const handleUploadResume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeUrl) return;
    try {
      await API.post('/students/resume', { fileUrl: resumeUrl });
      setResumeUrl('');
      fetchProfile();
      setMessage({ type: 'success', text: 'Resume uploaded successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to upload resume.' });
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading student profile...</div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="glass-panel p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Student Profile Manager</h1>
          <p className="text-sm text-slate-400">
            Keep your profile information, skills, and resume updated for placement eligibility.
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase text-slate-400 font-semibold">Profile Status</div>
          <div className="text-xl font-bold text-indigo-400">{profile?.profileCompletion}% Complete</div>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Personal Details Form */}
        <div className="lg:col-span-2 glass-panel p-6 space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <User className="h-5 w-5 text-indigo-400" />
            <span>Personal Information</span>
          </h3>

          <form onSubmit={handleUpdatePersonal} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Branch / Major</label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="Computer Science"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">CGPA (0 - 10)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={cgpa}
                  onChange={(e) => setCgpa(e.target.value ? Number(e.target.value) : '')}
                  placeholder="8.50"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Bio / Objective</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Aspiring software engineer with strong problem-solving skills..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center space-x-2 transition-all disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Skills & Resume Column */}
        <div className="space-y-6">
          {/* Skills Section */}
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Code className="h-5 w-5 text-indigo-400" />
              <span>Skills Matrix</span>
            </h3>

            <div className="flex flex-wrap gap-2">
              {profile?.skills.map((item) => (
                <span
                  key={item.id}
                  className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800/60"
                >
                  <span>{item.skill.name}</span>
                  <button
                    onClick={() => handleRemoveSkill(item.id)}
                    className="hover:text-rose-400 ml-1 text-slate-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <form onSubmit={handleAddSkill} className="space-y-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                placeholder="Add new skill (e.g. React, Python)"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="submit"
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-indigo-300 rounded-xl flex items-center justify-center space-x-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Skill</span>
              </button>
            </form>
          </div>

          {/* Resume Upload Section */}
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <FileUp className="h-5 w-5 text-emerald-400" />
              <span>Resume Management</span>
            </h3>

            {profile?.resumes && profile.resumes.length > 0 ? (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-xs font-bold text-emerald-400">Current Resume Active</div>
                <div className="text-xs text-slate-400 truncate">{profile.resumes[0].fileUrl}</div>
              </div>
            ) : (
              <div className="text-xs text-amber-400">No active resume uploaded.</div>
            )}

            <form onSubmit={handleUploadResume} className="space-y-2 pt-2 border-t border-slate-800">
              <input
                type="url"
                required
                placeholder="Paste Resume Document / Cloud URL"
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white rounded-xl flex items-center justify-center space-x-1"
              >
                <FileUp className="h-3.5 w-3.5" />
                <span>Upload Resume</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
