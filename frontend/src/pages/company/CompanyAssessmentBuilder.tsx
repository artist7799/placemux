import React, { useState } from 'react';
import API from '../../services/api';
import { Sparkles, Plus, CheckCircle2, AlertCircle, Trash2, X, FileQuestion } from 'lucide-react';

export const CompanyAssessmentBuilder: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [passingScore, setPassingScore] = useState(60);

  // Dynamic Question list builder
  const [questions, setQuestions] = useState<any[]>([
    {
      type: 'MCQ',
      prompt: 'Sample Question: What is the complexity of binary search?',
      options: ['O(n)', 'O(log n)', 'O(n^2)', 'O(1)'],
      correctAnswer: 'O(log n)',
      points: 1.0,
    },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        type: 'MCQ',
        prompt: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        points: 1.0,
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = value;
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      await API.post('/assessments', {
        title,
        description,
        durationMinutes: Number(durationMinutes),
        passingScore: Number(passingScore),
        questions,
      });

      setMessage({ type: 'success', text: 'Assessment created successfully!' });
      setShowModal(false);
      setTitle('');
      setDescription('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create assessment.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="glass-panel p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Online Assessment & Quiz Builder</h1>
          <p className="text-sm text-slate-400">
            Create automated assessments for MCQ, Aptitude, Technical, SQL, and Coding rounds.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg flex items-center space-x-2 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Test</span>
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

      {/* Assessment Builder Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl glass-panel p-6 md:p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Configure Assessment & Questions</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Assessment Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Technical & Logical Reasoning Round"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    required
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Passing Score (%)</label>
                  <input
                    type="number"
                    required
                    value={passingScore}
                    onChange={(e) => setPassingScore(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Question Items ({questions.length})</h3>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="px-3 py-1 bg-indigo-600/20 text-indigo-300 rounded-lg text-xs font-semibold hover:bg-indigo-600/30 flex items-center space-x-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                {questions.map((q, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-400">Question #{idx + 1}</span>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(idx)}
                          className="text-xs text-rose-400 hover:text-rose-300"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase">Question Type</label>
                        <select
                          value={q.type}
                          onChange={(e) => updateQuestion(idx, 'type', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                        >
                          <option value="MCQ">MCQ (Single Choice)</option>
                          <option value="MULTI_SELECT">Multi Select</option>
                          <option value="APTITUDE">Aptitude</option>
                          <option value="TECHNICAL">Technical</option>
                          <option value="SQL">SQL Query</option>
                          <option value="CODING">Coding Problem</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase">Points</label>
                        <input
                          type="number"
                          step="0.5"
                          value={q.points}
                          onChange={(e) => updateQuestion(idx, 'points', Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase">Question Prompt</label>
                      <textarea
                        rows={2}
                        value={q.prompt}
                        onChange={(e) => updateQuestion(idx, 'prompt', e.target.value)}
                        placeholder="Enter problem prompt..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                      />
                    </div>

                    {/* MCQ Choices */}
                    {q.type === 'MCQ' && (
                      <div className="space-y-2 pt-1">
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase">Options</label>
                        <div className="grid grid-cols-2 gap-2">
                          {q.options?.map((opt: string, optIdx: number) => (
                            <input
                              key={optIdx}
                              type="text"
                              value={opt}
                              onChange={(e) => updateOption(idx, optIdx, e.target.value)}
                              placeholder={`Option ${optIdx + 1}`}
                              className="bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-semibold text-emerald-400 uppercase">Correct Answer Key</label>
                      <input
                        type="text"
                        value={q.correctAnswer}
                        onChange={(e) => updateQuestion(idx, 'correctAnswer', e.target.value)}
                        placeholder="Exact text or JSON array matching correct option"
                        className="w-full bg-slate-950 border border-emerald-800/60 rounded-lg p-2 text-xs text-emerald-300"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 rounded-xl text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white shadow-lg disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
