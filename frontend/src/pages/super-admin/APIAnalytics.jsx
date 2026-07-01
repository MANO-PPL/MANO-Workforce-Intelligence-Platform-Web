import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { 
    Activity, Clock, AlertTriangle, Users, Building, ShieldAlert,
    Search, RefreshCw, BarChart2, Smartphone, Monitor, Info, Layers, CheckCircle
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import LoadingScreen from '../../components/LoadingScreen';

const APIAnalytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState('24h');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'clients', 'features', 'performance', 'directory'

    useEffect(() => {
        fetchAnalytics();
    }, [timeframe]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/super-admin/monitor/api-analytics?timeframe=${timeframe}`);
            setData(res.data.data);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to fetch API analytics');
        } finally {
            setLoading(false);
        }
    };

    // Filter routes based on search query
    const filteredRoutes = data?.routes ? data.routes.filter(r => 
        (r.path && r.path.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.method && r.method.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.module && r.module.toLowerCase().includes(searchQuery.toLowerCase()))
    ) : [];

    const getMethodBadge = (method) => {
        const m = method?.toUpperCase();
        switch (m) {
            case 'GET': return <span className="px-2 py-0.5 text-xs font-bold rounded bg-emerald-55 dark:bg-emerald-950/30 dark:text-emerald-400">GET</span>;
            case 'POST': return <span className="px-2 py-0.5 text-xs font-bold rounded bg-blue-55 dark:bg-blue-950/30 dark:text-blue-400">POST</span>;
            case 'PUT': return <span className="px-2 py-0.5 text-xs font-bold rounded bg-amber-55 dark:bg-amber-950/30 dark:text-amber-400">PUT</span>;
            case 'DELETE': return <span className="px-2 py-0.5 text-xs font-bold rounded bg-rose-55 dark:bg-rose-950/30 dark:text-rose-400">DEL</span>;
            default: return <span className="px-2 py-0.5 text-xs font-bold rounded bg-slate-50 dark:bg-slate-900/30 dark:text-slate-400">{m}</span>;
        }
    };

    if (loading && !data) {
        return <LoadingScreen message="Aggregating log statistics..." isSuperAdmin={true} />;
    }

    const { overview, modules = [], statusCodes = [], platforms = [], clients = [], devices = [], os = [], timeline = [] } = data || {};

    const totalCalls = overview?.total_calls || 0;
    const avgLatency = overview?.avg_latency_ms || 0;
    const maxLatency = overview?.max_latency_ms || 0;
    const errorRate = overview?.error_rate || 0;
    const activeUsers = overview?.active_users || 0;
    const activeOrgs = overview?.active_orgs || 0;

    // Sort routes to find slowest (Stress endpoints)
    const slowestRoutes = [...(data?.routes || [])]
        .sort((a, b) => b.avg_duration_ms - a.avg_duration_ms)
        .slice(0, 10);

    // Sort routes to find most failing endpoints
    const failingRoutes = [...(data?.routes || [])]
        .filter(r => r.errors > 0)
        .sort((a, b) => b.errors - a.errors)
        .slice(0, 10);

    const maxTimelineCount = timeline.length > 0 ? Math.max(...timeline.map(t => t.count)) : 1;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <Activity size={16} /> },
        { id: 'clients', label: 'Client Tracing', icon: <Smartphone size={16} /> },
        { id: 'features', label: 'Feature Analytics', icon: <Layers size={16} /> },
        { id: 'performance', label: 'Latency & Stress', icon: <ShieldAlert size={16} /> },
        { id: 'directory', label: 'Endpoint Directory', icon: <Info size={16} /> }
    ];

    return (
        <DashboardLayout title="API Analytics & Stress Monitor" noPadding={true}>
            <div className="flex flex-col h-auto lg:h-[calc(100vh-64px)] p-3 space-y-3 overflow-y-auto lg:overflow-hidden dark:text-github-dark-text">
                {/* Header Filter Panel */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
                    <div>
                        <p className="text-xs text-slate-505 dark:text-github-dark-muted">
                            Aggregated metrics parsed directly from raw API request logs.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <select 
                            value={timeframe} 
                            onChange={(e) => setTimeframe(e.target.value)}
                            className="px-3 py-1.5 bg-white dark:bg-dark-card border border-slate-200 dark:border-github-dark-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        >
                            <option value="2h">Last 2 Hours</option>
                            <option value="24h">Last 24 Hours</option>
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                        </select>
                        <button 
                            onClick={fetchAnalytics}
                            className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 dark:text-indigo-400 rounded-lg transition-colors"
                            title="Refresh statistics"
                        >
                            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>

                {/* Tab Navigation Menu */}
                <div className="flex border-b border-slate-200 dark:border-github-dark-border shrink-0 gap-1 overflow-x-auto pb-0.5 no-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                                activeTab === tab.id 
                                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold' 
                                    : 'border-transparent text-slate-500 dark:text-github-dark-muted hover:text-slate-800 hover:border-slate-300 dark:hover:text-github-dark-text'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Dynamic Content Panel based on Active Tab */}
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-0.5">
                    
                    {/* Tab 1: Overview & Activity */}
                    {activeTab === 'overview' && (
                        <div className="space-y-4 h-full flex flex-col min-h-0">
                            {/* KPI Metrics row */}
                            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 shrink-0">
                                <div className="bg-white dark:bg-dark-card p-3 rounded-xl shadow-sm border border-slate-100 dark:border-github-dark-border flex items-center justify-between">
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-github-dark-muted">Total Calls</span>
                                        <h2 className="text-lg font-bold font-mono mt-0.5">
                                            {totalCalls >= 1000 ? `${(totalCalls / 1000).toFixed(1)}k` : totalCalls}
                                        </h2>
                                    </div>
                                    <Activity size={20} className="text-indigo-500 shrink-0" />
                                </div>
                                
                                <div className="bg-white dark:bg-dark-card p-3 rounded-xl shadow-sm border border-slate-100 dark:border-github-dark-border flex items-center justify-between">
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-github-dark-muted">Avg Latency</span>
                                        <h2 className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">{avgLatency}ms</h2>
                                    </div>
                                    <Clock size={20} className="text-emerald-500 shrink-0" />
                                </div>

                                <div className="bg-white dark:bg-dark-card p-3 rounded-xl shadow-sm border border-slate-100 dark:border-github-dark-border flex items-center justify-between">
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-github-dark-muted">Peak Latency</span>
                                        <h2 className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">{maxLatency}ms</h2>
                                    </div>
                                    <BarChart2 size={20} className="text-amber-500 shrink-0" />
                                </div>

                                <div className="bg-white dark:bg-dark-card p-3 rounded-xl shadow-sm border border-slate-100 dark:border-github-dark-border flex items-center justify-between">
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-github-dark-muted">Error Rate</span>
                                        <h2 className={`text-lg font-bold font-mono mt-0.5 ${errorRate > 5 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-github-dark-text'}`}>
                                            {errorRate}%
                                        </h2>
                                    </div>
                                    <AlertTriangle size={20} className="text-rose-500 shrink-0" />
                                </div>

                                <div className="bg-white dark:bg-dark-card p-3 rounded-xl shadow-sm border border-slate-100 dark:border-github-dark-border flex items-center justify-between">
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-github-dark-muted">Active Users</span>
                                        <h2 className="text-lg font-bold font-mono mt-0.5">{activeUsers}</h2>
                                    </div>
                                    <Users size={20} className="text-blue-500 shrink-0" />
                                </div>

                                <div className="bg-white dark:bg-dark-card p-3 rounded-xl shadow-sm border border-slate-100 dark:border-github-dark-border flex items-center justify-between">
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-github-dark-muted">Active Orgs</span>
                                        <h2 className="text-lg font-bold font-mono mt-0.5">{activeOrgs}</h2>
                                    </div>
                                    <Building size={20} className="text-purple-500 shrink-0" />
                                </div>
                            </div>

                            {/* Main overview grid: Timeline & HTTP Status Code dist */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
                                {/* Traffic timeline chart */}
                                <div className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-slate-200 dark:border-github-dark-border flex flex-col lg:col-span-2 min-h-[320px]">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-github-dark-muted mb-4 flex items-center gap-1.5 shrink-0">
                                        <Activity size={14} className="text-indigo-500" /> API Call Traffic Timeline
                                    </h3>
                                    {timeline.length === 0 ? (
                                        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                                            No traffic timeline data recorded for the selected timeframe.
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex items-end gap-1.5 pb-8 overflow-x-auto relative px-2 custom-scrollbar">
                                            {/* Dotted grid lines background */}
                                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 pt-4 px-2">
                                                <div className="w-full flex items-center text-[8px] text-slate-400/80 font-mono">
                                                    <span className="w-12 shrink-0">{maxTimelineCount} hits</span>
                                                    <div className="flex-1 border-t border-dashed border-slate-150 dark:border-slate-800" />
                                                </div>
                                                <div className="w-full flex items-center text-[8px] text-slate-400/80 font-mono">
                                                    <span className="w-12 shrink-0">{Math.round(maxTimelineCount * 0.75)} hits</span>
                                                    <div className="flex-1 border-t border-dashed border-slate-150 dark:border-slate-800" />
                                                </div>
                                                <div className="w-full flex items-center text-[8px] text-slate-400/80 font-mono">
                                                    <span className="w-12 shrink-0">{Math.round(maxTimelineCount / 2)} hits</span>
                                                    <div className="flex-1 border-t border-dashed border-slate-150 dark:border-slate-800" />
                                                </div>
                                                <div className="w-full flex items-center text-[8px] text-slate-400/80 font-mono">
                                                    <span className="w-12 shrink-0">{Math.round(maxTimelineCount * 0.25)} hits</span>
                                                    <div className="flex-1 border-t border-dashed border-slate-150 dark:border-slate-800" />
                                                </div>
                                                <div className="w-full flex items-center text-[8px] text-slate-400/80 font-mono">
                                                    <span className="w-12 shrink-0">0 hits</span>
                                                    <div className="flex-1 border-t border-dashed border-slate-150 dark:border-slate-800" />
                                                </div>
                                            </div>

                                            {/* Bar charts */}
                                            {timeline.slice(-30).map(t => {
                                                const percent = (t.count / maxTimelineCount) * 100;
                                                const timeLabel = new Date(t.time_bucket).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                                                const dateObj = new Date(t.time_bucket);
                                                const dateLabel = `${dateObj.getMonth() + 1}/${dateObj.getDate()} ${timeLabel}`;
                                                
                                                const latency = t.avg_duration_ms;
                                                const latencyColor = latency < 70 ? 'bg-emerald-500 dark:bg-emerald-600' : latency < 250 ? 'bg-amber-400 dark:bg-amber-500' : 'bg-rose-500 dark:bg-rose-600';

                                                return (
                                                    <div key={t.time_bucket} className="flex flex-col items-center flex-1 min-w-[30px] group relative h-full justify-end z-10">
                                                        {/* Tooltip on hover */}
                                                        <div className="absolute bottom-full mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 dark:bg-github-dark-subtle text-white text-[10px] rounded p-2 pointer-events-none z-20 font-mono shadow-md border border-slate-700">
                                                            <p className="font-semibold border-b border-slate-700 pb-0.5 mb-1 text-slate-300">{dateLabel}</p>
                                                            <p>Hits: <span className="text-indigo-300 font-bold">{t.count}</span></p>
                                                            <p>Latency: <span className="text-emerald-300 font-bold">{latency}ms</span></p>
                                                        </div>
                                                        
                                                        {/* Bar representing request volume */}
                                                        <div className="w-full flex items-end justify-center h-4/5">
                                                            <div 
                                                                className={`${latencyColor} w-4 sm:w-5 rounded-t transition-all hover:brightness-105 shadow-sm`} 
                                                                style={{ height: `${Math.max(percent, 4)}%` }} 
                                                            />
                                                        </div>
                                                        <span className="text-[9px] text-slate-400 dark:text-github-dark-muted mt-2 rotate-45 origin-left whitespace-nowrap absolute top-full left-1">
                                                            {timeLabel}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Status Code Distribution - vertical list with percentages */}
                                <div className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-slate-200 dark:border-github-dark-border flex flex-col">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-github-dark-muted mb-4 flex items-center gap-1.5 shrink-0">
                                        <CheckCircle size={14} className="text-indigo-500" /> HTTP Status Codes
                                    </h3>
                                    <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                                        {statusCodes.length === 0 ? (
                                            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                                                No status records found.
                                            </div>
                                        ) : (
                                            statusCodes.map(s => {
                                                const code = s.status_code;
                                                const count = s.count;
                                                const share = totalCalls > 0 ? ((count / totalCalls) * 100).toFixed(1) : 0;
                                                
                                                let badgeClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400';
                                                let barColor = 'bg-emerald-500';
                                                
                                                if (code >= 500) {
                                                    badgeClass = 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400';
                                                    barColor = 'bg-rose-500';
                                                } else if (code >= 400) {
                                                    badgeClass = 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400';
                                                    barColor = 'bg-amber-500';
                                                } else if (code >= 300) {
                                                    badgeClass = 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400';
                                                    barColor = 'bg-blue-500';
                                                }

                                                return (
                                                    <div key={code} className="p-3 bg-slate-50/50 dark:bg-github-dark-subtle/10 border border-slate-100 dark:border-github-dark-border rounded-xl">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className={`px-2 py-0.5 text-xs font-bold font-mono rounded ${badgeClass}`}>
                                                                HTTP {code}
                                                            </span>
                                                            <span className="text-xs font-mono font-bold text-slate-800 dark:text-github-dark-text">
                                                                {count.toLocaleString()} calls
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between text-[10px] text-slate-400 dark:text-github-dark-muted mb-1">
                                                            <span>Share of total traffic</span>
                                                            <span>{share}%</span>
                                                        </div>
                                                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${share}%` }} />
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Client Tracing */}
                    {activeTab === 'clients' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
                            {/* Devices and Client OS breakdown */}
                            <div className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-slate-200 dark:border-github-dark-border flex flex-col space-y-5">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-github-dark-muted flex items-center gap-1.5 shrink-0">
                                    <Smartphone size={14} className="text-indigo-500" /> Device Forms & Platform OS
                                </h3>
                                
                                <div>
                                    <span className="text-xs font-bold text-slate-700 dark:text-github-dark-muted block mb-3">Device Forms Distribution</span>
                                    {devices.length === 0 ? (
                                        <div className="text-slate-400 text-xs py-4 text-center">No device records found.</div>
                                    ) : (
                                        <div className="space-y-4">
                                            {/* Stacked bar representing breakdown */}
                                            <div className="flex h-5 w-full bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden shadow-inner">
                                                {devices.map((d, index) => {
                                                    const percent = totalCalls > 0 ? (d.count / totalCalls) * 100 : 0;
                                                    const colors = [
                                                        'bg-indigo-650 dark:bg-indigo-600',
                                                        'bg-emerald-500 dark:bg-emerald-600',
                                                        'bg-amber-405 dark:bg-amber-500',
                                                        'bg-slate-400 dark:bg-slate-600'
                                                    ];
                                                    const color = colors[index % colors.length];
                                                    return (
                                                        <div 
                                                            key={d.device_type} 
                                                            className={`${color} transition-all duration-300 hover:brightness-105`} 
                                                            style={{ width: `${percent}%` }} 
                                                            title={`${d.device_type}: ${d.count} calls (${Math.round(percent)}%)`} 
                                                        />
                                                    );
                                                })}
                                            </div>
                                            
                                            {/* Custom legends with call count */}
                                            <div className="grid grid-cols-3 gap-2">
                                                {devices.map((d, index) => {
                                                    const percent = totalCalls > 0 ? (d.count / totalCalls) * 100 : 0;
                                                    const dotColors = [
                                                        'bg-indigo-650 dark:bg-indigo-600',
                                                        'bg-emerald-500 dark:bg-emerald-600',
                                                        'bg-amber-405 dark:bg-amber-500',
                                                        'bg-slate-400 dark:bg-slate-600'
                                                    ];
                                                    const dotColor = dotColors[index % dotColors.length];
                                                    return (
                                                        <div key={d.device_type} className="p-2.5 rounded-lg border border-slate-100 dark:border-github-dark-border bg-slate-50/50 dark:bg-github-dark-subtle/10 text-center">
                                                            <div className="flex items-center justify-center gap-1.5 mb-1">
                                                                <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                                                                <span className="text-[10px] font-bold text-slate-500 dark:text-github-dark-muted truncate uppercase tracking-wider">{d.device_type}</span>
                                                            </div>
                                                            <span className="text-sm font-bold font-mono text-slate-800 dark:text-github-dark-text block">{Math.round(percent)}%</span>
                                                            <span className="text-[9px] text-slate-400 font-mono">({d.count.toLocaleString()} calls)</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
                                    <span className="text-xs font-bold text-slate-700 dark:text-github-dark-muted block">OS Platforms Traffic Share</span>
                                    {os.length === 0 ? (
                                        <div className="text-slate-400 text-xs py-4 text-center">No OS records found.</div>
                                    ) : (
                                        os.map(o => {
                                            const percent = totalCalls > 0 ? (o.count / totalCalls) * 100 : 0;
                                            return (
                                                <div key={o.os} className="text-xs p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-github-dark-subtle/20 transition-colors">
                                                    <div className="flex justify-between font-semibold text-slate-700 dark:text-github-dark-text mb-1">
                                                        <span>{o.os || 'Unknown OS'}</span>
                                                        <span className="font-mono">{o.count.toLocaleString()} calls ({percent.toFixed(1)}%)</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                        <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Client distribution */}
                            <div className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-slate-200 dark:border-github-dark-border flex flex-col">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-github-dark-muted mb-4 flex items-center gap-1.5 shrink-0">
                                    <Monitor size={14} className="text-indigo-500" /> App Clients & Browsers
                                </h3>
                                <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-1">
                                    {clients.length === 0 ? (
                                        <div className="text-slate-400 text-xs py-8 text-center">No client records found.</div>
                                    ) : (
                                        clients.map(c => {
                                            const percent = totalCalls > 0 ? (c.count / totalCalls) * 100 : 0;
                                            
                                            // Determine client badges/icons
                                            let icon = <Monitor size={14} className="text-slate-405" />;
                                            if (c.client_type?.includes('App')) {
                                                icon = <Smartphone size={14} className="text-indigo-500" />;
                                            } else if (c.client_type?.includes('Browser')) {
                                                icon = <Monitor size={14} className="text-emerald-500" />;
                                            }
                                            
                                            return (
                                                <div key={c.client_type} className="p-3 bg-slate-50/50 dark:bg-github-dark-subtle/10 border border-slate-100 dark:border-github-dark-border rounded-xl">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-github-dark-text">
                                                            {icon}
                                                            <span>{c.client_type || 'Unknown'}</span>
                                                        </div>
                                                        <span className="text-xs font-mono font-bold text-slate-800 dark:text-github-dark-text">
                                                            {c.count.toLocaleString()} calls
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-[10px] text-slate-400 dark:text-github-dark-muted mb-1.5">
                                                        <span>Traffic share</span>
                                                        <span>{percent.toFixed(1)}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Feature Analytics */}
                    {activeTab === 'features' && (
                        <div className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-slate-200 dark:border-github-dark-border flex flex-col h-full">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-github-dark-muted mb-4 flex items-center gap-1.5 shrink-0">
                                <Layers size={14} className="text-indigo-500" /> Feature Usage Breakdown by Module
                            </h3>
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                                {modules.length === 0 ? (
                                    <div className="text-slate-400 text-xs py-8 text-center">No module metrics recorded.</div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {modules.map(m => {
                                            const percent = totalCalls > 0 ? (m.count / totalCalls) * 100 : 0;
                                            
                                            // Dynamic module badges or icons
                                            let latencyColor = 'text-emerald-500';
                                            if (m.avg_duration_ms >= 250) {
                                                latencyColor = 'text-rose-500';
                                            } else if (m.avg_duration_ms >= 70) {
                                                latencyColor = 'text-amber-500';
                                            }

                                            return (
                                                <div key={m.module} className="p-4 border border-slate-150 dark:border-github-dark-border rounded-xl bg-slate-50/40 dark:bg-github-dark-subtle/20 flex flex-col justify-between space-y-3">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-github-dark-text">{m.module || 'System Core'}</h4>
                                                            <span className="text-[10px] text-slate-400 font-mono">Business Module</span>
                                                        </div>
                                                        <span className="px-2 py-0.5 text-[10px] font-bold font-mono rounded bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400">
                                                            {m.count.toLocaleString()} calls
                                                        </span>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-[10px] text-slate-550 dark:text-github-dark-muted font-mono">
                                                            <span>Average response:</span>
                                                            <span className={`font-bold ${latencyColor}`}>{m.avg_duration_ms}ms</span>
                                                        </div>
                                                        <div className="flex justify-between text-[10px] text-slate-550 dark:text-github-dark-muted font-mono">
                                                            <span>Module load:</span>
                                                            <span>{percent.toFixed(1)}%</span>
                                                        </div>
                                                    </div>

                                                    <div className="w-full bg-slate-150 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                                        <div className="bg-indigo-650 h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tab 4: Performance & Stress */}
                    {activeTab === 'performance' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-0">
                            {/* API Stress spots (Slowest endpoints) */}
                            <div className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-slate-200 dark:border-github-dark-border flex flex-col min-h-[300px]">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-github-dark-muted mb-3 flex items-center gap-1.5 shrink-0">
                                    <ShieldAlert size={14} className="text-amber-500" /> API Stress spots (Slowest Endpoints)
                                </h3>
                                <div className="flex-1 overflow-auto custom-scrollbar">
                                    <table className="w-full text-left text-xs whitespace-nowrap">
                                        <thead className="bg-slate-50 dark:bg-github-dark-subtle/85 text-slate-500 dark:text-github-dark-muted sticky top-0 z-10 border-b border-slate-200 dark:border-github-dark-border">
                                            <tr>
                                                <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[10px]">Method / Path</th>
                                                <th className="px-3 py-2.5 text-right font-bold uppercase tracking-wider text-[10px]">Avg Response</th>
                                                <th className="px-3 py-2.5 text-right font-bold uppercase tracking-wider text-[10px]">Max Response</th>
                                                <th className="px-3 py-2.5 text-right font-bold uppercase tracking-wider text-[10px]">Volume</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {slowestRoutes.length === 0 ? (
                                                <tr>
                                                    <td colSpan="4" className="text-center py-8 text-slate-400">No stress endpoints detected.</td>
                                                </tr>
                                            ) : (
                                                slowestRoutes.map((r, index) => (
                                                    <tr key={index} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                                                        <td className="px-3 py-2 flex items-center gap-2 font-mono">
                                                            {getMethodBadge(r.method)}
                                                            <span className="truncate max-w-[200px] text-slate-700 dark:text-github-dark-text font-semibold" title={r.path}>{r.path}</span>
                                                        </td>
                                                        <td className="px-3 py-2 text-right font-bold text-rose-500 dark:text-rose-455 font-mono">{r.avg_duration_ms}ms</td>
                                                        <td className="px-3 py-2 text-right text-slate-500 dark:text-github-dark-muted font-mono">{r.max_duration_ms}ms</td>
                                                        <td className="px-3 py-2 text-right font-mono text-slate-600 dark:text-github-dark-muted">{r.count}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* API Error Hotspots */}
                            <div className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-slate-200 dark:border-github-dark-border flex flex-col min-h-[300px]">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-github-dark-muted mb-3 flex items-center gap-1.5 shrink-0">
                                    <AlertTriangle size={14} className="text-rose-500" /> Error Hotspots (HTTP failures)
                                </h3>
                                <div className="flex-1 overflow-auto custom-scrollbar">
                                    <table className="w-full text-left text-xs whitespace-nowrap">
                                        <thead className="bg-slate-50 dark:bg-github-dark-subtle/85 text-slate-500 dark:text-github-dark-muted sticky top-0 z-10 border-b border-slate-200 dark:border-github-dark-border">
                                            <tr>
                                                <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[10px]">Method / Path</th>
                                                <th className="px-3 py-2.5 text-right font-bold uppercase tracking-wider text-[10px]">Errors</th>
                                                <th className="px-3 py-2.5 text-right font-bold uppercase tracking-wider text-[10px]">Error Rate</th>
                                                <th className="px-3 py-2.5 text-right font-bold uppercase tracking-wider text-[10px]">Total Hits</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {failingRoutes.length === 0 ? (
                                                <tr>
                                                    <td colSpan="4" className="text-center py-8 text-slate-400">No failing routes detected in timeframe.</td>
                                                </tr>
                                            ) : (
                                                failingRoutes.map((r, index) => {
                                                    const rate = r.count > 0 ? ((r.errors / r.count) * 100).toFixed(1) : 0;
                                                    return (
                                                        <tr key={index} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                                                            <td className="px-3 py-2 flex items-center gap-2 font-mono">
                                                                {getMethodBadge(r.method)}
                                                                <span className="truncate max-w-[200px] text-slate-700 dark:text-github-dark-text font-semibold" title={r.path}>{r.path}</span>
                                                            </td>
                                                            <td className="px-3 py-2 text-right font-bold text-rose-600 dark:text-rose-400 font-mono">{r.errors}</td>
                                                            <td className="px-3 py-2 text-right text-rose-500 font-mono font-bold">{rate}%</td>
                                                            <td className="px-3 py-2 text-right font-mono text-slate-600 dark:text-github-dark-muted">{r.count}</td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 5: Route Directory */}
                    {activeTab === 'directory' && (
                        <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-slate-200 dark:border-github-dark-border flex flex-col h-full min-h-0 overflow-hidden">
                            <div className="p-3 border-b border-slate-100 dark:border-github-dark-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shrink-0 bg-slate-50/50 dark:bg-github-dark-subtle/50">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-github-dark-muted flex items-center gap-1.5">
                                    <Info size={14} className="text-indigo-500" /> Route Call logs & Performance Profile
                                </h3>
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                    <input 
                                        type="text" 
                                        placeholder="Search route, method or module..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-dark-card border border-slate-200 dark:border-github-dark-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-auto custom-scrollbar">
                                <table className="w-full text-left text-xs whitespace-nowrap">
                                    <thead className="bg-slate-50 dark:bg-github-dark-subtle/80 text-slate-650 dark:text-github-dark-muted border-b border-slate-200 dark:border-github-dark-border sticky top-0 z-10 font-mono">
                                        <tr>
                                            <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Method & Route Pattern</th>
                                            <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Module</th>
                                            <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px] text-right">Hits Count</th>
                                            <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px] text-right">Avg Duration</th>
                                            <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px] text-right">Max Duration</th>
                                            <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px] text-right">Failed Calls</th>
                                            <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px] text-right">Error Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                                        {filteredRoutes.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="text-center py-8 text-slate-400">No matching route pattern records found.</td>
                                            </tr>
                                        ) : (
                                            filteredRoutes.map((r, index) => {
                                                const errRate = r.count > 0 ? ((r.errors / r.count) * 100).toFixed(1) : 0;
                                                return (
                                                    <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                                        <td className="px-4 py-2.5 flex items-center gap-2">
                                                            {getMethodBadge(r.method)}
                                                            <span className="text-slate-850 dark:text-github-dark-text font-semibold">{r.path}</span>
                                                        </td>
                                                        <td className="px-4 py-2.5 text-slate-500 dark:text-github-dark-muted">
                                                            {r.module}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-right text-slate-700 dark:text-slate-300">{r.count}</td>
                                                        <td className="px-4 py-2.5 text-right font-bold text-slate-800 dark:text-github-dark-text">{r.avg_duration_ms}ms</td>
                                                        <td className="px-4 py-2.5 text-right text-slate-500 dark:text-github-dark-muted">{r.max_duration_ms}ms</td>
                                                        <td className={`px-4 py-2.5 text-right ${r.errors > 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>{r.errors}</td>
                                                        <td className={`px-4 py-2.5 text-right font-bold ${r.errors > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{errRate}%</td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </DashboardLayout>
    );
};

export default APIAnalytics;
