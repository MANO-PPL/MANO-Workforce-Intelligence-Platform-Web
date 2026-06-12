import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Briefcase, MapPin, Calendar, Clock, DollarSign,
  Upload, FileText, Send, CheckCircle, X,
  Sparkles, Award, Sun, Moon, ArrowRight, ChevronRight, ArrowLeft
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const getDefaultFields = () => [
  { id: 'def_1', type: 'text', label: 'Full Name', placeholder: 'John Doe', required: true, options: [], width: 'full' },
  { id: 'def_2', type: 'email', label: 'Email Address', placeholder: 'john@example.com', required: true, options: [], width: 'full' },
  { id: 'def_3', type: 'tel', label: 'Mobile Number', placeholder: '+91 98765 43210', required: true, options: [], width: 'full' },
  { id: 'def_4', type: 'textarea', label: 'Short Cover Letter / Cover Note', placeholder: "Brief note on why you're a great fit...", required: false, options: [], width: 'full' },
  { id: 'def_5', type: 'file', label: 'Resume File (PDF Only)', placeholder: '', required: true, options: [], width: 'full' },
];

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const dateOnlyStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = dateOnlyStr.split('-');
  if (parts.length !== 3) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString();
  }
  const year = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const month = monthNames[monthIdx];
  
  let suffix = 'th';
  if (day === 1 || day === 21 || day === 31) suffix = 'st';
  else if (day === 2 || day === 22) suffix = 'nd';
  else if (day === 3 || day === 23) suffix = 'rd';
  
  return `${day}${suffix} ${month} ${year}`;
};

const PublicJobOpeningMobile = () => {
  const { slug } = useParams();
  const [job, setJob] = useState(null);
  const [formData, setFormData] = useState({});
  const [resumeFile, setResumeFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // 'details' or 'apply'

  // Initialize theme from localStorage or default to browser system setting
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await api.get(`/recruitment/public-opening/${slug}`);
        const foundJob = res.data;
        if (foundJob.isExpired) {
          setJob(null);
          setIsExpired(true);
        } else if (foundJob.status !== 'active') {
          setJob(null);
          setIsExpired(false);
        } else {
          setJob(foundJob);
          setIsExpired(false);

          // Initialize form state dynamically
          const initialForm = {};
          const fields = foundJob.form_config && foundJob.form_config.length > 0
            ? foundJob.form_config
            : getDefaultFields();
          fields.forEach(field => {
            if (field.type !== 'divider' && field.type !== 'section_header') {
              initialForm[field.label] = field.type === 'checkbox_group' ? [] : '';
            }
          });
          setFormData(initialForm);
        }
      } catch (err) {
        console.error('Error fetching job details:', err);
        setJob(null);
        setIsExpired(false);
      }
    };
    fetchJob();
  }, [slug]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF resumes are supported.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size exceeds the 5MB limit.');
        return;
      }
      setResumeFile(file);
    }
  };

  const fieldsToShow = job?.form_config && job.form_config.length > 0
    ? job.form_config
    : getDefaultFields();

  const renderField = (field) => {
    switch (field.type) {
      case 'divider':
        return <hr key={field.id} className="border-slate-200 dark:border-[#30363d] my-4 col-span-2" />;
      case 'section_header':
        return (
          <h4 key={field.id} className="text-[11px] font-extrabold text-slate-800 dark:text-[#f0f6fc] mt-3 mb-1 border-b border-slate-100 dark:border-[#30363d] pb-1 uppercase tracking-wider col-span-2">
            {field.label}
          </h4>
        );
      case 'textarea':
        return (
          <div key={field.id} className="col-span-2">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-github-dark-muted mb-1 block">
              {field.label} {field.required && ' *'}
            </label>
            <textarea
              required={field.required}
              placeholder={field.placeholder}
              rows="3"
              value={formData[field.label] || ''}
              onChange={(e) => setFormData({ ...formData, [field.label]: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-[#30363d] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0969da]/20 focus:border-[#0969da] dark:text-[#f0f6fc]"
            />
          </div>
        );
      case 'select':
        return (
          <div key={field.id} className="col-span-2">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-github-dark-muted mb-1 block">
              {field.label} {field.required && ' *'}
            </label>
            <select
              required={field.required}
              value={formData[field.label] || ''}
              onChange={(e) => setFormData({ ...formData, [field.label]: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-[#30363d] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0969da]/20 focus:border-[#0969da] dark:text-[#f0f6fc]"
            >
              <option value="">Select an option...</option>
              {field.options.map((opt, i) => (
                <option key={i} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        );
      case 'radio_group':
        return (
          <div key={field.id} className="col-span-2">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-github-dark-muted mb-2 block">
              {field.label} {field.required && ' *'}
            </label>
            <div className="flex flex-col gap-2.5 bg-slate-50 dark:bg-[#161b22] p-3 rounded-xl border border-slate-100 dark:border-[#30363d]">
              {field.options.map((opt, i) => (
                <label key={i} className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-[#c9d1d9] cursor-pointer">
                  <input
                    type="radio"
                    name={field.id}
                    required={field.required && !formData[field.label]}
                    checked={formData[field.label] === opt}
                    onChange={() => setFormData({ ...formData, [field.label]: opt })}
                    className="text-[#0969da] focus:ring-[#0969da] h-4 w-4 border-slate-300 dark:border-slate-700 dark:bg-black"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>
        );
      case 'checkbox_group':
        return (
          <div key={field.id} className="col-span-2">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-github-dark-muted mb-2 block">
              {field.label} {field.required && ' *'}
            </label>
            <div className="flex flex-col gap-2.5 bg-slate-50 dark:bg-[#161b22] p-3 rounded-xl border border-slate-100 dark:border-[#30363d]">
              {field.options.map((opt, i) => {
                const currentValues = formData[field.label] || [];
                const isChecked = currentValues.includes(opt);
                return (
                  <label key={i} className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-[#c9d1d9] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const newValues = e.target.checked
                          ? [...currentValues, opt]
                          : currentValues.filter(v => v !== opt);
                        setFormData({ ...formData, [field.label]: newValues });
                      }}
                      className="text-[#0969da] rounded focus:ring-[#0969da] h-4 w-4 border-slate-300 dark:border-slate-700 dark:bg-black"
                    />
                    <span>{opt}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      case 'file':
        return (
          <div key={field.id} className="col-span-2">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-github-dark-muted mb-1.5 block">
              {field.label} {field.required && ' *'}
            </label>
            <div className="relative border-2 border-dashed border-slate-200 dark:border-[#30363d] rounded-2xl p-6 text-center hover:bg-slate-50 dark:hover:bg-[#161b22] transition-colors cursor-pointer bg-slate-50/20 dark:bg-[#0d1117]/10">
              {!resumeFile && (
                <input
                  type="file"
                  accept=".pdf"
                  required={field.required}
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
              )}
              <div className="flex flex-col items-center justify-center gap-2">
                {resumeFile ? (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-[#c9d1d9] flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-[#21262d] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#30363d]">
                      <FileText size={14} className="text-indigo-500" />
                      {resumeFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setResumeFile(null);
                        // Reset file input value so candidate can upload the same file again if desired
                        const fileInput = document.querySelector('input[type="file"]');
                        if (fileInput) fileInput.value = '';
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl text-[10px] font-bold transition-all z-20"
                    >
                      <X size={12} />
                      Remove File
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="p-3 bg-[#0969da]/5 dark:bg-github-dark-accent/10 rounded-full text-[#0969da] dark:text-github-dark-accent">
                      <Upload size={20} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-[#c9d1d9]">Tap to Upload Resume</span>
                    <span className="text-[10px] text-slate-400">PDF up to 5MB</span>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div key={field.id} className="col-span-2">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-github-dark-muted mb-1 block">
              {field.label} {field.required && ' *'}
            </label>
            <input
              type={field.type === 'tel' ? 'tel' : field.type === 'url' ? 'url' : field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
              required={field.required}
              placeholder={field.placeholder}
              value={formData[field.label] || ''}
              onChange={(e) => setFormData({ ...formData, [field.label]: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-[#30363d] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0969da]/20 focus:border-[#0969da] dark:text-[#f0f6fc]"
            />
          </div>
        );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const fileField = fieldsToShow.find(f => f.type === 'file');
    const isFileRequired = fileField ? fileField.required : false;

    if (isFileRequired && !resumeFile) {
      toast.error(`Please upload your ${fileField.label || 'Resume'}.`);
      return;
    }

    setSubmitting(true);
    setAiAnalyzing(true);

    try {
      const formDataPayload = new FormData();
      formDataPayload.append('responses', JSON.stringify(formData));
      formDataPayload.append('template_id', job.template_id || '');
      formDataPayload.append('template_source', job.template_source || 'scratch');
      if (resumeFile) {
        formDataPayload.append('resume', resumeFile);
      }

      await api.post(`/recruitment/candidates/${job.id}/apply`, formDataPayload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setAiAnalyzing(false);
      setSubmitting(false);
      setSubmitted(true);
      toast.success('Application submitted successfully!');
    } catch (err) {
      console.error('Error submitting application:', err);
      setAiAnalyzing(false);
      setSubmitting(false);
      toast.error(err.response?.data?.error || 'Failed to submit candidate application.');
    }
  };

  if (!job) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#010409] flex flex-col justify-center items-center p-6 text-center font-poppins">
        <div className="max-w-md w-full bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] p-6 rounded-2xl shadow-lg">
          <div className="p-4 bg-slate-100 dark:bg-[#161b22] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border border-slate-200/50 dark:border-[#30363d]/50">
            <Briefcase size={28} className="text-slate-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-[#f0f6fc] mb-2">
            {isExpired ? 'Application Deadline Passed' : 'Job Opening Closed'}
          </h2>
          <p className="text-slate-500 dark:text-github-dark-muted text-xs leading-relaxed mb-2">
            {isExpired
              ? 'The deadline for submitting applications to this role has passed, and we are no longer accepting submissions.'
              : 'This opening has been deactivated by the administrator or is no longer accepting applications.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#010409] font-poppins text-slate-800 dark:text-[#f0f6fc] transition-colors duration-300 pb-24">
      {/* Mobile Careers Header */}
      <header className="bg-white dark:bg-[#0d1117] border-b border-slate-200 dark:border-[#30363d] py-4 shadow-sm sticky top-0 z-30 transition-colors duration-300">
        <div className="px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src="/mano-logo.svg" alt="MANO" className="w-7 h-7 object-contain" />
            <span className="font-black text-base text-[#0969da] dark:text-github-dark-accent">MANO Careers</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-50 dark:bg-[#161b22] text-slate-500 dark:text-github-dark-muted border border-slate-200 dark:border-[#30363d] transition-all"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} className="text-amber-400" />}
            </button>
            <span className="text-[10px] bg-slate-100 dark:bg-[#21262d] text-slate-600 dark:text-[#c9d1d9] px-2.5 py-1 rounded-full font-mono border border-transparent dark:border-[#30363d]">
              Mobile
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="px-4 mt-4">
        {submitted ? (
          <div className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d]/60 rounded-2xl p-6 text-center shadow-md animate-in fade-in zoom-in-95 duration-300 max-w-md mx-auto my-8">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 dark:border-emerald-900/30">
              <CheckCircle size={32} className="text-emerald-500" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-[#f0f6fc] mb-2">Application Submitted!</h1>
            <p className="text-slate-600 dark:text-github-dark-muted text-xs leading-relaxed mb-4">
              Thank you for applying for the <strong>{job.job_title}</strong> role at MANO. Our recruitment team has received your application.
            </p>
            <p className="text-slate-400 dark:text-slate-500 text-[10px] bg-slate-50 dark:bg-[#161b22] py-2 px-3 rounded-xl border border-slate-100 dark:border-[#30363d]/30 mb-6 leading-normal">
              Our AI resume assistant is currently analyzing your credentials for matching. No further action is required.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setActiveTab('details');
              }}
              className="w-full py-2.5 bg-slate-100 dark:bg-[#21262d] text-slate-700 dark:text-[#c9d1d9] border border-transparent dark:border-[#30363d] rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-[#30363d] transition-all"
            >
              Submit another application
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Job Header Info */}
            <div className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d]/60 rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="space-y-1">
                  <h1 className="text-lg font-extrabold text-slate-800 dark:text-[#f0f6fc] leading-tight">
                    {job.job_title}
                  </h1>
                  <p className="text-xs font-bold text-[#0969da] dark:text-github-dark-accent">
                    {job.department}
                  </p>
                </div>
                <span className="shrink-0 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-[10px] px-2.5 py-1 rounded-full font-bold">
                  Active
                </span>
              </div>

              {/* Quick stats list */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-[#30363d]/50 text-[10px] font-medium text-slate-500 dark:text-github-dark-muted">
                <div className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-[#0969da] dark:text-github-dark-accent" />
                  <span className="truncate">{job.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={13} className="text-[#0969da] dark:text-github-dark-accent" />
                  <span className="truncate">{job.employment_type}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <Award size={13} className="text-[#0969da] dark:text-github-dark-accent" />
                  <span className="truncate">{job.experience_required} Exp</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <Calendar size={13} className="text-[#0969da] dark:text-github-dark-accent" />
                  <span className="truncate">Before {formatDate(job.deadline)}</span>
                </div>
              </div>
            </div>

            {/* Premium Mobile Tabs Controls */}
            <div className="flex bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d]/60 rounded-2xl p-1 shadow-sm font-bold text-xs">
              <button
                onClick={() => setActiveTab('details')}
                className={`flex-1 py-2.5 rounded-xl transition-all ${activeTab === 'details'
                    ? 'bg-[#0969da]/10 dark:bg-github-dark-accent/15 text-[#0969da] dark:text-github-dark-accent'
                    : 'text-slate-500 dark:text-github-dark-muted hover:text-slate-800 dark:hover:text-[#f0f6fc]'
                  }`}
              >
                Job Details
              </button>
              <button
                onClick={() => setActiveTab('apply')}
                className={`flex-1 py-2.5 rounded-xl transition-all ${activeTab === 'apply'
                    ? 'bg-[#0969da]/10 dark:bg-github-dark-accent/15 text-[#0969da] dark:text-github-dark-accent'
                    : 'text-slate-500 dark:text-github-dark-muted hover:text-slate-800 dark:hover:text-[#f0f6fc]'
                  }`}
              >
                Apply Now
              </button>
            </div>

            {/* Tabs Content */}
            {activeTab === 'details' ? (
              <div className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d]/60 rounded-2xl p-5 shadow-sm space-y-5">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-[#f0f6fc] mb-2 border-l-4 border-[#0969da] pl-2 leading-none">
                    Job Responsibilities
                  </h3>
                  <p className="whitespace-pre-line text-xs leading-relaxed text-slate-600 dark:text-[#c9d1d9] pl-2.5">
                    {job.responsibilities}
                  </p>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-[#f0f6fc] mb-2 border-l-4 border-[#0969da] pl-2 leading-none">
                    Skills Required
                  </h3>
                  <div className="flex flex-wrap gap-1.5 pl-2.5 mt-2">
                    {job.skills_required.split(',').map((skill, i) => (
                      <span key={i} className="bg-slate-50 dark:bg-[#21262d] border border-slate-100 dark:border-[#30363d] text-slate-600 dark:text-[#c9d1d9] px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold">
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-[#f0f6fc] mb-2 border-l-4 border-[#0969da] pl-2 leading-none">
                    Benefits & Perks
                  </h3>
                  <p className="whitespace-pre-line text-xs leading-relaxed text-slate-600 dark:text-[#c9d1d9] pl-2.5">
                    {job.benefits}
                  </p>
                </div>

                {job.other_details && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-[#f0f6fc] mb-2 border-l-4 border-[#0969da] pl-2 leading-none">
                      Additional Information
                    </h3>
                    <p className="whitespace-pre-line text-xs leading-relaxed text-slate-600 dark:text-[#c9d1d9] pl-2.5">
                      {job.other_details}
                    </p>
                  </div>
                )}

                {job.attachment_name && (
                  <div className="p-3 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-[#30363d] rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-[#0969da] dark:text-github-dark-accent" />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block leading-tight">Attachment / Resources:</span>
                        <span className="font-bold text-slate-700 dark:text-[#c9d1d9] text-[11px] truncate block mt-0.5">{job.attachment_name}</span>
                      </div>
                    </div>
                    <a
                      href={`/api/recruitment/openings-attachments/${job.attachment_url.split('/').pop()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-[#0969da] hover:bg-[#0969da]/90 text-white rounded-lg text-[10px] font-bold shrink-0 transition-all"
                    >
                      View
                    </a>
                  </div>
                )}

                {job.salary_range && (
                  <div className="p-3.5 bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-900/30 rounded-xl">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block leading-tight">Offered Salary Package Range:</span>
                      <p className="font-extrabold text-indigo-700 dark:text-indigo-400 text-xs mt-0.5">{job.salary_range}</p>
                    </div>
                  </div>
                )}

                {/* Direct Action button to go to form */}
                <button
                  onClick={() => setActiveTab('apply')}
                  className="w-full flex justify-center items-center gap-1.5 bg-[#0969da] hover:bg-[#0969da]/90 text-white py-3 rounded-xl font-bold text-xs transition-all shadow-md active:scale-[0.98] mt-2"
                >
                  <span>Apply for this Position</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d]/60 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('details')}
                    className="p-1.5 rounded-xl bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-[#30363d] text-slate-500 dark:text-github-dark-muted hover:text-slate-800 dark:hover:text-[#f0f6fc] active:scale-95 transition-all"
                    aria-label="Back to Job Details"
                  >
                    <ArrowLeft size={15} />
                  </button>
                  <h2 className="text-sm font-bold text-slate-800 dark:text-[#f0f6fc] flex items-center gap-1.5">
                    <Send size={14} className="text-[#0969da]" />
                    Fill Application Details
                  </h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3.5">
                    {fieldsToShow.map(field => renderField(field))}
                  </div>

                  {aiAnalyzing ? (
                    <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl p-4 text-center flex flex-col items-center justify-center gap-2 animate-pulse">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-full text-indigo-500 dark:text-indigo-400 animate-spin">
                        <Sparkles size={16} />
                      </div>
                      <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">AI Resume Assistant analyzing skills...</span>
                    </div>
                  ) : (
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full flex justify-center items-center gap-1.5 bg-[#0969da] hover:bg-[#0969da]/90 text-white py-3 rounded-xl font-bold text-xs transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                      <Send size={14} />
                      Submit Application
                    </button>
                  )}
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicJobOpeningMobile;
