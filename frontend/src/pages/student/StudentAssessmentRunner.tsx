import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { Clock, CheckCircle2, AlertTriangle, ChevronLeft, ChevronRight, Award, Sparkles, Send } from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';

export const StudentAssessmentRunner: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState('');

  const startSession = async () => {
    if (!assessmentId) return;
    setLoading(true);
    setError('');
    try {
      const res = await API.post(`/assessments/${assessmentId}/start`);
      const s = res.data.data;
      setSession(s);

      // Compute time left
      const startedAt = new Date(s.startedAt).getTime();
      const durationMs = s.durationMinutes * 60 * 1000;
      const nowMs = Date.now();
      const remainingMs = Math.max(0, startedAt + durationMs - nowMs);
      setTimeLeftSeconds(Math.floor(remainingMs / 1000));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start assessment session.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    startSession();
  }, [assessmentId]);

  // Countdown timer effect
  useEffect(() => {
    if (timeLeftSeconds <= 0 || result) return;
    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitAnswers();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeftSeconds, result]);

  const handleSelectAnswer = (questionId: string, answer: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleMultiSelectToggle = (questionId: string, option: string) => {
    setAnswers((prev) => {
      const currentList: string[] = prev[questionId] || [];
      const updated = currentList.includes(option)
        ? currentList.filter((item) => item !== option)
        : [...currentList, option];
      return {
        ...prev,
        [questionId]: updated,
      };
    });
  };

  const handleSubmitAnswers = async () => {
    if (!session || submitting) return;
    setSubmitting(true);
    try {
      const responsesPayload = session.questions.map((q: any) => ({
        questionId: q.questionId,
        answerGiven: answers[q.questionId] !== undefined ? answers[q.questionId] : '',
      }));

      const res = await API.post(`/assessments/sessions/${session.sessionId}/submit`, {
        responses: responsesPayload,
      });

      setResult(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit test responses.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Initializing secure assessment environment...</div>;
  }

  if (error) {
    return (
      <div className="p-8 max-w-md mx-auto text-center glass-panel space-y-4 my-12">
        <AlertTriangle className="h-10 w-10 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Assessment Error</h2>
        <p className="text-sm text-slate-400">{error}</p>
        <Link to="/student/dashboard" className="px-4 py-2 bg-indigo-600 rounded-xl text-xs font-semibold text-white inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Display Scorecard Result View
  if (result) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-8 my-8">
        <div className="glass-panel p-8 text-center space-y-6">
          <div
            className={`inline-flex p-4 rounded-3xl border ${
              result.isPassed
                ? 'bg-emerald-950/50 border-emerald-800 text-emerald-400'
                : 'bg-rose-950/50 border-rose-800 text-rose-400'
            }`}
          >
            {result.isPassed ? <Award className="h-12 w-12" /> : <AlertTriangle className="h-12 w-12" />}
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white">
              {result.isPassed ? 'Assessment Passed!' : 'Assessment Completed'}
            </h2>
            <p className="text-xs text-slate-400">
              Your test response has been scored and recorded in PostgreSQL.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div>
              <div className="text-xs text-slate-500 uppercase font-semibold">Score Achieved</div>
              <div className="text-2xl font-bold text-indigo-400 mt-1">{result.percentageScore}%</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase font-semibold">Passing Threshold</div>
              <div className="text-2xl font-bold text-slate-300 mt-1">{result.passingScore}%</div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-center space-x-4">
            <Link
              to="/student/dashboard"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = session.questions[currentIndex];

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 flex flex-col justify-between">
      {/* Top Bar with Timer */}
      <header className="glass-panel p-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">{session.title}</h2>
          <span className="text-xs text-slate-400">
            Question {currentIndex + 1} of {session.questions.length}
          </span>
        </div>

        <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400">
          <Clock className="h-4 w-4 animate-pulse text-indigo-400" />
          <span className="font-mono text-sm font-bold">{formatTimer(timeLeftSeconds)}</span>
        </div>
      </header>

      {/* Main Question Panel */}
      <main className="my-6 max-w-4xl mx-auto w-full glass-panel p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-950 text-indigo-300 border border-indigo-900">
            Type: {currentQ.type}
          </span>
          <span className="text-xs font-semibold text-slate-400">{currentQ.points} Points</span>
        </div>

        <div className="text-base md:text-lg font-semibold text-white leading-relaxed whitespace-pre-line">
          {currentQ.prompt}
        </div>

        {/* Options Rendering */}
        <div className="space-y-3 pt-4">
          {(currentQ.type === 'MCQ' || currentQ.type === 'APTITUDE' || currentQ.type === 'TECHNICAL') &&
            currentQ.options?.map((opt: string, idx: number) => {
              const isSelected = answers[currentQ.questionId] === opt;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectAnswer(currentQ.questionId, opt)}
                  className={`w-full text-left p-4 rounded-xl text-xs font-medium transition-all flex items-center justify-between border ${
                    isSelected
                      ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500 shadow-md shadow-indigo-950/50'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span>{opt}</span>
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-indigo-400" />}
                </button>
              );
            })}

          {currentQ.type === 'MULTI_SELECT' &&
            currentQ.options?.map((opt: string, idx: number) => {
              const selectedList: string[] = answers[currentQ.questionId] || [];
              const isSelected = selectedList.includes(opt);
              return (
                <button
                  key={idx}
                  onClick={() => handleMultiSelectToggle(currentQ.questionId, opt)}
                  className={`w-full text-left p-4 rounded-xl text-xs font-medium transition-all flex items-center justify-between border ${
                    isSelected
                      ? 'bg-purple-600/20 text-purple-300 border-purple-500 shadow-md'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span>{opt}</span>
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-purple-400" />}
                </button>
              );
            })}

          {(currentQ.type === 'SQL' || currentQ.type === 'CODING') && (
            <textarea
              rows={6}
              value={answers[currentQ.questionId] || ''}
              onChange={(e) => handleSelectAnswer(currentQ.questionId, e.target.value)}
              placeholder="Write your query or code answer here..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          )}
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="glass-panel p-4 max-w-4xl mx-auto w-full flex items-center justify-between">
        <button
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((prev) => prev - 1)}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-40 flex items-center space-x-1"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous</span>
        </button>

        <div className="flex items-center space-x-2">
          {currentIndex < session.questions.length - 1 ? (
            <button
              onClick={() => setCurrentIndex((prev) => prev + 1)}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center space-x-1 shadow-lg"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              disabled={submitting}
              onClick={handleSubmitAnswers}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-semibold text-white shadow-lg flex items-center space-x-1"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{submitting ? 'Submitting...' : 'Submit Test'}</span>
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};
