import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MobileDashboardLayout from '../../components/MobileDashboardLayout';
import { 
    Download, 
    Calendar, 
    ChevronDown, 
    History as HistoryIcon, 
    Eye, 
    FileText, 
    Clock, 
    Table, 
    Activity,
    CheckCircle2,
    ArrowRight,
    Search,
    X,
    AlertCircle,
    DownloadCloud,
    FileSpreadsheet,
    FileType
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { toast } from 'react-toastify';
import MonthPicker from '../../components/MonthPicker';
import MobileDatePicker from '../../components/MobileDatePicker';

const getAlignmentClass = (colHeader) => {
    if (!colHeader) return 'center';
    const header = colHeader.toLowerCase();
    if (['name', 'department', 'dept', 'employee', 'reason', 'location', 'in location', 'out location', 'email', 'phone', 'role', 'designation', 'position'].some(k => header.includes(k))) {
        return 'left';
    }
    return 'center';
};

const getCellStyle = (cellValue, colHeader, isTotalsRow, isEven) => {
    const val = cellValue?.toString().trim() || '';
    const header = colHeader.toLowerCase();

    // 1. Totals row styling
    if (isTotalsRow) {
        return {
            fontWeight: 'bold',
            color: '#1F4E78',
            backgroundColor: '#F2F4F7',
            borderTop: '2px solid #1F4E78',
            borderBottom: '4px double #1F4E78',
            borderLeft: '1px solid #CBD5E1',
            borderRight: '1px solid #CBD5E1',
            paddingTop: '6px',
            paddingBottom: '6px',
        };
    }

    // Default borders
    const defaultBorder = '1px solid #CBD5E1';

    // 2. Conditional formatting based on cell values (Excel replica colors)
    // Present or 1.0 status (Green)
    if (val === 'Present' || val === '1.0') {
        return {
            backgroundColor: '#E6F4EA',
            color: '#137333',
            fontWeight: 'bold',
            border: defaultBorder
        };
    }
    // Absent or 0.0 status (Red)
    if (val === 'Absent' || val === '0.0') {
        return {
            backgroundColor: '#FCE8E6',
            color: '#C5221F',
            fontWeight: 'bold',
            border: defaultBorder
        };
    }
    // Late or Late Minutes/Count > 0 (Orange)
    if (val.toLowerCase().includes('late') || (header.includes('late') && Number(val) > 0)) {
        return {
            backgroundColor: '#FEF7E0',
            color: '#B06000',
            fontWeight: 'bold',
            border: defaultBorder
        };
    }
    // Weekend Sat/Sun (Lavender)
    if (val === 'Sun' || val === 'Sat') {
        return {
            backgroundColor: '#F1F3F4',
            color: '#5F6368',
            fontWeight: 'bold',
            border: defaultBorder
        };
    }
    // Leaves status
    if (val.toLowerCase() === 'on leave' || val.toLowerCase() === 'leave' || val.toLowerCase() === 'half day') {
        return {
            backgroundColor: '#E8F0FE',
            color: '#1A73E8',
            fontWeight: 'bold',
            border: defaultBorder
        };
    }

    // Default Zebra Striping Styles
    return {
        backgroundColor: isEven ? '#F8FAFC' : '#FFFFFF',
        color: '#333333',
        border: defaultBorder
    };
};

const getWeeksOfMonth = (monthStr) => {
    if (!monthStr) return [];
    const [year, monthNum] = monthStr.split('-').map(Number);
    const weeks = [];
    const firstDate = new Date(year, monthNum - 1, 1);
    const lastDate = new Date(year, monthNum, 0);

    let currentStart = new Date(firstDate);
    while (currentStart <= lastDate) {
        let currentEnd = new Date(currentStart);
        const dayOfWeek = currentStart.getDay(); // 0 is Sunday, 1 is Monday...
        const daysToSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
        currentEnd.setDate(currentStart.getDate() + daysToSunday);

        if (currentEnd > lastDate) {
            currentEnd = new Date(lastDate);
        }

        const weekLabel = `Week ${weeks.length + 1} (${currentStart.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })} - ${currentEnd.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })})`;
        const startVal = currentStart.toISOString().slice(0, 10);
        weeks.push({ label: weekLabel, value: startVal });

        currentStart = new Date(currentEnd);
        currentStart.setDate(currentStart.getDate() + 1);
    }
    return weeks;
};

const MobileReports = () => {
    // State (Synchronized with Web)
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [reportType, setReportType] = useState('matrix_monthly');
    const [fileFormat, setFileFormat] = useState('xlsx');
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'history'

    // New filters states
    const [employees, setEmployees] = useState([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [useCustomRange, setUseCustomRange] = useState(false);
    const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().slice(0, 10));
    const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().slice(0, 10));
    const [selectedWeek, setSelectedWeek] = useState('');

    // Searchable employee select states
    const [isEmpDropdownOpen, setIsEmpDropdownOpen] = useState(false);
    const [empSearchQuery, setEmpSearchQuery] = useState('');
    const empDropdownRef = React.useRef(null);

    // Custom dropdown states
    const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
    const [isWeekDropdownOpen, setIsWeekDropdownOpen] = useState(false);
    const [isColsDropdownOpen, setIsColsDropdownOpen] = useState(false);

    const typeDropdownRef = React.useRef(null);
    const weekDropdownRef = React.useRef(null);
    const colsDropdownRef = React.useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (empDropdownRef.current && !empDropdownRef.current.contains(event.target)) {
                setIsEmpDropdownOpen(false);
            }
            if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target)) {
                setIsTypeDropdownOpen(false);
            }
            if (weekDropdownRef.current && !weekDropdownRef.current.contains(event.target)) {
                setIsWeekDropdownOpen(false);
            }
            if (colsDropdownRef.current && !colsDropdownRef.current.contains(event.target)) {
                setIsColsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedEmployeeName = employees.find(emp => emp.user_id === selectedEmployeeId)?.user_name || 'All Employees';
    const filteredEmployees = employees.filter(emp => 
        emp.user_name.toLowerCase().includes(empSearchQuery.toLowerCase())
    );

    const weeks = React.useMemo(() => getWeeksOfMonth(selectedMonth), [selectedMonth]);

    useEffect(() => {
        if (weeks.length > 0) {
            setSelectedWeek(weeks[0].value);
        }
    }, [weeks]);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await adminService.getAllUsers();
                if (res.success && res.users) {
                    const sorted = [...res.users].sort((a, b) => a.user_name.localeCompare(b.user_name));
                    setEmployees(sorted);
                }
            } catch (err) {
                console.error("Failed to load employees for filtering", err);
            }
        };
        fetchEmployees();
    }, []);

    useEffect(() => {
        window.dispatchEvent(new CustomEvent('mano-active-tab', {
            detail: { tab: activeTab }
        }));
    }, [activeTab]);

    const reportTypes = [
        { id: 'attendance_matrix_daily', label: 'Daily Attendance Matrix' },
        { id: 'matrix_daily', label: 'Daily Attendance Report' },
        { id: 'attendance_detailed', label: 'Detailed Log' },
        { id: 'employee_master', label: 'Employee Master Data' },
        { id: 'lateness_report', label: 'Lateness Report' },
        { id: 'attendance_matrix_monthly', label: 'Monthly Attendance Matrix' },
        { id: 'matrix_monthly', label: 'Monthly Attendance Report' },
        { id: 'attendance_summary', label: 'Monthly Summary Report' },
        { id: 'attendance_matrix_weekly', label: 'Weekly Attendance Matrix' },
        { id: 'matrix_weekly', label: 'Weekly Attendance Report' }
    ];

    const fileFormats = [
        { id: 'xlsx', label: 'XLSX', icon: FileSpreadsheet, color: 'emerald' },
        { id: 'csv', label: 'CSV', icon: FileType, color: 'blue' },
        { id: 'pdf', label: 'PDF', icon: FileText, color: 'rose' }
    ];

    // Export History
    const [exportHistory, setExportHistory] = useState(() => {
        const savedHistory = localStorage.getItem('attendance_export_history');
        return savedHistory ? JSON.parse(savedHistory) : [];
    });

    useEffect(() => {
        localStorage.setItem('attendance_export_history', JSON.stringify(exportHistory));
    }, [exportHistory]);

    const [exportColumns, setExportColumns] = useState({
        timeIn: true,
        timeOut: true,
        workedHours: true,
        requiredHours: true,
        late: true,
        location: true,
        attendanceDays: true
    });

    // Preview Data State
    const [previewData, setPreviewData] = useState({ columns: [], rows: [] });
    const [loadingPreview, setLoadingPreview] = useState(false);

    // Stable string key so any checkbox toggle reliably re-fires the effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const exportColumnsKey = JSON.stringify(exportColumns);

    // Fetch Preview
    useEffect(() => {
        if (activeTab !== 'preview') return;
        let cancelled = false;
        const fetchPreview = async () => {
            console.log("fetchPreview triggered (mobile):", {
                selectedMonth,
                reportType,
                dateToUse: (['matrix_weekly', 'attendance_matrix_weekly'].includes(reportType) && !useCustomRange) ? selectedWeek : selectedDate,
                selectedEmployeeId,
                useCustomRange,
                customStartDate,
                customEndDate,
                exportColumns
            });
            setLoadingPreview(true);
            try {
                const isWeekly = ['matrix_weekly', 'attendance_matrix_weekly'].includes(reportType);
                const dateToUse = (isWeekly && !useCustomRange) ? selectedWeek : selectedDate;

                const qStart = useCustomRange ? customStartDate : "";
                const qEnd = useCustomRange ? customEndDate : "";

                const res = await adminService.getReportPreview(
                    selectedMonth,
                    reportType,
                    dateToUse,
                    selectedEmployeeId,
                    qStart,
                    qEnd,
                    exportColumnsKey
                );
                if (!cancelled && res.ok) {
                    console.log("fetchPreview success (mobile), columns count:", res.data.columns?.length);
                    setPreviewData(res.data);
                }
            } catch (error) {
                if (!cancelled) {
                    console.error("fetchPreview failed (mobile):", error);
                    toast.error("Failed to load preview data");
                }
            } finally {
                if (!cancelled) setLoadingPreview(false);
            }
        };
        fetchPreview();
        return () => { cancelled = true; };
    }, [selectedMonth, reportType, selectedDate, selectedEmployeeId, useCustomRange, customStartDate, customEndDate, selectedWeek, activeTab, exportColumnsKey]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const isWeekly = ['matrix_weekly', 'attendance_matrix_weekly'].includes(reportType);
            const dateToUse = (isWeekly && !useCustomRange) ? selectedWeek : selectedDate;

            const qStart = useCustomRange ? customStartDate : "";
            const qEnd = useCustomRange ? customEndDate : "";

            const res = await adminService.queueReport(
                selectedMonth,
                reportType,
                fileFormat,
                selectedEmployeeId,
                dateToUse,
                qStart,
                qEnd,
                JSON.stringify(exportColumns)
            );
            if (res.ok) {
                const reportId = res.reportId;
                const filename = `Report_${reportType}_${useCustomRange ? `${customStartDate}_to_${customEndDate}` : (selectedMonth || dateToUse)}.${fileFormat}`;
                const reportTypeLabel = reportTypes.find(r => r.id === reportType)?.label || reportType;
                const newReport = {
                    id: reportId || Date.now().toString(),
                    reportId: reportId,
                    name: filename,
                    type: reportTypeLabel,
                    date: new Date().toLocaleString(),
                    status: 'Generating',
                    size: 'Pending'
                };
                setExportHistory(prev => [newReport, ...prev]);
                toast.info("Report is compiling in the background! Track it in Export History.");
                setActiveTab('history');
            }
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Failed to queue report");
        } finally {
            setIsGenerating(false);
        }
    };

    // Poll status of generating reports in history
    useEffect(() => {
        const generatingReports = exportHistory.filter(item => item.status === 'Generating');
        if (generatingReports.length === 0) return;

        const interval = setInterval(async () => {
            let updated = false;
            const nextHistory = await Promise.all(exportHistory.map(async (item) => {
                if (item.status === 'Generating' && item.reportId) {
                    try {
                        const res = await adminService.getReportStatus(item.reportId);
                        if (res.ok && res.data) {
                            const { status, file_url, error_message } = res.data;
                            if (status === 'completed') {
                                updated = true;
                                toast.success(`Report Ready: ${item.type} has compiled successfully.`);
                                // Trigger automatic download in background
                                const link = document.createElement('a');
                                link.href = file_url;
                                link.setAttribute('download', item.name);
                                document.body.appendChild(link);
                                link.click();
                                link.remove();
                                return {
                                    ...item,
                                    status: 'Ready',
                                    file_url,
                                    size: 'S3 Link'
                                };
                            } else if (status === 'failed') {
                                updated = true;
                                toast.error(`Report Failed: ${error_message || 'Compilation failed'}`);
                                return {
                                    ...item,
                                    status: 'Failed',
                                    size: 'Error'
                                };
                            }
                        }
                    } catch (err) {
                        console.error("Failed to poll status for report", item.reportId, err);
                    }
                }
                return item;
            }));

            if (updated) {
                setExportHistory(nextHistory);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [exportHistory]);

    const isWeekly = ['matrix_weekly', 'attendance_matrix_weekly'].includes(reportType);
    const dateToUse = (isWeekly && !useCustomRange) ? selectedWeek : selectedDate;
    const displayedPeriod = useCustomRange 
        ? `${customStartDate} to ${customEndDate}` 
        : ((isWeekly && !useCustomRange) ? (weeks.find(w => w.value === selectedWeek)?.label || selectedWeek) : (selectedMonth || selectedDate));
    const selectedReportTypeLabel = reportTypes.find(opt => opt.id === reportType)?.label || reportType;

    return (
        <MobileDashboardLayout title="Reports & Exports">
            <div className="min-h-screen bg-slate-50 dark:bg-black pb-24 transition-colors duration-300">
                
                {/* --- HEADER AREA --- */}
                <div className="px-5 pt-6 space-y-6">
                    {/* Standardized Tabs Card */}
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="bg-slate-200/50 dark:bg-github-dark-border/50 p-1.5 flex rounded-2xl backdrop-blur-md border border-white/20 dark:border-white/5"
                    >
                        {['preview', 'history'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-2.5 text-[11px] font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                                    activeTab === tab 
                                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 transform scale-[1.02]' 
                                        : 'text-slate-500 dark:text-github-dark-muted hover:bg-white/50 dark:hover:bg-slate-800/50'
                                }`}
                            >
                                {tab === 'preview' ? <Eye size={14} /> : <HistoryIcon size={14} />}
                                <span className="capitalize">{tab}</span>
                            </button>
                        ))}
                    </motion.div>

                    {/* Quick Info Bar - Now inside the card flow */}
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                <FileText size={16} />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black text-slate-800 dark:text-white uppercase leading-none">{reportType.replace(/_/g, ' ')}</h3>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{activeTab === 'preview' ? 'Live Data View' : 'Past Exports'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-white/5 rounded-full">
                            <Clock size={10} className="text-slate-400" />
                            <span className="text-[9px] font-black text-slate-500">{displayedPeriod}</span>
                        </div>
                    </div>
                </div>

                <div className="px-5 py-6 space-y-6">
                    {/* --- CONFIGURATION PANEL (Matched Size) --- */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-github-dark-subtle p-5 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Custom Report Type Dropdown */}
                            <div className="space-y-1.5 relative animate-none" ref={typeDropdownRef}>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Type</label>
                                <button
                                    type="button"
                                    onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                                    className="w-full flex items-center justify-between pl-3 pr-4 h-10 bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-slate-800 dark:text-white cursor-pointer text-left"
                                >
                                    <span className="truncate">{selectedReportTypeLabel}</span>
                                    <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform ${isTypeDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isTypeDropdownOpen && (
                                    <div className="absolute left-0 mt-1 w-full bg-white dark:bg-github-dark-subtle border border-slate-100 dark:border-white/5 rounded-xl shadow-xl z-50 p-2 max-h-48 overflow-y-auto no-scrollbar space-y-0.5">
                                        {reportTypes.map((t) => (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => {
                                                    setReportType(t.id);
                                                    setIsTypeDropdownOpen(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 text-xs rounded-lg font-bold transition-colors ${
                                                    reportType === t.id 
                                                        ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400' 
                                                        : 'text-slate-500 dark:text-github-dark-muted hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                }`}
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Employee Selector */}
                            <div className="space-y-1.5 relative animate-none" ref={empDropdownRef}>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Employee</label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEmpDropdownOpen(!isEmpDropdownOpen);
                                        setEmpSearchQuery('');
                                    }}
                                    className="w-full flex items-center justify-between pl-3 pr-4 h-10 bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-slate-800 dark:text-white cursor-pointer text-left"
                                >
                                    <span className="truncate">{selectedEmployeeName}</span>
                                    <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform ${isEmpDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isEmpDropdownOpen && (
                                    <div className="absolute left-0 mt-1 w-full bg-white dark:bg-github-dark-subtle border border-slate-100 dark:border-white/5 rounded-xl shadow-xl z-50 p-2 flex flex-col">
                                        <div className="relative mb-2">
                                            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Search..."
                                                value={empSearchQuery}
                                                onChange={(e) => setEmpSearchQuery(e.target.value)}
                                                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-white"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="max-h-48 overflow-y-auto no-scrollbar space-y-0.5">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedEmployeeId('');
                                                    setIsEmpDropdownOpen(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 text-xs rounded-lg font-bold transition-colors ${
                                                    selectedEmployeeId === '' 
                                                        ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400' 
                                                        : 'text-slate-500 dark:text-github-dark-muted hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                }`}
                                            >
                                                All Employees
                                            </button>
                                            {filteredEmployees.length > 0 ? (
                                                filteredEmployees.map(emp => (
                                                    <button
                                                        key={emp.user_id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedEmployeeId(emp.user_id);
                                                            setIsEmpDropdownOpen(false);
                                                        }}
                                                        className={`w-full text-left px-3 py-2 text-xs rounded-lg font-bold transition-colors ${
                                                            selectedEmployeeId === emp.user_id 
                                                                ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400' 
                                                                : 'text-slate-500 dark:text-github-dark-muted hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                        }`}
                                                    >
                                                        {emp.user_name}
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="text-[10px] text-slate-400 dark:text-github-dark-muted text-center py-3 font-bold uppercase tracking-widest">
                                                    No results
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Date Picker Section */}
                        {useCustomRange ? (
                            <div className="grid grid-cols-2 gap-4">
                                <MobileDatePicker
                                    label="Start Date"
                                    value={customStartDate}
                                    onChange={setCustomStartDate}
                                />
                                <MobileDatePicker
                                    label="End Date"
                                    value={customEndDate}
                                    onChange={setCustomEndDate}
                                />
                            </div>
                        ) : (
                            reportType !== 'employee_master' && (
                                <div className="w-full">
                                    {['matrix_monthly', 'attendance_matrix_monthly', 'lateness_report', 'attendance_detailed', 'attendance_summary'].includes(reportType) ? (
                                        <MonthPicker
                                            label="Period"
                                            value={selectedMonth}
                                            onChange={setSelectedMonth}
                                        />
                                    ) : ['matrix_weekly', 'attendance_matrix_weekly'].includes(reportType) ? (
                                        <div className="grid grid-cols-2 gap-4">
                                            <MonthPicker
                                                label="Period"
                                                value={selectedMonth}
                                                onChange={setSelectedMonth}
                                            />
                                            <div className="space-y-1.5 relative" ref={weekDropdownRef}>
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Select Week</label>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsWeekDropdownOpen(!isWeekDropdownOpen)}
                                                    className="w-full flex items-center justify-between pl-3 pr-4 h-10 bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-slate-800 dark:text-white cursor-pointer text-left"
                                                >
                                                    <span className="truncate">{weeks.find(w => w.value === selectedWeek)?.label || 'Select Week'}</span>
                                                    <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform ${isWeekDropdownOpen ? 'rotate-180' : ''}`} />
                                                </button>

                                                {isWeekDropdownOpen && (
                                                    <div className="absolute left-0 mt-1 w-full bg-white dark:bg-github-dark-subtle border border-slate-100 dark:border-white/5 rounded-xl shadow-xl z-50 p-2 max-h-48 overflow-y-auto no-scrollbar space-y-0.5">
                                                        {weeks.map((w, idx) => (
                                                            <button
                                                                key={idx}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedWeek(w.value);
                                                                    setIsWeekDropdownOpen(false);
                                                                }}
                                                                className={`w-full text-left px-3 py-2 text-xs rounded-lg font-bold transition-colors ${
                                                                    selectedWeek === w.value 
                                                                        ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400' 
                                                                        : 'text-slate-500 dark:text-github-dark-muted hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                                }`}
                                                            >
                                                                {w.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <MobileDatePicker
                                            label="Period"
                                            value={selectedDate}
                                            onChange={setSelectedDate}
                                        />
                                    )}
                                </div>
                            )
                        )}

                        {/* Custom Date Range Toggle */}
                        <button
                            type="button"
                            id="useCustomRangeMobile"
                            onClick={() => setUseCustomRange(!useCustomRange)}
                            className="flex items-center gap-2.5 px-1 cursor-pointer focus:outline-none"
                        >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                useCustomRange
                                    ? 'bg-indigo-500 border-indigo-500 text-white shadow-sm shadow-indigo-500/20'
                                    : 'bg-white dark:bg-black border-slate-300 dark:border-white/10'
                            }`}>
                                {useCustomRange && (
                                    <svg className="w-2.5 h-2.5 stroke-[3] stroke-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                )}
                            </div>
                            <span className="text-[10px] font-black text-slate-500 dark:text-github-dark-muted select-none uppercase tracking-widest">
                                Use Custom Date Range
                            </span>
                        </button>

                        {/* Columns Selection Dropdown */}
                        {reportType !== 'employee_master' && (
                            <div className="space-y-1.5 relative animate-none" ref={colsDropdownRef}>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Columns to Include</label>
                                <button
                                    type="button"
                                    onClick={() => setIsColsDropdownOpen(!isColsDropdownOpen)}
                                    className="w-full flex items-center justify-between pl-3 pr-4 h-10 bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-slate-800 dark:text-white cursor-pointer text-left"
                                >
                                    <span className="truncate">
                                        {Object.values(exportColumns).filter(Boolean).length} Columns Selected
                                    </span>
                                    <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform ${isColsDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isColsDropdownOpen && (
                                    <div className="absolute left-0 mt-1 w-full bg-white dark:bg-github-dark-subtle border border-slate-100 dark:border-white/5 rounded-xl shadow-xl z-50 p-3 space-y-3">
                                        {[
                                            { id: 'timeIn', label: 'Time In' },
                                            { id: 'timeOut', label: 'Time Out' },
                                            { id: 'workedHours', label: 'Worked Hours' },
                                            { id: 'requiredHours', label: 'Required Hours' },
                                            { id: 'late', label: 'Lateness Info' },
                                            { id: 'location', label: 'Locations' },
                                            { id: 'attendanceDays', label: 'Attendance Summary' }
                                        ].map((col) => (
                                            <button
                                                key={col.id}
                                                type="button"
                                                onClick={() => {
                                                    setExportColumns(prev => ({
                                                        ...prev,
                                                        [col.id]: !prev[col.id]
                                                    }));
                                                }}
                                                className="w-full flex items-center gap-2.5 cursor-pointer focus:outline-none group text-left"
                                            >
                                                <div className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-all ${
                                                    exportColumns[col.id]
                                                        ? 'bg-indigo-500 border-indigo-500 text-white shadow-sm shadow-indigo-500/20'
                                                        : 'bg-white dark:bg-black border-slate-300 dark:border-white/10 group-hover:border-indigo-400'
                                                }`}>
                                                    {exportColumns[col.id] && (
                                                        <svg className="w-2.5 h-2.5 stroke-[3] stroke-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-600 dark:text-github-dark-muted select-none">
                                                    {col.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Format Selection */}
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">File Format</label>
                            <div className="flex gap-2">
                                {fileFormats.map((f) => (
                                    <button
                                        key={f.id}
                                        onClick={() => setFileFormat(f.id)}
                                        className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border transition-all duration-300 ${
                                            fileFormat === f.id 
                                                ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                                                : 'bg-slate-50 dark:bg-black/20 border-slate-100 dark:border-white/5 text-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                        <f.icon size={14} />
                                        <span className="text-[10px] font-black uppercase">{f.id}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Action Button */}
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="w-full py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {isGenerating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Generating...</span>
                                </>
                            ) : (
                                <>
                                    <Download size={16} strokeWidth={3} />
                                    <span>Generate & Download</span>
                                </>
                            )}
                        </button>
                    </motion.div>

                    {/* --- CONTENT SECTION --- */}
                    <AnimatePresence mode="wait">
                        {activeTab === 'preview' ? (
                            <motion.div 
                                key="preview"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className="space-y-0 mt-6"
                            >
                                <div className="overflow-hidden flex flex-col min-h-[300px]">
                                    <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-white dark:bg-github-dark-bg">
                                        <span className="text-[10px] font-black text-slate-500 dark:text-github-dark-muted uppercase tracking-widest flex items-center gap-2">
                                            <Table size={12} className="text-indigo-500" /> Data Preview
                                        </span>
                                        {previewData.rows?.length > 0 && (
                                            <span className="text-[9px] font-black text-slate-400 px-2.5 py-1 bg-slate-100 dark:bg-white/5 rounded-full border border-slate-200 dark:border-white/10">
                                                {previewData.rows.length} ROWS
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[500px] no-scrollbar bg-slate-100 p-3 border-t border-slate-200 dark:border-github-dark-border">
                                        {loadingPreview ? (
                                            <div className="h-full flex flex-col items-center justify-center py-20 gap-3">
                                                <div className="w-8 h-8 border-3 border-indigo-100 dark:border-indigo-900/30 border-t-indigo-500 rounded-full animate-spin" />
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Crunching Data...</p>
                                            </div>
                                        ) : previewData.rows?.length > 0 ? (
                                            <table className="w-full text-left border-collapse min-w-max bg-white text-slate-800 shadow-sm rounded border border-slate-300" style={{ fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
                                                <thead className="sticky top-0 z-10 bg-white/95 dark:bg-github-dark-bg/95 backdrop-blur-md">
                                                    {previewData.headers ? (
                                                        <>
                                                            <tr className="text-[10px] uppercase font-bold border-b border-slate-200 dark:border-github-dark-border">
                                                                {previewData.headers[0].map((cell, idx) => (
                                                                    <th 
                                                                        key={idx} 
                                                                        rowSpan={cell.rowspan} 
                                                                        colSpan={cell.colspan} 
                                                                        className="px-3 py-2.5 whitespace-nowrap tracking-wider text-center border border-[#3A6085]"
                                                                        style={{ backgroundColor: '#1F4E78', color: '#FFFFFF' }}
                                                                    >
                                                                        {cell.label}
                                                                    </th>
                                                                ))}
                                                            </tr>
                                                            <tr className="text-[10px] uppercase font-bold">
                                                                {previewData.headers[1].map((cell, idx) => (
                                                                    <th 
                                                                        key={idx} 
                                                                        className="px-3 py-2 whitespace-nowrap tracking-wider text-center border border-[#3A6085]"
                                                                        style={{ backgroundColor: '#1F4E78', color: '#FFFFFF' }}
                                                                    >
                                                                        {cell.label}
                                                                    </th>
                                                                ))}
                                                            </tr>
                                                        </>
                                                    ) : (
                                                        <tr className="text-[10px] uppercase font-bold border-b border-slate-200 dark:border-github-dark-border">
                                                            {previewData.columns.map((col, idx) => {
                                                                const alignment = getAlignmentClass(col);
                                                                return (
                                                                    <th 
                                                                        key={idx} 
                                                                        className="px-3 py-2.5 whitespace-nowrap tracking-wider border border-[#3A6085]"
                                                                        style={{ 
                                                                            backgroundColor: '#1F4E78', 
                                                                            color: '#FFFFFF',
                                                                            textAlign: alignment
                                                                        }}
                                                                    >
                                                                        {col}
                                                                    </th>
                                                                );
                                                            })}
                                                        </tr>
                                                    )}
                                                </thead>
                                                <tbody>
                                                    {previewData.rows.map((row, rIdx) => {
                                                        const isTotalsRow = row[0]?.toString().toUpperCase() === 'TOTALS';
                                                        const isEven = rIdx % 2 === 0;
                                                        return (
                                                            <tr key={rIdx} className="transition-colors hover:bg-slate-100/50">
                                                                {row.map((cell, cIdx) => {
                                                                    const colHeader = previewData.columns[cIdx]?.toString() || '';
                                                                    const cellStyle = getCellStyle(cell, colHeader, isTotalsRow, isEven);
                                                                    const alignment = getAlignmentClass(colHeader);
                                                                    return (
                                                                        <td 
                                                                            key={cIdx} 
                                                                            className="px-3 py-2 text-[11px] font-medium whitespace-nowrap transition-colors"
                                                                            style={{ ...cellStyle, textAlign: alignment }}
                                                                        >
                                                                            {cell?.toString().split('\n').map((line, lIdx) => (
                                                                                <div key={lIdx} className="leading-normal">{line}</div>
                                                                            ))}
                                                                        </td>
                                                                    );
                                                                })}
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-20 gap-3">
                                                <Activity size={32} className="text-slate-200 dark:text-white/5" />
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">No results for this selection</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="history"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-3 px-4"
                            >
                                {exportHistory.length > 0 ? (
                                    exportHistory.map((report) => (
                                        <div key={report.id} className="bg-white dark:bg-github-dark-subtle p-4 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm flex items-center gap-4 active:scale-[0.98] transition-all">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                                report.name.endsWith('.pdf') ? 'bg-rose-50 text-rose-500 dark:bg-rose-500/10' 
                                                : report.name.endsWith('.csv') ? 'bg-blue-50 text-blue-500 dark:bg-blue-500/10'
                                                : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10'
                                            }`}>
                                                {report.name.endsWith('.pdf') ? <FileText size={18} /> : report.name.endsWith('.csv') ? <FileType size={18} /> : <FileSpreadsheet size={18} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="text-xs font-black text-slate-800 dark:text-white truncate pr-2 uppercase">{report.type}</h4>
                                                    {report.status === 'Ready' ? (
                                                        <a 
                                                            href={report.file_url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            download={report.name}
                                                            className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 shrink-0 hover:bg-emerald-100 transition-all cursor-pointer"
                                                        >
                                                            DOWNLOAD
                                                        </a>
                                                    ) : report.status === 'Generating' ? (
                                                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 shrink-0 animate-pulse flex items-center gap-1">
                                                            <div className="w-2 h-2 border border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div> COMPILING
                                                        </span>
                                                    ) : (
                                                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-rose-50 text-rose-600 dark:bg-rose-500/10 shrink-0">FAILED</span>
                                                    )}
                                                </div>
                                                <p className="text-[9px] font-bold text-slate-400 truncate mt-0.5">{report.name}</p>
                                                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-50 dark:border-white/5">
                                                    <div className="flex items-center gap-1">
                                                        <Clock size={10} className="text-slate-300" />
                                                        <span className="text-[9px] font-black text-slate-400">{report.date}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <DownloadCloud size={10} className="text-indigo-400" />
                                                        <span className="text-[9px] font-black text-slate-400">{report.size}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-white dark:bg-github-dark-subtle rounded-2xl border border-dashed border-slate-200 dark:border-white/5 p-12 flex flex-col items-center justify-center gap-3 text-center">
                                        <DownloadCloud size={32} className="text-slate-200 dark:text-white/10" />
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Your export history is empty</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </MobileDashboardLayout>
    );
};

// Simple wrapper to fix naming conflict if any
const MobileReportsWrapper = ({ children }) => children;

export default MobileReports;
