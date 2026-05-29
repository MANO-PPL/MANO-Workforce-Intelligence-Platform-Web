import React, { useState, useEffect } from 'react';
import MobileDashboardLayout from '../../components/MobileDashboardLayout';
import { Users, Building, MessageSquare, Briefcase, FileText, ShieldAlert, Clock, ChevronRight, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const SuperAdminDashboardMobile = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalOrgs: 0,
    totalUsers: 0,
    pendingFeedback: 0,
    openAlerts: 0,
  });
  const [recentFeedback, setRecentFeedback] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const [alertsLoading, setAlertsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecentFeedback();
    fetchRecentAlerts();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/super-admin/dashboard-stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch super admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentFeedback = async () => {
    try {
      setFeedbackLoading(true);
      const res = await api.get('/super-admin/monitor/feedback');
      const all = Array.isArray(res.data.data) ? res.data.data : [];
      const pending = all.filter(f => !f.status || ['pending', 'open', ''].includes(f.status.toLowerCase())).slice(0, 5);
      setRecentFeedback(pending);
    } catch (err) {
      console.error('Failed to fetch feedback:', err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const fetchRecentAlerts = async () => {
    try {
      setAlertsLoading(true);
      const res = await api.get('/super-admin/monitor/alerts');
      const all = Array.isArray(res.data.data) ? res.data.data : [];
      const open = all.filter(a => a.status && ['open', 'unseen'].includes(a.status.toLowerCase())).slice(0, 5);
      setRecentAlerts(open);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setAlertsLoading(false);
    }
  };

  return (
    <MobileDashboardLayout title="Dashboard">
      <div className="space-y-5 pb-20">

        {/* Welcome Section */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-github-dark-border bg-gradient-to-r from-amber-500/10 via-indigo-500/5 to-transparent dark:from-amber-500/5 dark:via-indigo-500/5 dark:to-transparent p-5 shadow-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-20 h-20 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 space-y-1">
            <h2 className="text-lg font-bold text-slate-800 dark:text-github-dark-text tracking-tight">
              Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-indigo-600 dark:from-amber-400 dark:to-indigo-400 font-extrabold uppercase">Super Admin</span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-github-dark-muted leading-relaxed">
              System metrics, organizations, audit logs, and global platform settings are available below.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title="Total Orgs"
            value={stats.totalOrgs}
            label="Registered"
            icon={<Building className="text-blue-500" size={16} />}
            loading={loading}
          />
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            label="Active"
            icon={<Users className="text-emerald-500" size={16} />}
            loading={loading}
          />
          <StatCard
            title="Feedback"
            value={stats.pendingFeedback}
            label="Awaiting Review"
            icon={<MessageSquare className="text-violet-500" size={16} />}
            loading={loading}
            onClick={() => navigate('/super-admin/feedback')}
            highlight={stats.pendingFeedback > 0}
          />
          <StatCard
            title="Security"
            value={stats.openAlerts}
            label="Unseen Alerts"
            icon={<ShieldAlert className="text-red-500" size={16} />}
            loading={loading}
            onClick={() => navigate('/super-admin/alerts')}
            highlight={stats.openAlerts > 0}
            danger
          />
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <h3 className="text-[10px] font-black text-slate-400 dark:text-github-dark-muted uppercase tracking-[0.2em] px-1">Quick Actions</h3>
          <div className="grid grid-cols-3 gap-2.5">
            <QuickLinkCard onClick={() => navigate('/organizations')} icon={<Building size={16} />} title="New Org" />
            <QuickLinkCard onClick={() => navigate('/super-admin/logs')} icon={<FileText size={16} />} title="Logs" />
            <QuickLinkCard onClick={() => navigate('/super-admin/alerts')} icon={<ShieldAlert size={16} />} title="Security" />
          </div>
        </div>

        {/* Live Preview: Pending Feedback & Open Alerts */}
        <div className="space-y-4">

          {/* Pending Feedback Panel */}
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-slate-200 dark:border-github-dark-border flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-github-dark-border">
              <div className="flex items-center gap-1.5 min-w-0">
                <MessageSquare size={15} className="text-violet-500 shrink-0" />
                <h2 className="text-xs font-bold text-slate-800 dark:text-github-dark-text truncate">Pending Feedback & Bugs</h2>
                {stats.pendingFeedback > 0 && (
                  <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-bold bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 rounded-full">
                    {stats.pendingFeedback}
                  </span>
                )}
              </div>
              <button
                onClick={() => navigate('/super-admin/feedback')}
                className="flex items-center gap-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider shrink-0"
              >
                View <ChevronRight size={12} />
              </button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {feedbackLoading ? (
                <SkeletonRows count={2} />
              ) : recentFeedback.length === 0 ? (
                <EmptyState icon={<MessageSquare size={20} className="text-slate-300 dark:text-slate-600" />} text="No pending feedback" />
              ) : (
                recentFeedback.map(item => (
                  <div key={item.feedback_id} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <TypeBadge type={item.type} />
                        <p className="text-xs font-semibold text-slate-800 dark:text-github-dark-text truncate">{item.title}</p>
                      </div>
                      <span className="shrink-0 text-[10px] text-slate-400 dark:text-github-dark-muted whitespace-nowrap">
                        {timeAgo(item.created_at)}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-github-dark-muted mt-1 truncate">
                      {item.user_name || 'Anonymous'}{item.org_name ? ` · ${item.org_name}` : ''}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Unseen Security Alerts Panel */}
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-slate-200 dark:border-github-dark-border flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-github-dark-border">
              <div className="flex items-center gap-1.5 min-w-0">
                <ShieldAlert size={15} className="text-red-500 shrink-0" />
                <h2 className="text-xs font-bold text-slate-800 dark:text-github-dark-text truncate">Security Alerts</h2>
                {stats.openAlerts > 0 && (
                  <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                    {stats.openAlerts}
                  </span>
                )}
              </div>
              <button
                onClick={() => navigate('/super-admin/alerts')}
                className="flex items-center gap-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider shrink-0"
              >
                View <ChevronRight size={12} />
              </button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {alertsLoading ? (
                <SkeletonRows count={2} />
              ) : recentAlerts.length === 0 ? (
                <EmptyState icon={<ShieldAlert size={20} className="text-slate-300 dark:text-slate-600" />} text="No open alerts" />
              ) : (
                recentAlerts.map(alert => (
                  <div key={alert.id} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <SeverityBadge severity={alert.severity} />
                        <p className="text-xs font-semibold text-slate-800 dark:text-github-dark-text truncate">{alert.alert_type}</p>
                      </div>
                      <span className="shrink-0 flex items-center gap-0.5 text-[10px] text-amber-500 dark:text-amber-400 font-bold uppercase">
                        Open
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-github-dark-muted mt-1 truncate">
                      {alert.user_name || 'System/Anonymous'}{alert.org_name ? ` · ${alert.org_name}` : ''}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </MobileDashboardLayout>
  );
};

// Helpers
const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

// Sub-components
const StatCard = ({ title, value, label, icon, loading, onClick, highlight, danger }) => (
  <div
    onClick={onClick}
    className={`bg-white dark:bg-dark-card p-4 rounded-2xl shadow-sm border transition-all duration-200 active:scale-[0.98]
      ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
      ${danger && highlight
        ? 'border-red-200 dark:border-red-800/50 hover:border-red-300'
        : highlight
          ? 'border-violet-200 dark:border-violet-800/50 hover:border-violet-300'
          : 'border-slate-200 dark:border-github-dark-border hover:shadow-md'
      }`}
  >
    {loading ? (
      <div className="animate-pulse space-y-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1.5 w-full">
            <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
          </div>
          <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        </div>
        <div className="h-3 bg-slate-100 dark:bg-github-dark-subtle rounded w-2/3"></div>
      </div>
    ) : (
      <>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-github-dark-muted uppercase tracking-wider">{title}</p>
            <h4 className="text-xl font-bold text-slate-800 dark:text-github-dark-text mt-0.5 tracking-tight">
              {value}
            </h4>
          </div>
          <div className="p-1.5 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-100 dark:border-github-dark-border">
            {icon}
          </div>
        </div>
        <div className="text-[9px] font-bold text-slate-400 dark:text-github-dark-muted bg-slate-100 dark:bg-slate-750 px-1.5 py-0.5 rounded w-fit uppercase tracking-widest">
          {label}
        </div>
      </>
    )}
  </div>
);

const QuickLinkCard = ({ icon, title, onClick }) => (
  <div
    onClick={onClick}
    className="bg-white dark:bg-dark-card p-3 rounded-2xl shadow-sm border border-slate-200 dark:border-github-dark-border hover:shadow-md active:scale-95 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 group text-center"
  >
    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 group-hover:text-white transition-colors">
      {icon}
    </div>
    <span className="text-[10px] font-bold text-slate-600 dark:text-github-dark-text uppercase tracking-wider">{title}</span>
  </div>
);

const TypeBadge = ({ type }) => {
  const map = {
    bug: 'bg-red-100 text-red-750 dark:bg-red-900/40 dark:text-red-400',
    feature: 'bg-indigo-100 text-indigo-750 dark:bg-indigo-900/40 dark:text-indigo-400',
    general: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  };
  const cls = map[type?.toLowerCase()] || map.general;
  return <span className={`shrink-0 px-1.5 py-0.5 text-[8px] font-bold rounded uppercase tracking-wider ${cls}`}>{type || 'N/A'}</span>;
};

const SeverityBadge = ({ severity }) => {
  const map = {
    high: 'bg-red-100 text-red-750 dark:bg-red-900/40 dark:text-red-400',
    medium: 'bg-amber-100 text-amber-755 dark:bg-amber-900/40 dark:text-amber-400',
    low: 'bg-blue-100 text-blue-750 dark:bg-blue-900/40 dark:text-blue-400',
  };
  const cls = map[severity?.toLowerCase()] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
  return <span className={`shrink-0 px-1.5 py-0.5 text-[8px] font-bold rounded uppercase tracking-wider ${cls}`}>{severity || '—'}</span>;
};

const SkeletonRows = ({ count = 3 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="px-4 py-3 animate-pulse space-y-1.5">
        <div className="flex gap-2">
          <div className="h-3 w-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="h-3 w-28 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
        <div className="h-2.5 w-20 bg-slate-100 dark:bg-slate-800 rounded"></div>
      </div>
    ))}
  </>
);

const EmptyState = ({ icon, text }) => (
  <div className="flex flex-col items-center justify-center py-6 text-slate-400 dark:text-github-dark-muted gap-1 text-center">
    {icon}
    <p className="text-[11px] font-medium">{text}</p>
  </div>
);

export default SuperAdminDashboardMobile;
