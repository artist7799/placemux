import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { Calendar, Award, Clock, Video, CheckCircle2, XCircle, Bell, ExternalLink, AlertCircle } from 'lucide-react';

export const StudentInterviewsOffers: React.FC = () => {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [intRes, offRes, notifRes] = await Promise.all([
        API.get('/interviews/my-interviews'),
        API.get('/offers/my-offers'),
        API.get('/offers/notifications'),
      ]);
      setInterviews(intRes.data.data);
      setOffers(offRes.data.data);
      setNotifications(notifRes.data.data);
    } catch (err) {
      console.error('Failed to load interview/offer data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRespondOffer = async (offerId: string, status: 'ACCEPTED' | 'REJECTED') => {
    if (
      !window.confirm(
        `Are you sure you want to ${status.toLowerCase()} this placement offer? This choice will update your official placement status.`
      )
    ) {
      return;
    }

    setResponding(true);
    setMessage(null);
    try {
      await API.patch(`/offers/${offerId}/respond`, { status });
      setMessage({ type: 'success', text: `Placement offer ${status.toLowerCase()} successfully!` });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to process offer response.' });
    } finally {
      setResponding(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="glass-panel p-6">
        <h1 className="text-2xl font-bold text-white">Interviews, Placement Offers & Alerts</h1>
        <p className="text-sm text-slate-400">
          View scheduled interview rounds, join video meetings, and respond to official placement job offers.
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
        <div className="p-8 text-center text-slate-400">Loading scheduled interviews and placement offers...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Column 1 & 2: Scheduled Interviews & Placement Offers */}
          <div className="lg:col-span-2 space-y-8">
            {/* Scheduled Interviews */}
            <div className="glass-panel p-6 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-indigo-400" />
                <span>Scheduled Interviews ({interviews.length})</span>
              </h2>

              {interviews.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 border border-slate-800 rounded-xl">
                  No upcoming interview rounds scheduled.
                </div>
              ) : (
                <div className="space-y-3">
                  {interviews.map((interview) => (
                    <div key={interview.id} className="glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-white">
                          {interview.application?.job?.title}
                        </div>
                        <div className="text-xs text-slate-400">
                          {interview.application?.job?.company?.name} • Mode: {interview.mode}
                        </div>
                        <div className="text-xs text-indigo-400 font-semibold flex items-center space-x-1 pt-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{new Date(interview.scheduledAt).toLocaleString()} ({interview.durationMinutes} mins)</span>
                        </div>
                      </div>

                      {interview.meetingLink && (
                        <a
                          href={interview.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center space-x-1.5 shadow-md self-start sm:self-center"
                        >
                          <Video className="h-4 w-4" />
                          <span>Join Meeting</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Official Placement Offers */}
            <div className="glass-panel p-6 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Award className="h-5 w-5 text-amber-400" />
                <span>Official Placement Offers ({offers.length})</span>
              </h2>

              {offers.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 border border-slate-800 rounded-xl">
                  No job offers received yet. Keep applying!
                </div>
              ) : (
                <div className="space-y-4">
                  {offers.map((offer) => (
                    <div key={offer.id} className="p-5 rounded-2xl bg-amber-950/20 border border-amber-800/40 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-xs font-semibold text-amber-400 uppercase">
                            {offer.application?.job?.company?.name}
                          </div>
                          <h3 className="text-lg font-bold text-white mt-0.5">{offer.positionTitle}</h3>
                          <div className="text-xs text-slate-300 mt-1">
                            Salary Package: <span className="font-bold text-emerald-400">{offer.salary}</span>
                          </div>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            offer.status === 'ACCEPTED'
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                              : offer.status === 'REJECTED'
                              ? 'bg-rose-950 text-rose-400 border-rose-800'
                              : 'bg-amber-950 text-amber-300 border-amber-800'
                          }`}
                        >
                          {offer.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 flex items-center space-x-4">
                        <span>Joining Date: {new Date(offer.joiningDate).toLocaleDateString()}</span>
                        {offer.validUntil && <span>Valid Until: {new Date(offer.validUntil).toLocaleDateString()}</span>}
                      </div>

                      {offer.status === 'PENDING' && (
                        <div className="pt-3 border-t border-amber-900/40 flex items-center justify-end space-x-3">
                          <button
                            disabled={responding}
                            onClick={() => handleRespondOffer(offer.id, 'REJECTED')}
                            className="px-4 py-2 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800 text-rose-300 text-xs font-semibold flex items-center space-x-1"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Decline Offer</span>
                          </button>
                          <button
                            disabled={responding}
                            onClick={() => handleRespondOffer(offer.id, 'ACCEPTED')}
                            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg flex items-center space-x-1"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Accept Offer</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Notifications Activity Feed */}
          <div className="glass-panel p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Bell className="h-5 w-5 text-indigo-400" />
              <span>Activity Notifications</span>
            </h2>

            {notifications.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 border border-slate-800 rounded-xl">
                No notifications received yet.
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div key={notif.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="text-xs font-bold text-indigo-300">{notif.title}</div>
                    <div className="text-xs text-slate-300">{notif.message}</div>
                    <div className="text-[10px] text-slate-500 pt-1">
                      {new Date(notif.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
