import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileDashboardLayout from '../../components/MobileDashboardLayout';
import MobileSelect from '../../components/MobileSelect';
import { 
  Briefcase, Plus, Search, Sparkles, Copy, Check, Share2, 
  Users, UserCheck, Calendar, MapPin, Award, ArrowRight,
  Sliders, Grid, List, CheckCircle2, ChevronRight, X, FileText,
  Type, AtSign, Phone, Hash, AlignLeft, Link2, Heading, Trash2, Edit3,
  ExternalLink, PhoneCall, Mail
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api';

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

const DEFAULT_PIPELINE_STAGES = [
  { id: 'stg_applied', name: 'Applied', color: 'slate' },
  { id: 'stg_screening', name: 'Screening', color: 'blue' },
  { id: 'stg_shortlisted', name: 'Shortlisted', color: 'indigo' },
  { id: 'stg_interview', name: 'Interview Scheduled', color: 'violet' },
  { id: 'stg_tech', name: 'Technical Round', color: 'purple' },
  { id: 'stg_hr', name: 'HR Round', color: 'pink' },
  { id: 'stg_selected', name: 'Selected', color: 'emerald' },
  { id: 'stg_rejected', name: 'Rejected', color: 'rose' },
  { id: 'stg_offered', name: 'Offered', color: 'amber' },
  { id: 'stg_joined', name: 'Joined', color: 'teal' }
];

const PREDEFINED_FORM_TEMPLATES = [
  {
    id: 'tpl_tech_standard',
    name: 'Standard Tech Role',
    description: 'Ideal for engineering, software development, and IT positions.',
    fields: [
      { id: 'f1', type: 'text', label: 'Full Name', placeholder: 'John Doe', required: true, options: [], width: 'full' },
      { id: 'f2', type: 'email', label: 'Email Address', placeholder: 'john@example.com', required: true, options: [], width: 'full' },
      { id: 'f3', type: 'tel', label: 'Mobile Number', placeholder: '+91 98765 43210', required: true, options: [], width: 'half' },
      { id: 'f4', type: 'text', label: 'Current Company', placeholder: 'ACME Corp', required: false, options: [], width: 'half' },
      { id: 'f5', type: 'text', label: 'Current CTC', placeholder: '₹6 LPA', required: false, options: [], width: 'half' },
      { id: 'f6', type: 'text', label: 'Expected CTC', placeholder: '₹9 LPA', required: false, options: [], width: 'half' },
      { id: 'f7', type: 'select', label: 'Notice Period', placeholder: '', required: true, options: ['Immediate', '15 days', '30 days', '60 days', '90 days'], width: 'half' },
      { id: 'f8', type: 'number', label: 'Total Experience (Years)', placeholder: '2', required: true, options: [], width: 'half' },
      { id: 'f9', type: 'textarea', label: 'Skills & Technologies', placeholder: 'React, Node.js, TypeScript...', required: true, options: [], width: 'full' },
      { id: 'f10', type: 'url', label: 'LinkedIn Profile', placeholder: 'linkedin.com/in/...', required: false, options: [], width: 'half' },
      { id: 'f11', type: 'url', label: 'Portfolio / GitHub URL', placeholder: 'github.com/...', required: false, options: [], width: 'half' },
      { id: 'f12', type: 'section_header', label: 'Your Application', placeholder: '', required: false, options: [], width: 'full' },
      { id: 'f13', type: 'textarea', label: 'Cover Note', placeholder: "Brief note on why you're a great fit...", required: false, options: [], width: 'full' },
      { id: 'f14', type: 'file', label: 'Resume Upload (PDF)', placeholder: '', required: true, options: [], width: 'full' },
    ]
  },
  {
    id: 'tpl_exec_senior',
    name: 'Executive / Senior Leadership',
    description: 'Designed for managerial, director, and C-suite level applications.',
    fields: [
      { id: 'g1', type: 'text', label: 'Full Name', placeholder: 'John Doe', required: true, options: [], width: 'full' },
      { id: 'g2', type: 'email', label: 'Email Address', placeholder: 'john@example.com', required: true, options: [], width: 'full' },
      { id: 'g3', type: 'tel', label: 'Mobile Number', placeholder: '+91 98765 43210', required: true, options: [], width: 'full' },
      { id: 'g4', type: 'section_header', label: 'Professional Profile', placeholder: '', required: false, options: [], width: 'full' },
      { id: 'g5', type: 'text', label: 'Current Designation', placeholder: 'VP of Engineering', required: true, options: [], width: 'half' },
      { id: 'g6', type: 'text', label: 'Current Organisation', placeholder: 'ACME Corp', required: true, options: [], width: 'half' },
      { id: 'g7', type: 'number', label: 'Total Years in Leadership', placeholder: '8', required: true, options: [], width: 'half' },
      { id: 'g8', type: 'number', label: 'Team Size Managed', placeholder: '25', required: false, options: [], width: 'half' },
      { id: 'g9', type: 'text', label: 'Current CTC (LPA)', placeholder: '₹25 LPA', required: false, options: [], width: 'half' },
      { id: 'g10', type: 'text', label: 'Expected CTC (LPA)', placeholder: '₹35 LPA', required: false, options: [], width: 'half' },
      { id: 'g11', type: 'select', label: 'Notice Period', placeholder: '', required: true, options: ['Immediate', '30 days', '60 days', '90 days', '3 months', '6 months'], width: 'full' },
      { id: 'g12', type: 'textarea', label: 'Key Achievements & Highlights', placeholder: 'Describe major accomplishments in your career...', required: true, options: [], width: 'full' },
      { id: 'g13', type: 'section_header', label: 'References & Identity', placeholder: '', required: false, options: [], width: 'full' },
      { id: 'g14', type: 'url', label: 'LinkedIn Profile', placeholder: 'linkedin.com/in/...', required: true, options: [], width: 'full' },
      { id: 'g15', type: 'textarea', label: 'Professional Reference (Name & Contact)', placeholder: 'Name — Company — Email/Phone', required: false, options: [], width: 'full' },
      { id: 'g16', type: 'file', label: 'Resume / CV Upload', placeholder: '', required: true, options: [], width: 'full' },
    ]
  }
];

const RecruitmentDashboardMobile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('openings'); // openings, candidates, create
  const [isLoading, setIsLoading] = useState(false);

  // Data States
  const [openings, setOpenings] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [pipelineStages, setPipelineStages] = useState(DEFAULT_PIPELINE_STAGES);
  const [editingJobId, setEditingJobId] = useState(null);
  const [selectedJobForSidebar, setSelectedJobForSidebar] = useState(null);

  // Popstate history refs and effects for mobile back button navigation
  const openingsRef = useRef(openings);
  const candidatesRef = useRef(candidates);
  const historyLevel = useRef(0);

  useEffect(() => {
    openingsRef.current = openings;
    candidatesRef.current = candidates;
  }, [openings, candidates]);

  useEffect(() => {
    // Reset initial history state on page load/refresh
    if (window.history.state) {
      window.history.replaceState(null, '');
    }

    const handlePopState = (event) => {
      const state = event.state;
      if (!state) {
        setSelectedJobForSidebar(null);
        setSelectedCandidate(null);
        historyLevel.current = 0;
      } else if (state.view === 'applicants') {
        const job = openingsRef.current.find(j => j.id === state.jobId);
        setSelectedJobForSidebar(job || null);
        setSelectedCandidate(null);
        historyLevel.current = 1;
      } else if (state.view === 'candidate-details') {
        const cand = candidatesRef.current.find(c => c.id === state.candidateId);
        const job = openingsRef.current.find(j => j.id === state.jobId);
        setSelectedJobForSidebar(job || null);
        setSelectedCandidate(cand || null);
        historyLevel.current = 2;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Form templates state
  const [savedFormTemplates, setSavedFormTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('tpl_tech_standard');
  const [selectedTemplateSource, setSelectedTemplateSource] = useState('predefined');
  const [activeTemplateLabel, setActiveTemplateLabel] = useState('Standard Tech Role (Predefined)');

  // AI JD Assistant states
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingJD, setGeneratingJD] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);

  const [copiedLink, setCopiedLink] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState('All');

  // Job opening form state
  const [newJob, setNewJob] = useState({
    job_title: '',
    department: '',
    location: '',
    employment_type: 'Full-time',
    experience_required: '',
    salary_range: '',
    skills_required: '',
    responsibilities: '',
    benefits: '',
    deadline: '',
    status: 'active',
    other_details: '',
    attachment_name: null,
    attachment_url: null
  });

  const [attachmentFile, setAttachmentFile] = useState(null);

  // Auto-resize textareas based on content length to prevent scrollbars
  const responsibilitiesRef = useRef(null);
  const benefitsRef = useRef(null);
  const otherDetailsRef = useRef(null);

  useEffect(() => {
    const adjustHeight = (ref) => {
      if (ref.current) {
        ref.current.style.height = 'auto';
        ref.current.style.height = `${ref.current.scrollHeight}px`;
      }
    };
    adjustHeight(responsibilitiesRef);
    adjustHeight(benefitsRef);
    adjustHeight(otherDetailsRef);
  }, [newJob.responsibilities, newJob.benefits, newJob.other_details]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const openingsRes = await api.get('/recruitment/openings');
      setOpenings(openingsRes.data);
      
      const candidatesRes = await api.get('/recruitment/candidates');
      setCandidates(candidatesRes.data);

      const stagesRes = await api.get('/recruitment/pipeline-stages');
      let stages = stagesRes.data;
      if (!stages || stages.length === 0) {
        await api.post('/recruitment/pipeline-stages', { stages: DEFAULT_PIPELINE_STAGES });
        stages = DEFAULT_PIPELINE_STAGES;
      }
      setPipelineStages(stages);

      const templatesRes = await api.get('/recruitment/templates');
      setSavedFormTemplates(templatesRes.data || []);

      // Auto-select first job if none selected
      if (openingsRes.data.length > 0) {
        setSelectedJob(prev => {
          if (prev) {
            const found = openingsRes.data.find(o => o.id === prev.id);
            if (found) return found;
          }
          return openingsRes.data[0];
        });
      } else {
        setSelectedJob(null);
      }
    } catch (err) {
      console.error('Error fetching recruitment data:', err);
      toast.error('Failed to load recruitment data from server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Toggle job active state
  const toggleJobStatus = async (id) => {
    const job = openings.find(j => j.id === id);
    if (!job) return;
    try {
      const nextStatus = job.status === 'active' ? 'inactive' : 'active';
      await api.put(`/recruitment/openings/${id}/status`, { status: nextStatus });
      toast.info(`Job status set to ${nextStatus}.`);
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update job status.');
    }
  };



  const handleDeleteCandidate = async (id, name) => {
    if (window.confirm(`Delete application for ${name}?`)) {
      try {
        await api.delete(`/recruitment/candidates/${id}`);
        toast.success(`Application deleted.`);
        if (historyLevel.current > 0) {
          window.history.back();
        } else {
          setSelectedCandidate(null);
        }
        await fetchData();
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete candidate.');
      }
    }
  };

  const handleUpdateStage = async (candId, newStage) => {
    try {
      await api.put(`/recruitment/candidates/${candId}/stage`, { stage: newStage });
      toast.success('Candidate stage updated.');
      
      // Update selected candidate inline if open
      if (selectedCandidate && selectedCandidate.id === candId) {
        setSelectedCandidate(prev => ({ ...prev, current_stage: newStage }));
      }
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update candidate stage.');
    }
  };

  const handleCopyLink = (slug) => {
    const link = `${window.location.origin}/careers/${slug}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(slug);
    toast.success('Career Link copied!');
    setTimeout(() => setCopiedLink(''), 2000);
  };

  const handleTemplateChange = (label) => {
    setActiveTemplateLabel(label);
    if (label === 'Standard Tech Role (Predefined)') {
      setSelectedTemplateId('tpl_tech_standard');
      setSelectedTemplateSource('predefined');
    } else if (label === 'Executive / Senior Leadership (Predefined)') {
      setSelectedTemplateId('tpl_exec_senior');
      setSelectedTemplateSource('predefined');
    } else {
      const cleanName = label.replace(' (Custom)', '');
      const found = savedFormTemplates.find(t => t.name === cleanName);
      if (found) {
        setSelectedTemplateId(found.id);
        setSelectedTemplateSource('custom');
      }
    }
  };

  const handleGenerateJD = async () => {
    if (!aiPrompt) {
      toast.error('Please enter requirements (e.g. "Need React Developer")');
      return;
    }

    setGeneratingJD(true);

    try {
      const res = await api.post('/recruitment/generate-jd', { rolePrompt: aiPrompt });
      const data = res.data;

      setNewJob(prev => ({
        ...prev,
        job_title: data.job_title || '',
        department: data.department || '',
        location: data.location || '',
        experience_required: data.experience_required || '',
        salary_range: data.salary_range || '',
        skills_required: data.skills_required || '',
        responsibilities: data.responsibilities || '',
        benefits: data.benefits || '',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }));

      setShowAiPanel(false);
      toast.success('AI JD generated successfully!');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to generate AI job description.');
    } finally {
      setGeneratingJD(false);
    }
  };

  const handleEditJob = (job) => {
    setEditingJobId(job.id);
    setAttachmentFile(null);
    setNewJob({
      job_title: job.job_title || '',
      department: job.department || '',
      location: job.location || '',
      employment_type: job.employment_type || 'Full-time',
      experience_required: job.experience_required || '',
      salary_range: job.salary_range || '',
      skills_required: job.skills_required || '',
      responsibilities: job.responsibilities || '',
      benefits: job.benefits || '',
      deadline: job.deadline ? job.deadline.split('T')[0] : '',
      status: job.status || 'active',
      other_details: job.other_details || '',
      attachment_name: job.attachment_name || null,
      attachment_url: job.attachment_url || null
    });

    if (job.template_id) {
      setSelectedTemplateId(job.template_id);
      setSelectedTemplateSource(job.template_source || 'predefined');
      if (job.template_id === 'tpl_tech_standard') {
        setActiveTemplateLabel('Standard Tech Role (Predefined)');
      } else if (job.template_id === 'tpl_exec_senior') {
        setActiveTemplateLabel('Executive / Senior Leadership (Predefined)');
      } else {
        const found = savedFormTemplates.find(t => t.id === job.template_id);
        if (found) {
          setActiveTemplateLabel(`${found.name} (Custom)`);
        } else {
          setActiveTemplateLabel('Standard Tech Role (Predefined)');
        }
      }
    } else {
      setSelectedTemplateId('tpl_tech_standard');
      setSelectedTemplateSource('predefined');
      setActiveTemplateLabel('Standard Tech Role (Predefined)');
    }
    setActiveTab('create');
  };

  const handleSaveJob = async (e) => {
    e.preventDefault();
    if (!newJob.job_title || !newJob.department || !newJob.skills_required || !newJob.deadline || !newJob.location) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      let formConfig = PREDEFINED_FORM_TEMPLATES[0].fields;
      if (selectedTemplateId === 'tpl_exec_senior') {
        formConfig = PREDEFINED_FORM_TEMPLATES[1].fields;
      } else if (selectedTemplateSource === 'custom' || selectedTemplateSource === 'db') {
        const found = savedFormTemplates.find(t => t.id === selectedTemplateId);
        if (found && found.fields) {
          formConfig = found.fields;
        }
      }

      const formDataPayload = new FormData();
      Object.keys(newJob).forEach(key => {
        if (newJob[key] !== null && newJob[key] !== undefined) {
          formDataPayload.append(key, newJob[key]);
        }
      });
      formDataPayload.append('form_config', JSON.stringify(formConfig));
      formDataPayload.append('template_id', selectedTemplateId || '');
      formDataPayload.append('template_source', selectedTemplateSource || 'scratch');

      if (attachmentFile) {
        formDataPayload.append('attachment', attachmentFile);
      }

      if (editingJobId) {
        await api.put(`/recruitment/openings/${editingJobId}`, formDataPayload, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success(`Job description updated successfully!`);
      } else {
        await api.post('/recruitment/openings', formDataPayload, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success(`Job published successfully!`);
      }

      setNewJob({ job_title: '', department: '', location: '', employment_type: 'Full-time', experience_required: '', salary_range: '', skills_required: '', responsibilities: '', benefits: '', deadline: '', status: 'active', other_details: '', attachment_name: null, attachment_url: null });
      setAttachmentFile(null);
      setEditingJobId(null);
      setSelectedTemplateId('tpl_tech_standard');
      setSelectedTemplateSource('predefined');
      setActiveTemplateLabel('Standard Tech Role (Predefined)');
      await fetchData();
      setActiveTab('openings');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save job opening.');
    }
  };

  // Filters candidates
  const filteredCandidates = candidates
    .filter(c => selectedJob && c.job_id === selectedJob.id)
    .filter(c => {
      if (selectedStageFilter === 'All') return true;
      return c.current_stage?.toLowerCase() === selectedStageFilter.toLowerCase();
    })
    .filter(c => c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || (c.extracted_skills || []).some(s => s.toLowerCase().includes(searchQuery.toLowerCase())));

  const filteredOpenings = openings.filter(o => 
    o.job_title.toLowerCase().includes(jobSearchQuery.toLowerCase()) || 
    o.department.toLowerCase().includes(jobSearchQuery.toLowerCase())
  );

  const getStageBadgeColor = (stageName) => {
    const stage = pipelineStages.find(s => s.name.toLowerCase() === stageName?.toLowerCase());
    switch (stage?.color) {
      case 'blue': return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'indigo': return 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800';
      case 'violet': return 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400 border-violet-200 dark:border-violet-800';
      case 'purple': return 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      case 'pink': return 'bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400 border-pink-200 dark:border-pink-800';
      case 'emerald': return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'rose': return 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 border-rose-200 dark:border-rose-800';
      case 'amber': return 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'teal': return 'bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400 border-teal-200 dark:border-teal-800';
      default: return 'bg-slate-50 text-slate-600 dark:bg-slate-900/20 dark:text-slate-400 border-slate-200 dark:border-slate-800';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/20';
    if (score >= 60) return 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-500/20';
    if (score >= 40) return 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-500/20';
    return 'text-rose-600 bg-rose-50 dark:bg-rose-950/20 border-rose-500/20';
  };

  const sidebarCandidates = candidates
    .filter(c => selectedJobForSidebar && c.job_id === selectedJobForSidebar.id)
    .filter(c => {
      if (selectedStageFilter === 'All') return true;
      const stageName = c.stage || c.current_stage || 'Applied';
      return stageName.toLowerCase() === selectedStageFilter.toLowerCase();
    })
    .filter(c => c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || (c.extracted_skills || []).some(s => s.toLowerCase().includes(searchQuery.toLowerCase())));

  return (
    <MobileDashboardLayout title="Recruitment">


      <div className="px-4 pb-20 min-h-screen bg-slate-50 dark:bg-black transition-colors pt-2">
        {/* --- OPENINGS TAB --- */}
        {activeTab === 'openings' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
            {/* Create New Opening Button */}
            <button
              onClick={() => {
                setEditingJobId(null);
                setNewJob({ job_title: '', department: '', location: '', employment_type: 'Full-time', experience_required: '', salary_range: '', skills_required: '', responsibilities: '', benefits: '', deadline: '', status: 'active' });
                setSelectedTemplateId('tpl_tech_standard');
                setSelectedTemplateSource('predefined');
                setActiveTemplateLabel('Standard Tech Role (Predefined)');
                setActiveTab('create');
              }}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-600/10 active:scale-[0.98] transition-all"
            >
              <Plus size={16} />
              <span>Create New Opening</span>
            </button>

            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search size={15} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search openings by title/department..."
                value={jobSearchQuery}
                onChange={(e) => setJobSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-dark-card border border-slate-200 dark:border-github-dark-border rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-github-dark-text shadow-sm"
              />
            </div>

            {/* List */}
            <div className="space-y-3">
              {filteredOpenings.length > 0 ? (
                filteredOpenings.map(job => (
                  <div 
                    key={job.id} 
                    onClick={() => {
                      setSelectedJobForSidebar(job);
                      setSelectedCandidate(null);
                      historyLevel.current = 1;
                      window.history.pushState({ view: 'applicants', jobId: job.id }, '');
                    }}
                    className="p-4 bg-white dark:bg-dark-card rounded-2xl border border-slate-100 dark:border-github-dark-border hover:border-indigo-500 cursor-pointer shadow-sm space-y-3 transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-800 dark:text-github-dark-text text-sm">{job.job_title}</h4>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[9px] font-bold font-mono">{job.department}</span>
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[9px] font-bold font-mono">{job.location}</span>
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[9px] font-bold font-mono">{job.employment_type}</span>
                        </div>
                      </div>
                      
                      {/* Status switch */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleJobStatus(job.id);
                        }}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${job.status === 'active' ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${job.status === 'active' ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800/60 pt-2.5 font-mono">
                      <span>Deadline: {job.deadline ? formatDate(job.deadline) : 'N/A'}</span>
                      <div className="flex items-center gap-1">
                        <Users size={12} />
                        <span>{candidates.filter(c => c.job_id === job.id).length} candidates</span>
                      </div>
                    </div>

                    {/* Actions row */}
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-50 dark:border-slate-800/40 mt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyLink(job.slug);
                        }}
                        className="p-2 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl text-slate-400 transition-colors"
                        title="Copy Application Link"
                      >
                        {copiedLink === job.slug ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditJob(job);
                        }}
                        className="p-2 bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl text-slate-400 transition-colors"
                        title="Edit Job"
                      >
                        <Edit3 size={14} />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedJobForSidebar(job);
                          setSelectedCandidate(null);
                          historyLevel.current = 1;
                          window.history.pushState({ view: 'applicants', jobId: job.id }, '');
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-xl text-[10px] font-bold ml-1 transition-all"
                      >
                        View candidates <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 italic">No job openings found matching your search.</div>
              )}
            </div>
          </div>
        )}

        {/* --- CREATE / EDIT JOB TAB --- */}
        {activeTab === 'create' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-github-dark-border rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-slate-800 dark:text-github-dark-text text-sm flex items-center gap-2">
                  <Briefcase size={16} className="text-indigo-500" />
                  {editingJobId ? 'Edit Job Opening' : 'Publish New Job Opening'}
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setEditingJobId(null);
                    setNewJob({ job_title: '', department: '', location: '', employment_type: 'Full-time', experience_required: '', salary_range: '', skills_required: '', responsibilities: '', benefits: '', deadline: '', status: 'active' });
                    setActiveTab('openings');
                  }}
                  className="px-2.5 py-1 text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-github-dark-border dark:text-github-dark-text rounded-lg transition-all"
                >
                  Cancel
                </button>
              </div>

              {/* AI JD Generator Collapsible Assistant */}
              <div className="border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/20 dark:bg-indigo-950/10 rounded-2xl p-4 mb-4">
                <button
                  type="button"
                  onClick={() => setShowAiPanel(!showAiPanel)}
                  className="w-full flex items-center justify-between font-bold text-slate-800 dark:text-github-dark-text text-xs leading-none"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={14} className="text-indigo-500 animate-pulse" />
                    AI Description Assistant
                  </span>
                  <span className="text-[10px] text-indigo-500 font-bold">{showAiPanel ? 'Hide Panel' : 'Generate with AI ✨'}</span>
                </button>
                
                {showAiPanel && (
                  <div className="mt-3.5 space-y-3 animate-in fade-in duration-200">
                    <p className="text-[10px] text-slate-400 leading-relaxed">Type your core hiring requirements and click generate to automatically compile standard JDs, experiences, and skills tags.</p>
                    <textarea
                      rows="2"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs focus:border-indigo-500 text-slate-700 dark:text-white"
                      placeholder="e.g. Need Node.js Developer, 3 years exp, MySQL..."
                    />
                    {generatingJD ? (
                      <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-2.5 border border-dashed border-indigo-100 dark:border-indigo-900/30 rounded-xl text-center flex items-center justify-center gap-2 animate-pulse text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                        <Sparkles size={14} className="animate-spin" />
                        AI assembling job description...
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleGenerateJD}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold flex justify-center items-center gap-1.5 shadow-sm transition-all"
                      >
                        <Sparkles size={13} />
                        Auto-Generate JD
                      </button>
                    )}
                  </div>
                )}
              </div>

              <form onSubmit={handleSaveJob} className="space-y-4 text-xs font-medium">
                
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-1">Job Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Frontend Engineer"
                    value={newJob.job_title}
                    onChange={(e) => setNewJob({ ...newJob, job_title: e.target.value })}
                    className="w-full h-11 px-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all font-semibold"
                  />
                </div>

                {/* Department */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-1">Department *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Engineering"
                    value={newJob.department}
                    onChange={(e) => setNewJob({ ...newJob, department: e.target.value })}
                    className="w-full h-11 px-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all font-semibold"
                  />
                </div>

                {/* Location */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-1">Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chennai / Remote"
                    value={newJob.location}
                    onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                    className="w-full h-11 px-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all font-semibold"
                  />
                </div>

                {/* Employment Type */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-1">Employment Type *</label>
                  <MobileSelect
                    value={newJob.employment_type}
                    options={['Full-time', 'Part-time', 'Contract', 'Internship']}
                    onChange={(val) => setNewJob({ ...newJob, employment_type: val })}
                  />
                </div>

                {/* Application Form Template Selector */}
                <div className="space-y-1 bg-slate-50/50 dark:bg-black/40 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-1 block mb-1">
                    Candidate Application Form Template *
                  </label>
                  <MobileSelect
                    value={activeTemplateLabel}
                    options={[
                      'Standard Tech Role (Predefined)',
                      'Executive / Senior Leadership (Predefined)',
                      ...savedFormTemplates.map(t => `${t.name} (Custom)`)
                    ]}
                    onChange={handleTemplateChange}
                  />
                  <p className="text-[9px] text-slate-400 leading-normal mt-1.5 px-1">
                    Choose what fields (experience, LinkedIn, notice period, CTC, custom fields) candidates will fill on the careers page. Custom templates can be created inside the Desktop view form designer.
                  </p>
                </div>

                {/* Experience & Salary row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-1">Experience *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2+ Years"
                      value={newJob.experience_required}
                      onChange={(e) => setNewJob({ ...newJob, experience_required: e.target.value })}
                      className="w-full h-11 px-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-all font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-1">Salary Range</label>
                    <input
                      type="text"
                      placeholder="e.g. ₹8 - ₹12 LPA"
                      value={newJob.salary_range}
                      onChange={(e) => setNewJob({ ...newJob, salary_range: e.target.value })}
                      className="w-full h-11 px-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-all font-semibold"
                    />
                  </div>
                </div>

                {/* Skills Required */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-1">Skills (comma separated) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. React, TailwindCSS, Node.js"
                    value={newJob.skills_required}
                    onChange={(e) => setNewJob({ ...newJob, skills_required: e.target.value })}
                    className="w-full h-11 px-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-all font-semibold"
                  />
                </div>

                {/* Responsibilities */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-1">Responsibilities</label>
                  <textarea
                    ref={responsibilitiesRef}
                    rows="1"
                    placeholder="Describe job responsibilities..."
                    value={newJob.responsibilities}
                    onChange={(e) => setNewJob({ ...newJob, responsibilities: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-black text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 rounded-2xl p-4 outline-none resize-none overflow-hidden min-h-[80px] focus:border-indigo-500 transition-all font-semibold"
                  />
                </div>

                {/* Benefits */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-1">Benefits</label>
                  <textarea
                    ref={benefitsRef}
                    rows="1"
                    placeholder="Describe benefits & work environment..."
                    value={newJob.benefits}
                    onChange={(e) => setNewJob({ ...newJob, benefits: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-black text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 rounded-2xl p-4 outline-none resize-none overflow-hidden min-h-[80px] focus:border-indigo-500 transition-all font-semibold"
                  />
                </div>

                {/* Other Details */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-1">Other Details</label>
                  <textarea
                    ref={otherDetailsRef}
                    rows="1"
                    placeholder="Enter other details, instructions, or notes for this opening..."
                    value={newJob.other_details || ''}
                    onChange={(e) => setNewJob({ ...newJob, other_details: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-black text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 rounded-2xl p-4 outline-none resize-none overflow-hidden min-h-[80px] focus:border-indigo-500 transition-all font-semibold"
                  />
                </div>

                {/* Attachment */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-1">Attachment (Optional)</label>
                  <div className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <input
                      type="file"
                      id="mobile-opening-attachment"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setAttachmentFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="mobile-opening-attachment"
                      className="flex items-center justify-center gap-2 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                    >
                      <Upload size={14} />
                      {attachmentFile ? 'Change File' : 'Upload File Attachment'}
                    </label>
                    {attachmentFile ? (
                      <div className="flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-900/60 px-2.5 py-1 rounded-xl">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                          <FileText size={12} />
                          {attachmentFile.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAttachmentFile(null);
                            const inputEl = document.getElementById('mobile-opening-attachment');
                            if (inputEl) inputEl.value = '';
                          }}
                          className="text-rose-500 hover:text-rose-700 p-0.5"
                          title="Remove uploaded file"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : newJob.attachment_name ? (
                      <div className="flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-900/60 px-2.5 py-1 rounded-xl">
                        <a
                          href={`/api/recruitment/openings-attachments/${newJob.attachment_url.split('/').pop()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
                        >
                          <FileText size={12} />
                          {newJob.attachment_name} (Current)
                        </a>
                        <button
                          type="button"
                          onClick={() => setNewJob({ ...newJob, attachment_name: null, attachment_url: null })}
                          className="text-rose-500 hover:text-rose-700 p-0.5"
                          title="Delete current attachment"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 text-center">No file attached</span>
                    )}
                  </div>
                </div>

                {/* Deadline */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-1">Deadline *</label>
                  <input
                    type="date"
                    required
                    value={newJob.deadline}
                    onChange={(e) => setNewJob({ ...newJob, deadline: e.target.value })}
                    className="w-full h-11 px-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-all font-semibold"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 dark:shadow-none transition-all active:scale-[0.98] mt-3"
                >
                  {editingJobId ? 'Update Opening Details' : 'Publish Opening Details'}
                </button>
              </form>
            </div>
          </div>
        )}
         {/* --- UNIFIED CANDIDATES / DETAILS BOTTOM SHEET DRAWER --- */}
      {(selectedJobForSidebar || selectedCandidate) && (
        <div className="fixed inset-0 z-[600] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => {
            if (historyLevel.current > 0) {
              window.history.go(-historyLevel.current);
            } else {
              setSelectedJobForSidebar(null);
              setSelectedCandidate(null);
            }
          }}></div>
          <div className="relative z-10 w-full bg-white dark:bg-[#0c0d0f] rounded-t-[2.5rem] p-6 animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto pb-[env(safe-area-inset-bottom)] border-t border-slate-200 dark:border-slate-800 flex flex-col">
            
            <div className="flex justify-center mb-4 shrink-0">
              <span className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full"></span>
            </div>

            {/* --- CASE A: Candidates List Bottom Sheet --- */}
            {selectedJobForSidebar && !selectedCandidate && (
              <div className="space-y-4 flex flex-col h-full">
                <div className="flex justify-between items-start shrink-0">
                  <div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                      <Briefcase size={18} className="text-indigo-500" />
                      Applicants: {selectedJobForSidebar.job_title}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                      {selectedJobForSidebar.department} &bull; {selectedJobForSidebar.location}
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      if (historyLevel.current > 0) {
                        window.history.go(-historyLevel.current);
                      } else {
                        setSelectedJobForSidebar(null);
                      }
                    }}
                    className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Stage horizontal filters */}
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1 select-none shrink-0">
                  {['All', ...pipelineStages.map(s => s.name)].map(stage => {
                    const count = stage === 'All' 
                      ? candidates.filter(c => c.job_id === selectedJobForSidebar.id).length
                      : candidates.filter(c => c.job_id === selectedJobForSidebar.id && (c.stage || c.current_stage || 'Applied').toLowerCase() === stage.toLowerCase()).length;
                    const isSelected = selectedStageFilter.toLowerCase() === stage.toLowerCase();
                    return (
                      <button
                        key={stage}
                        onClick={() => setSelectedStageFilter(stage)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap border transition-all flex items-center gap-1.5
                          ${isSelected 
                            ? 'bg-indigo-600 text-white border-transparent' 
                            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300'}`}
                      >
                        <span>{stage}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${isSelected ? 'bg-indigo-800 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Search query input */}
                <div className="relative shrink-0">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search size={15} className="text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search candidate by name, skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-github-dark-text shadow-sm"
                  />
                </div>

                {/* Candidates list */}
                <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                  {sidebarCandidates.length > 0 ? (
                    sidebarCandidates.map(cand => (
                      <div
                        key={cand.id}
                        onClick={() => {
                          setSelectedCandidate(cand);
                          historyLevel.current = 2;
                          window.history.pushState({ view: 'candidate-details', candidateId: cand.id, jobId: selectedJobForSidebar?.id }, '');
                        }}
                        className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-100 dark:border-transparent shadow-sm flex items-center justify-between gap-3 active:scale-[0.98] transition-all cursor-pointer group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-xs shrink-0">
                          {cand.full_name?.charAt(0).toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <h5 className="font-bold text-slate-800 dark:text-github-dark-text text-[12px] truncate leading-tight group-hover:text-indigo-600 transition-colors">
                            {cand.full_name}
                          </h5>
                          <div className="flex flex-wrap items-center gap-1.5 text-[9px] text-slate-400 font-mono">
                            <span>Exp: {cand.total_experience || cand.experience_years || 'N/A'}</span>
                            <span>•</span>
                            <span className={`px-1.5 py-0.2 rounded border uppercase font-sans font-bold text-[8px] ${getStageBadgeColor(cand.stage || cand.current_stage)}`}>
                              {cand.stage || cand.current_stage || 'Applied'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className={`px-2 py-1.5 border rounded-xl flex flex-col items-center justify-center shrink-0 ${getScoreColor(cand.ai_score)}`}>
                            <span className="text-xs font-black leading-none">{cand.ai_score || '0'}</span>
                            <span className="text-[7px] uppercase font-bold tracking-wider mt-0.5 leading-none opacity-80">Match</span>
                          </div>
                          <ChevronRight size={14} className="text-slate-300" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-slate-400 italic">No candidates match your selection.</div>
                  )}
                </div>
              </div>
            )}

            {/* --- CASE B: Candidate In-Depth Details --- */}
            {selectedCandidate && (
              <div className="space-y-5">
                <div className="flex justify-between items-start shrink-0">
                  <div className="min-w-0">
                    {selectedJobForSidebar && (
                      <button
                        onClick={() => {
                          window.history.back();
                        }}
                        className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mb-2 active:underline"
                      >
                        <ArrowRight className="rotate-180" size={12} /> Back to Applicants List
                      </button>
                    )}
                    <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{selectedCandidate.full_name}</h4>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                      {selectedCandidate.ai_recommendation || 'Candidate Profile'}
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      if (historyLevel.current > 0) {
                        window.history.go(-historyLevel.current);
                      } else {
                        setSelectedJobForSidebar(null);
                        setSelectedCandidate(null);
                      }
                    }}
                    className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Quick Contact Row */}
                <div className="flex items-center gap-2 pb-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                  <a 
                    href={`tel:${selectedCandidate.mobile || selectedCandidate.phone}`} 
                    className="flex-1 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl flex items-center justify-center gap-2 text-slate-700 dark:text-slate-200 font-bold active:scale-[0.98] transition-all text-[11px]"
                  >
                    <PhoneCall size={14} className="text-indigo-500" />
                    Call Candidate
                  </a>
                  <a 
                    href={`mailto:${selectedCandidate.email}`} 
                    className="flex-1 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl flex items-center justify-center gap-2 text-slate-700 dark:text-slate-200 font-bold active:scale-[0.98] transition-all text-[11px]"
                  >
                    <Mail size={14} className="text-indigo-500" />
                    Send Email
                  </a>
                </div>

                {/* Stage management */}
                <div className="space-y-1 bg-slate-50 dark:bg-[#0c0d0f] border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shrink-0">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-1">Current Pipeline Stage</span>
                  <MobileSelect
                    value={selectedCandidate.stage || selectedCandidate.current_stage || 'Applied'}
                    options={pipelineStages.map(s => s.name)}
                    onChange={(val) => {
                      handleUpdateStage(selectedCandidate.id, val);
                      setSelectedCandidate(prev => ({ ...prev, stage: val, current_stage: val }));
                    }}
                  />
                </div>

                {/* AI assessment cards */}
                <div className="space-y-3">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles size={13} className="text-indigo-500" />
                    Candidate Audit Report
                  </h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-[#0c0d0f] rounded-2xl border border-slate-200 dark:border-slate-800/80">
                      <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Skill Match</span>
                      <p className="text-base font-black text-slate-800 dark:text-[#f0f6fc] mt-1">{selectedCandidate.skill_match_score || '0'}%</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-[#0c0d0f] rounded-2xl border border-slate-200 dark:border-slate-800/80">
                      <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Experience Fit</span>
                      <p className="text-base font-black text-slate-800 dark:text-[#f0f6fc] mt-1">{selectedCandidate.experience_match_score || '0'}%</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-[#0c0d0f] rounded-2xl border border-slate-200 dark:border-slate-800/80">
                      <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Education Alignment</span>
                      <p className="text-base font-black text-slate-800 dark:text-[#f0f6fc] mt-1">{selectedCandidate.education_match_score || '0'}%</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-[#0c0d0f] rounded-2xl border border-slate-200 dark:border-slate-800/80">
                      <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Culture Fit</span>
                      <p className="text-base font-black text-slate-800 dark:text-[#f0f6fc] mt-1">{selectedCandidate.culture_fit_score || '0'}%</p>
                    </div>
                  </div>

                  {/* Strengths & Weaknesses lists */}
                  <div className="space-y-3">
                    {Array.isArray(selectedCandidate.ai_strengths) && selectedCandidate.ai_strengths.length > 0 && (
                      <div className="p-4 bg-emerald-50/20 dark:bg-emerald-950/5 border border-emerald-100 dark:border-emerald-900/20 rounded-2xl">
                        <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider block mb-1">Key Strengths</span>
                        <ul className="list-disc pl-4 text-[10px] space-y-1 text-slate-600 dark:text-slate-300">
                          {selectedCandidate.ai_strengths.map((s, idx) => <li key={idx}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                    {Array.isArray(selectedCandidate.ai_weaknesses) && selectedCandidate.ai_weaknesses.length > 0 && (
                      <div className="p-4 bg-rose-50/20 dark:bg-rose-950/5 border border-rose-100 dark:border-rose-900/20 rounded-2xl">
                        <span className="text-[9px] font-black uppercase text-rose-600 dark:text-rose-400 tracking-wider block mb-1">Areas for Development</span>
                        <ul className="list-disc pl-4 text-[10px] space-y-1 text-slate-600 dark:text-[#c9d1d9]">
                          {selectedCandidate.ai_weaknesses.map((w, idx) => <li key={idx}>{w}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Profile Details */}
                <div className="space-y-4 border-t border-slate-100 dark:border-slate-800/60 pt-4 text-xs">
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Education</span>
                    <p className="font-semibold text-slate-800 dark:text-[#f0f6fc]">{selectedCandidate.education || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Current Company &amp; CTC</span>
                    <p className="font-semibold text-slate-800 dark:text-[#f0f6fc]">
                      {(selectedCandidate.current_company || 'N/A') + ' • ' + (selectedCandidate.current_ctc || 'N/A')}
                    </p>
                  </div>
                  {Array.isArray(selectedCandidate.extracted_skills) && selectedCandidate.extracted_skills.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">Extracted Skills</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedCandidate.extracted_skills.map((skill, idx) => (
                          <span 
                            key={idx} 
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold border border-slate-200/40 dark:border-slate-800/50 font-mono"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Form responses detail list */}
                  {selectedCandidate.form_responses && Object.keys(selectedCandidate.form_responses).length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">All Form Submissions</span>
                      <div className="space-y-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl">
                        {Object.entries(selectedCandidate.form_responses).map(([label, val]) => {
                          if (
                            ['resume_name', 'resume_url'].includes(label) ||
                            val === null || val === undefined || val === ''
                          ) return null;
                          const displayVal = Array.isArray(val) ? val.join(', ') : String(val);
                          return (
                            <div key={label} className="text-[11px] leading-relaxed">
                              <span className="font-bold text-slate-400 dark:text-slate-500 block">{label}</span>
                              <span className="font-semibold text-slate-800 dark:text-[#c9d1d9]">{displayVal}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* PDF Resume */}
                {selectedCandidate.resume_path && (
                  <div className="space-y-2">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">Uploaded Resume</span>
                    <a
                      href={`${api.defaults.baseURL || ''}/recruitment/resumes/${selectedCandidate.resume_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl flex items-center justify-center gap-2 font-bold active:scale-[0.98] transition-all text-xs shadow-md shadow-indigo-500/20 text-center"
                    >
                      <FileText size={15} />
                      Open Resume PDF in New Tab
                      <ExternalLink size={13} />
                    </a>
                    <iframe
                      src={`${api.defaults.baseURL || ''}/recruitment/resumes/${selectedCandidate.resume_path}`}
                      className="w-full h-[350px] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-inner bg-slate-50 dark:bg-slate-900"
                      title={`${selectedCandidate.full_name} Resume`}
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleDeleteCandidate(selectedCandidate.id, selectedCandidate.full_name)}
                    className="w-full py-3.5 bg-rose-50 dark:bg-rose-950/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-center justify-center gap-2 font-semibold text-xs transition-colors active:bg-rose-100"
                  >
                    <Trash2 size={15} />
                    Delete Candidate Application
                  </button>
                  {selectedJobForSidebar ? (
                    <button
                      onClick={() => {
                        window.history.back();
                      }}
                      className="w-full py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-bold flex items-center justify-center gap-1.5 text-xs"
                    >
                      Back to Applicants List
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (historyLevel.current > 0) {
                          window.history.go(-historyLevel.current);
                        } else {
                          setSelectedJobForSidebar(null);
                          setSelectedCandidate(null);
                        }
                      }}
                      className="w-full py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-bold flex items-center justify-center gap-1.5 text-xs"
                    >
                      Close Details Drawer
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  </MobileDashboardLayout>
);
};

export default RecruitmentDashboardMobile;
