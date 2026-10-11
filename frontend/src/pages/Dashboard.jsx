import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, onServerWaking, pingServerHealth } from '../services/api';
import Sidebar from '../components/Sidebar';
import { 
  FileText, Upload, CheckCircle, XCircle, TrendingUp, AlertCircle, 
  Check, Trash2, BookOpen, Briefcase, User, FileCode, Award, 
  Sparkles, Download, Menu, ArrowRight, RefreshCw, Eye, 
  ExternalLink, Layers, ShieldAlert, KeyRound, HelpCircle, AlertTriangle
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, 
  XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid
} from 'recharts';
import jsPDF from 'jspdf';

const SAMPLE_JDS = {
  "Full-Stack Developer": `We are seeking an experienced Full-Stack Developer to join our growing engineering team. In this role, you will design, develop, and maintain high-performance web applications using modern JavaScript/TypeScript ecosystems. Responsibilities include building responsive user interfaces with React and Tailwind CSS, architecting scalable backend microservices using Node.js and Python FastAPI, and managing relational databases with PostgreSQL. You will collaborate with cross-functional teams to integrate REST APIs and GraphQL endpoints, implement automated CI/CD pipelines, containerize services using Docker, and deploy cloud infrastructure on AWS. Strong experience with Git version control, unit testing, and agile methodologies is required. A degree in Computer Science or equivalent practical industry experience is preferred.`,
  "Backend Developer": `We are looking for a Senior Backend Developer to architect and optimize our high-throughput cloud services. You will design robust RESTful APIs and asynchronous messaging pipelines using Python, FastAPI, and Node.js. Requirements include deep knowledge of SQL, PostgreSQL query optimization, Redis caching strategies, and database indexing. You will containerize applications with Docker, orchestrate microservices on Kubernetes, and manage cloud infrastructure using AWS and Terraform. Candidates must demonstrate proficiency with Git version control, secure authentication protocols (OAuth/JWT), unit testing frameworks, and system performance monitoring. Minimum 3 years of backend engineering experience required.`,
  "Data Analyst": `Our analytics department is hiring a Data Analyst to interpret large-scale customer datasets and deliver business intelligence insights. You will write complex SQL queries to extract data from PostgreSQL and data warehouses, clean and preprocess data using Python and Pandas, and build interactive dashboards using Power BI and Tableau. Key responsibilities include statistical analysis, hypothesis testing, identifying key performance indicators (KPIs), and presenting quantitative findings to executive stakeholders. Proficiency with Excel modeling, data visualization with Matplotlib and Seaborn, and automated ETL pipelines is essential. Prior experience in business analytics or statistics is highly desirable.`,
  "Machine Learning Engineer": `We are searching for an innovative Machine Learning Engineer to develop, train, and deploy production ML models. Responsibilities include preprocessing unstructured datasets, building deep learning architectures using PyTorch and TensorFlow, and implementing natural language processing (NLP) pipelines using spaCy and Hugging Face transformers. You will evaluate model performance using Scikit-learn, package inference APIs with Docker and FastAPI, and manage end-to-end ML lifecycles using MLflow and AWS. Strong programming skills in Python, Git, and cloud computing environments are mandatory. An advanced degree in Computer Science, Data Science, or related quantitative field is preferred.`
};

const TARGET_ROLES = [
  "Full-Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Data Analyst",
  "Machine Learning Engineer",
  "DevOps / Cloud Engineer",
  "Mobile App Developer"
];

const checkRoleMismatch = (title, text) => {
  if (!title || !text) return null;
  const t = title.trim().toLowerCase();
  const d = text.trim().toLowerCase();
  if (d.split(/\s+/).filter(Boolean).length < 25) return null;

  const roleProfiles = [
    {
      name: 'Data Analyst',
      titleKeys: ['data analyst', 'business analyst', 'bi analyst', 'analytics', 'data analysis'],
      jdKeys: ['power bi', 'tableau', 'sql queries', 'etl', 'business intelligence', 'pandas', 'excel modeling', 'kpi']
    },
    {
      name: 'Machine Learning Engineer',
      titleKeys: ['machine learning', 'ml engineer', 'deep learning', 'data scientist', 'ai engineer'],
      jdKeys: ['pytorch', 'tensorflow', 'deep learning', 'machine learning', 'nlp pipelines', 'model evaluation', 'hugging face', 'mlflow']
    },
    {
      name: 'Frontend Developer',
      titleKeys: ['frontend', 'front-end', 'ui engineer', 'ui developer', 'web designer'],
      jdKeys: ['react', 'tailwind css', 'ui/ux', 'frontend', 'html', 'css', 'responsive user interfaces', 'next.js']
    },
    {
      name: 'Backend Developer',
      titleKeys: ['backend', 'back-end', 'api engineer'],
      jdKeys: ['backend', 'fastapi', 'microservices', 'redis caching', 'postgresql query', 'database indexing', 'throughput cloud']
    },
    {
      name: 'DevOps / Cloud Engineer',
      titleKeys: ['devops', 'cloud engineer', 'sre', 'infrastructure'],
      jdKeys: ['kubernetes', 'docker', 'ci/cd', 'terraform', 'aws infrastructure', 'devops', 'cloud computing']
    },
    {
      name: 'Mobile App Developer',
      titleKeys: ['mobile', 'android', 'ios', 'flutter', 'react native', 'swift', 'kotlin'],
      jdKeys: ['react native', 'flutter', 'swift', 'kotlin', 'ios', 'android', 'mobile ui', 'app store']
    }
  ];

  const matchedTitleProfile = roleProfiles.find(p => p.titleKeys.some(k => t.includes(k)));
  if (!matchedTitleProfile) return null;

  let bestJdProfile = null;
  let maxCount = 0;
  for (const p of roleProfiles) {
    const count = p.jdKeys.filter(k => d.includes(k)).length;
    if (count >= 2 && count > maxCount) {
      maxCount = count;
      bestJdProfile = p;
    }
  }

  if (bestJdProfile && bestJdProfile.name !== matchedTitleProfile.name) {
    const titleInJd = matchedTitleProfile.jdKeys.filter(k => d.includes(k)).length;
    if (titleInJd === 0) {
      return {
        typedRole: title,
        detectedRole: bestJdProfile.name,
        message: `The entered job title ("${title}") appears to differ from the provided job description (which emphasizes ${bestJdProfile.name} skills).`
      };
    }
  }
  return null;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Layout & Global State
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [serverWakingMessage, setServerWakingMessage] = useState('');
  const [toasts, setToasts] = useState([]);

  // Data State
  const [currentReport, setCurrentReport] = useState(null);
  const [history, setHistory] = useState([]);
  const [jdMatchesHistory, setJdMatchesHistory] = useState([]);
  const [selectedTargetRole, setSelectedTargetRole] = useState("Full-Stack Developer");

  // Upload Tab State
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [parsedPreview, setParsedPreview] = useState(null); // { filename, text }
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // JD Match Tab State
  const [jdRoleTitle, setJdRoleTitle] = useState('Full-Stack Developer');
  const [jdText, setJdText] = useState('');
  const [jdResults, setJdResults] = useState(null);
  const [jdLoading, setJdLoading] = useState(false);

  // Compare Mode State
  const [compareIds, setCompareIds] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(null); // report id to delete

  // Settings State
  const [newName, setNewName] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [settingsStatus, setSettingsStatus] = useState({ type: '', msg: '' });
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  // Toast Helper
  const addToast = (type, message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Auth Guard & Initial Load
  useEffect(() => {
    const token = localStorage.getItem('hirelens_token');
    const userStr = localStorage.getItem('hirelens_user');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        setCurrentUser(parsed);
        setNewName(parsed.name || '');
      } catch (e) {
        // ignore
      }
    }

    // Subscribe to server cold-start wakeups
    const unsub = onServerWaking((isWaking, msg) => {
      setServerWakingMessage(isWaking ? msg : '');
    });

    pingServerHealth();
    loadUserData();

    return () => unsub();
  }, [navigate]);

  const loadUserData = async () => {
    try {
      const me = await api.getMe();
      if (me) {
        setCurrentUser(me);
        if (me.name) {
          setNewName(me.name);
        }
        localStorage.setItem('hirelens_user', JSON.stringify(me));
      }
    } catch (err) {
      console.warn("Could not fetch user profile:", err);
    }

    try {
      const reports = await api.getHistory();
      setHistory(reports || []);
      if (reports && reports.length > 0 && !currentReport) {
        setCurrentReport(reports[0]);
        if (reports[0].target_role) {
          setSelectedTargetRole(reports[0].target_role);
        }
      }

      const matches = await api.getJdMatches();
      setJdMatchesHistory(matches || []);
    } catch (err) {
      console.error("Error loading user data:", err);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    navigate('/login', { replace: true });
  };

  // --- UPLOAD & PARSE HANDLERS ---
  const handleDrop = (e) => {
    e.preventDefault();
    setUploadError('');
    const f = e.dataTransfer.files[0];
    validateFile(f);
  };

  const handleFileSelect = (e) => {
    setUploadError('');
    const f = e.target.files[0];
    validateFile(f);
  };

  const validateFile = (f) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.pdf') && f.type !== 'application/pdf') {
      setUploadError('Only PDF files are supported. Please upload a valid .pdf file.');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setUploadError('File exceeds 5MB size limit. Please upload a smaller PDF file.');
      return;
    }
    setUploadFile(f);
  };

  const handleUploadAndPreview = async () => {
    if (!uploadFile) return;
    setUploadError('');
    setUploadProgress(10);

    try {
      const data = await api.uploadResume(uploadFile, (pct) => setUploadProgress(pct));
      setUploadProgress(100);
      setParsedPreview(data); // Shows text preview with "Use this resume" confirmation
    } catch (err) {
      setUploadProgress(0);
      setUploadError(err.response?.data?.detail || 'Failed to parse PDF. Please verify it is a text-based PDF.');
    }
  };

  const handleConfirmAnalyze = async () => {
    if (!parsedPreview) return;
    setIsAnalyzing(true);
    try {
      const report = await api.analyzeResume(
        parsedPreview.filename,
        parsedPreview.text,
        selectedTargetRole
      );
      setCurrentReport(report);
      setParsedPreview(null);
      setUploadFile(null);
      setUploadProgress(0);
      addToast('success', 'Resume analyzed successfully!');
      setActiveTab('overview');
      loadUserData();
    } catch (err) {
      addToast('error', err.response?.data?.detail || 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- JD MATCH HANDLER ---
  const handleRunJdMatch = async () => {
    if (!currentReport) {
      addToast('error', 'Please upload or select an active resume first.');
      return;
    }
    const wordCount = jdText.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 50) {
      addToast('error', `Job description must be at least 50 words (currently ${wordCount} words).`);
      return;
    }

    setJdLoading(true);
    setJdResults(null);
    try {
      const resumeText = `${currentReport.skills.join(', ')} ${(currentReport.suggestions || []).map(s => s.suggestion).join('. ')}`;
      const result = await api.analyzeJobDescription(
        resumeText,
        jdText,
        jdRoleTitle,
        currentReport.id
      );
      setJdResults(result);
      if (result.status === 'success') {
        addToast('success', 'Job description analyzed!');
        loadUserData();
      }
    } catch (err) {
      addToast('error', err.response?.data?.detail || 'Failed to match job description.');
    } finally {
      setJdLoading(false);
    }
  };

  const loadSampleJd = (role) => {
    if (SAMPLE_JDS[role]) {
      setJdText(SAMPLE_JDS[role]);
      setJdRoleTitle(role);
      addToast('info', `Loaded sample JD for ${role}.`);
    }
  };

  // --- DELETE & COMPARE HANDLERS ---
  const handleDeleteReport = async (id) => {
    try {
      await api.deleteHistory(id);
      addToast('success', 'Report deleted successfully.');
      setShowDeleteModal(null);
      if (currentReport?.id === id) {
        const remaining = history.filter((r) => r.id !== id);
        setCurrentReport(remaining.length > 0 ? remaining[0] : null);
      }
      loadUserData();
    } catch (err) {
      addToast('error', 'Failed to delete report.');
    }
  };

  const toggleCompare = (id) => {
    if (compareIds.includes(id)) {
      setCompareIds(compareIds.filter((item) => item !== id));
    } else {
      if (compareIds.length >= 2) {
        setCompareIds([compareIds[1], id]);
      } else {
        setCompareIds([...compareIds, id]);
      }
    }
  };

  // --- SETTINGS HANDLERS ---
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSettingsStatus({ type: '', msg: '' });
    if (!newName.trim()) return;

    try {
      const res = await api.updateProfile(newName.trim());
      setCurrentUser(res.user);
      setSettingsStatus({ type: 'success', msg: 'Profile name updated successfully.' });
      addToast('success', 'Profile name updated.');
    } catch (err) {
      setSettingsStatus({ type: 'error', msg: err.response?.data?.detail || 'Failed to update name.' });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSettingsStatus({ type: '', msg: '' });
    if (!oldPassword || newPassword.length < 8) {
      setSettingsStatus({ type: 'error', msg: 'New password must be at least 8 characters long.' });
      return;
    }

    try {
      await api.changePassword(oldPassword, newPassword);
      setOldPassword('');
      setNewPassword('');
      setSettingsStatus({ type: 'success', msg: 'Password changed successfully.' });
      addToast('success', 'Password updated.');
    } catch (err) {
      setSettingsStatus({ type: 'error', msg: err.response?.data?.detail || 'Failed to change password.' });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.deleteAccount();
      navigate('/login', { replace: true });
    } catch (err) {
      addToast('error', 'Failed to delete account.');
    }
  };

  // --- EXPORT PDF HANDLER ---
  const handleExportPDF = () => {
    if (!currentReport) return;
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header Banner
      doc.setFillColor(109, 40, 217); // #6D28D9
      doc.rect(0, 0, pageWidth, 28, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text('HireLens AI - Resume ATS Audit Report', 14, 18);

      // Candidate Summary
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);

      let y = 38;
      doc.text(`Candidate: ${currentReport.name || 'Not detected'}`, 14, y);
      doc.text(`Email: ${currentReport.email || 'Not detected'}`, 110, y);
      y += 6;
      doc.text(`Filename: ${currentReport.filename}`, 14, y);
      doc.text(`Date: ${new Date(currentReport.timestamp || Date.now()).toLocaleDateString()}`, 110, y);

      // Score Box
      y += 12;
      doc.setFillColor(245, 243, 255);
      doc.roundedRect(14, y, pageWidth - 28, 22, 3, 3, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(109, 40, 217);
      doc.text(`Estimated ATS Score: ${currentReport.ats_score}/100`, 20, y + 9);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(`Strength Rating: ${currentReport.strength || 'Good'}  |  Target Role: ${currentReport.target_role || selectedTargetRole}`, 20, y + 16);

      // Breakdown Table
      y += 30;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('5-Factor Diagnostic Breakdown', 14, y);

      y += 6;
      const breakdown = currentReport.score_breakdown || {};
      const factors = [
        ['Completeness & Structure', `${breakdown.completeness || 0}/25`],
        ['Technical Skills Coverage', `${breakdown.skills || 0}/25`],
        ['Contact Details & Profiles', `${breakdown.contact || 0}/15`],
        ['Standard Section Headers', `${breakdown.sections || 0}/20`],
        ['Action Language & Impact', `${breakdown.quality || 0}/15`],
      ];

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      factors.forEach(([label, score]) => {
        y += 6;
        doc.text(label, 16, y);
        doc.text(score, 160, y);
      });

      // Extracted Skills
      y += 12;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`Identified Skills (${(currentReport.skills || []).length})`, 14, y);

      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const skillsStr = (currentReport.skills || []).slice(0, 20).join(', ');
      const splitSkills = doc.splitTextToSize(skillsStr || 'None detected', pageWidth - 32);
      doc.text(splitSkills, 16, y);
      y += splitSkills.length * 5;

      // Prioritized Suggestions
      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Prioritized Action Recommendations', 14, y);

      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      (currentReport.suggestions || []).slice(0, 4).forEach((sug, i) => {
        y += 6;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.text(`${i + 1}. [${sug.priority || 'Medium'}] ${sug.suggestion}`, 16, y);
        y += 4.5;
        doc.setFont('helvetica', 'normal');
        const descLines = doc.splitTextToSize(sug.description, pageWidth - 36);
        doc.text(descLines, 20, y);
        y += (descLines.length - 1) * 4;
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Generated by HireLens AI Resume Analyzer - https://hirelens-ai-resume-analyzer.vercel.app', 14, 290);

      doc.save(`HireLens_Report_${currentReport.filename.replace('.pdf', '')}.pdf`);
      addToast('success', 'PDF report downloaded successfully.');
    } catch (e) {
      console.error(e);
      addToast('error', 'Could not generate PDF report.');
    }
  };

  // Prepare chart data for breakdown
  const breakdownData = currentReport?.score_breakdown ? [
    { name: 'Completeness', value: currentReport.score_breakdown.completeness || 0, max: 25, fill: '#7C3AED' },
    { name: 'Skills Coverage', value: currentReport.score_breakdown.skills || 0, max: 25, fill: '#8B5CF6' },
    { name: 'Contact Info', value: currentReport.score_breakdown.contact || 0, max: 15, fill: '#A78BFA' },
    { name: 'Standard Sections', value: currentReport.score_breakdown.sections || 0, max: 20, fill: '#C4B5FD' },
    { name: 'Language Quality', value: currentReport.score_breakdown.quality || 0, max: 15, fill: '#DDD6FE' },
  ] : [];

  // Prepare improvement prediction chart data
  const currentAts = currentReport?.ats_score || 0;
  const rawImprovement = currentReport?.improvement_prediction;
  let targetScore = rawImprovement?.potential_score;
  if (!targetScore || targetScore <= currentAts) {
    targetScore = Math.min(100, currentAts < 100 ? (currentAts >= 95 ? 100 : currentAts + 7) : 100);
  }
  targetScore = Math.min(100, Math.max(currentAts < 100 ? currentAts + 1 : 100, targetScore));
  const ptsGain = Math.max(0, targetScore - currentAts);

  const improvement = {
    current_score: currentAts,
    potential_score: targetScore,
    gain: ptsGain,
    top_range: currentAts >= 95
  };
  const predictionChartData = [
    { stage: 'Current ATS Score', score: improvement.current_score },
    { stage: 'Predicted Target', score: improvement.potential_score }
  ];

  // Prepare score trend history chart data
  const trendData = [...history]
    .reverse()
    .map((r, idx) => ({
      index: `#${idx + 1}`,
      score: r.ats_score,
      filename: r.filename,
      date: new Date(r.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    }));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex">
      {/* Toast Notification Container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-4 py-3 rounded-2xl shadow-lg border text-xs font-bold flex items-center gap-2.5 transition-all duration-300 animate-slideIn ${
              toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : toast.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-violet-50 text-violet-800 border-purple-200'
            }`}
          >
            {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />}
            {toast.type === 'info' && <Sparkles className="w-4 h-4 text-violet-600 flex-shrink-0" />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Render Free Tier Cold-Start Banner */}
      {serverWakingMessage && (
        <div className="fixed top-0 inset-x-0 z-40 bg-amber-500 text-white text-xs font-bold py-2.5 px-4 text-center shadow-md flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />
          <span>{serverWakingMessage}</span>
        </div>
      )}

      {/* Vertical Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        user={currentUser}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen min-w-0">
        
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-purple-100 px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 capitalize">
                {activeTab === 'overview' && 'Resume ATS Overview'}
                {activeTab === 'upload' && 'Upload Resume'}
                {activeTab === 'ats' && '5-Factor ATS Diagnostics'}
                {activeTab === 'jd' && 'Job Description Matching'}
                {activeTab === 'insights' && 'Actionable Recommendations'}
                {activeTab === 'history' && 'Version History & Comparison'}
                {activeTab === 'settings' && 'Account Settings & Profile'}
              </h1>
              <p className="text-[11px] text-slate-400">
                {currentReport ? `Active: ${currentReport.filename}` : 'No resume loaded'}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentReport && (
              <button
                onClick={handleExportPDF}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-violet-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors"
                title="Download report as PDF"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('upload')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 shadow-sm shadow-violet-500/20 transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>New Upload</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1 max-w-7xl w-full mx-auto space-y-6">

          {/* ======================================================== */}
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {/* ======================================================== */}
          {activeTab === 'overview' && (
            <>
              {!currentReport ? (
                /* Empty state for new user who hasn't uploaded yet */
                <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-purple-100 shadow-sm max-w-2xl mx-auto my-12">
                  <div className="w-16 h-16 rounded-2xl bg-purple-50 text-violet-600 flex items-center justify-center mx-auto mb-6">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">No Resume Analyzed Yet</h2>
                  <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                    Upload your PDF resume to receive a comprehensive ATS compatibility score, skill extraction, and personalized job description matching.
                  </p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white bg-violet-600 hover:bg-violet-700 shadow-md shadow-violet-500/25 transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Resume Now</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Top Stats 3-Card Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    
                    {/* Card 1: Estimated ATS Score with Filled Progress Bar */}
                    <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Estimated ATS Score
                          </span>
                          <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                            currentReport.ats_score >= 80 ? 'bg-emerald-50 text-emerald-700' :
                            currentReport.ats_score >= 60 ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {currentReport.strength || 'Good'}
                          </span>
                        </div>
                        <div className="mt-4 flex items-baseline gap-2">
                          <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                            {currentReport.ats_score}
                          </span>
                          <span className="text-sm font-bold text-slate-400">/ 100</span>
                        </div>
                      </div>

                      <div className="mt-6">
                        {/* Filled Animated Progress Bar */}
                        <div className="w-full h-3 bg-purple-50 rounded-full overflow-hidden p-0.5 border border-purple-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-1000 ease-out"
                            style={{ width: `${Math.min(currentReport.ats_score, 100)}%` }}
                          />
                        </div>
                        <p className="mt-2 text-[10px] text-slate-400 leading-tight">
                          Note: Real ATS algorithms vary across Workday, Taleo, and Greenhouse.
                        </p>
                      </div>
                    </div>

                    {/* Card 2: Technical Skills Coverage */}
                    <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Detected Skills
                          </span>
                          <span className="text-xs font-bold text-violet-600 bg-purple-50 px-2 py-0.5 rounded-full">
                            {selectedTargetRole}
                          </span>
                        </div>
                        <div className="mt-4 flex items-baseline gap-2">
                          <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                            {(currentReport.skills || []).length}
                          </span>
                          <span className="text-sm font-bold text-slate-400">keywords</span>
                        </div>
                      </div>

                      <div className="mt-6">
                        <div className="flex flex-wrap gap-1.5 max-h-14 overflow-hidden">
                          {(currentReport.skills || []).slice(0, 5).map((sk, idx) => (
                            <span key={idx} className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                              {sk}
                            </span>
                          ))}
                          {(currentReport.skills || []).length > 5 && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-purple-50 text-violet-700">
                              +{(currentReport.skills || []).length - 5} more
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => setActiveTab('insights')}
                          className="mt-3 text-xs font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1"
                        >
                          <span>View keyword gap analysis</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Card 3: JD Match Rate (With CTA when N/A) */}
                    <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            JD Match Rate
                          </span>
                          {jdResults ? (
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                              Active JD
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                              Not Analyzed
                            </span>
                          )}
                        </div>

                        <div className="mt-4">
                          {jdResults ? (
                            <div className="flex items-baseline gap-2">
                              <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                                {jdResults.match_percentage}%
                              </span>
                              <span className="text-xs font-bold text-slate-500">compatibility</span>
                            </div>
                          ) : (
                            <div>
                              <span className="text-2xl font-black text-slate-400">N / A</span>
                              <p className="text-xs text-slate-500 mt-1">
                                No job description matched yet.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-6">
                        <button
                          onClick={() => setActiveTab('jd')}
                          className="w-full py-2.5 px-3 rounded-xl font-bold text-xs text-violet-700 bg-purple-50 hover:bg-purple-100 border border-purple-100 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <span>{jdResults ? 'Update JD Comparison' : 'Match Target Job Description'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Middle Charts Grid: 5-Factor Score Breakdown & Prediction */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    
                    {/* Donut / Bar Breakdown with Values & Tooltips */}
                    <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-purple-100 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h2 className="text-base font-bold text-slate-900">Diagnostic Factor Breakdown</h2>
                          <p className="text-xs text-slate-400">Score distribution across standard ATS criteria</p>
                        </div>
                        <button
                          onClick={() => setActiveTab('ats')}
                          className="text-xs font-bold text-violet-600 hover:text-violet-800"
                        >
                          View Details
                        </button>
                      </div>

                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={breakdownData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                            <XAxis type="number" domain={[0, 25]} tick={{ fontSize: 11 }} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, width: 100 }} />
                            <Tooltip
                              formatter={(value, name, props) => [`${value} / ${props.payload.max} pts`, 'Score']}
                              contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                            />
                            <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                              {breakdownData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Resume Improvement Prediction Chart (Fixed dimensions & no cut-off) */}
                    <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-purple-100 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h2 className="text-base font-bold text-slate-900">Improvement Prediction</h2>
                          {improvement.current_score >= 95 ? (
                            <span className="text-xs font-extrabold text-violet-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
                              Already in the top range
                            </span>
                          ) : (
                            <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                              +{improvement.gain} pts gain
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mb-4">
                          Projected score upon resolving high-priority suggestions
                        </p>

                        <div className="h-52 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={predictionChartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                              <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                              <Tooltip
                                formatter={(val) => [`${val} / 100`, 'ATS Score']}
                                contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                              />
                              <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                                <Cell fill="#94A3B8" />
                                <Cell fill="#7C3AED" />
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="pt-2 text-xs text-slate-500 border-t border-slate-100 flex items-center justify-between">
                        <span>Target: {improvement.potential_score}/100</span>
                        <button
                          onClick={() => setActiveTab('insights')}
                          className="font-bold text-violet-600 hover:text-violet-800"
                        >
                          Review Suggestions &rarr;
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Bottom Quick Recommendations Card */}
                  <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-base font-bold text-slate-900">Immediate Action Items</h2>
                        <p className="text-xs text-slate-400">Top recommendations to optimize ATS acceptance</p>
                      </div>
                      <button
                        onClick={() => setActiveTab('insights')}
                        className="text-xs font-bold text-violet-600 hover:text-violet-800"
                      >
                        All Insights
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {(currentReport.suggestions || []).slice(0, 3).map((sug, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            sug.priority === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {sug.priority} Priority
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 mt-2">{sug.suggestion}</h4>
                          <p className="text-[11px] text-slate-500 mt-1 leading-snug line-clamp-2">
                            {sug.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ======================================================== */}
          {/* TAB 2: UPLOAD RESUME */}
          {/* ======================================================== */}
          {activeTab === 'upload' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-10 border border-purple-100 shadow-sm">
                <div className="text-center max-w-md mx-auto mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-violet-600 flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">Upload Your Resume</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Upload your standard PDF resume to run ATS diagnostics and keyword verification.
                  </p>
                </div>

                {/* Target Role Dropdown during Upload */}
                <div className="mb-6 max-w-sm mx-auto">
                  <label htmlFor="target-role-select" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Target Role for Calibration
                  </label>
                  <select
                    id="target-role-select"
                    value={selectedTargetRole}
                    onChange={(e) => setSelectedTargetRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                  >
                    {TARGET_ROLES.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>

                {/* Drag and Drop Box */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-purple-200 hover:border-violet-500 bg-purple-50/30 hover:bg-purple-50/60 rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mx-auto mb-4 text-violet-600">
                    <FileText className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    {uploadFile ? uploadFile.name : 'Click to browse or drag and drop your PDF here'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    PDF only (Max 5MB) • Scanned image PDFs not recommended
                  </p>
                </div>

                {/* Upload Error Banner */}
                {uploadError && (
                  <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Progress Bar */}
                {uploadProgress > 0 && (
                  <div className="mt-6">
                    <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                      <span>Uploading & Extracting...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-600 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Submit button to Parse */}
                {!parsedPreview && (
                  <div className="mt-8 text-center">
                    <button
                      disabled={!uploadFile || uploadProgress > 0}
                      onClick={handleUploadAndPreview}
                      className="px-8 py-3 rounded-2xl font-bold text-sm text-white bg-violet-600 hover:bg-violet-700 active:scale-[0.99] shadow-md shadow-violet-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Extract & Preview Resume
                    </button>
                  </div>
                )}
              </div>

              {/* Parsed Text Preview Modal / Panel with Confirmation */}
              {parsedPreview && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-200 shadow-lg animate-fadeIn">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Extracted Text Preview</h3>
                      <p className="text-xs text-slate-500">
                        File: {parsedPreview.filename} • Confirm text accuracy before calculating ATS score
                      </p>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Ready</span>
                    </span>
                  </div>

                  <div className="my-4 max-h-56 overflow-y-auto p-4 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-700 whitespace-pre-wrap">
                    {parsedPreview.text.slice(0, 1500)}
                    {parsedPreview.text.length > 1500 && '\n\n... [Remaining content loaded for full analysis]'}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => { setParsedPreview(null); setUploadFile(null); setUploadProgress(0); }}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Upload Different File
                    </button>
                    <button
                      onClick={handleConfirmAnalyze}
                      disabled={isAnalyzing}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-violet-600 hover:bg-violet-700 shadow-md shadow-violet-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      {isAnalyzing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Calculating ATS Analytics...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Use This Resume & Run Full Analysis</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: 5-FACTOR ATS DIAGNOSTICS */}
          {/* ======================================================== */}
          {activeTab === 'ats' && (
            <div className="space-y-6">
              {!currentReport ? (
                <div className="text-center py-12 bg-white rounded-3xl border border-purple-100 p-8">
                  <p className="text-sm text-slate-500">Please upload or select a resume to view diagnostics.</p>
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-violet-600 bg-purple-50 px-3 py-1 rounded-full uppercase tracking-wider">
                        Transparent Evaluation
                      </span>
                      <h2 className="text-xl font-black text-slate-900 mt-2">5-Factor ATS Scoring System</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {currentReport.disclaimer || 'Real-world ATS engines vary by employer configurations.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 bg-purple-50/80 px-5 py-3 rounded-2xl border border-purple-100">
                      <div className="text-right">
                        <span className="text-[11px] font-bold text-slate-500 block uppercase">Overall Score</span>
                        <span className="text-2xl font-black text-slate-900">{currentReport.ats_score}/100</span>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-xl ${
                        currentReport.ats_score >= 80 ? 'bg-emerald-500 text-white' : 'bg-violet-600 text-white'
                      }`}>
                        {currentReport.strength || 'Good'}
                      </span>
                    </div>
                  </div>

                  {/* 5 Factors Cards */}
                  <div className="space-y-4">
                    {[
                      { key: 'completeness', name: 'Resume Completeness', max: 25, icon: BookOpen },
                      { key: 'skills', name: 'Skills Coverage', max: 25, icon: Briefcase },
                      { key: 'contact', name: 'Contact Information', max: 15, icon: User },
                      { key: 'sections', name: 'Section Presence', max: 20, icon: Layers },
                      { key: 'quality', name: 'Language Quality', max: 15, icon: Sparkles },
                    ].map((item) => {
                      const factorData = currentReport.factor_details?.[item.key] || {};
                      const score = factorData.score ?? currentReport.score_breakdown?.[item.key] ?? 0;
                      const max = factorData.max ?? item.max;
                      const explanation = factorData.explanation || 'Evaluates this core dimension of ATS compatibility.';
                      const tip = factorData.tip || 'Follow standard ATS formatting and optimize key sections.';
                      const IconComp = item.icon;

                      return (
                        <div key={item.key} className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm hover:border-violet-200 transition-all">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                              <IconComp className="w-4 h-4 text-violet-600" />
                              <span>{item.name}</span>
                            </h3>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-black text-slate-900">
                                {score} <span className="text-xs font-bold text-slate-400">/ {max} pts</span>
                              </span>
                              <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-violet-600 rounded-full"
                                  style={{ width: `${Math.min(100, Math.max(0, (score / max) * 100))}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                              <span className="font-bold text-slate-700 block mb-1">Diagnostic Finding</span>
                              <p className="text-slate-600 leading-relaxed">{explanation}</p>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100">
                              <span className="font-bold text-violet-800 block mb-1">How to Improve</span>
                              <p className="text-violet-700 leading-relaxed">{tip}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Section Checklist Card */}
                  <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <Layers className="w-4 h-4 text-violet-600" />
                          <span>Section Checklist</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Standard section presence verified against typical ATS parser indexes.
                        </p>
                      </div>
                      <span className="text-xs font-bold text-violet-700 bg-purple-50 px-3 py-1 rounded-full self-start sm:self-auto">
                        {[
                          currentReport.sections_found?.education,
                          currentReport.sections_found?.skills,
                          currentReport.sections_found?.experience,
                          currentReport.sections_found?.projects,
                          currentReport.sections_found?.certifications
                        ].filter(Boolean).length} / 5 Present
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                      {[
                        { key: 'education', label: 'Education' },
                        { key: 'skills', label: 'Skills' },
                        { key: 'experience', label: 'Experience' },
                        { key: 'projects', label: 'Projects' },
                        { key: 'certifications', label: 'Certifications' }
                      ].map((sec) => {
                        const isPresent = Boolean(currentReport.sections_found?.[sec.key]);
                        return (
                          <div
                            key={sec.key}
                            className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                              isPresent
                                ? 'bg-emerald-50/40 border-emerald-200'
                                : 'bg-rose-50/40 border-rose-200'
                            }`}
                          >
                            <div>
                              <span className="text-xs font-bold text-slate-900 block">{sec.label}</span>
                              <span className={`text-[10px] font-semibold ${isPresent ? 'text-emerald-700' : 'text-rose-600'}`}>
                                {isPresent ? 'Detected' : 'Not detected'}
                              </span>
                            </div>
                            <span
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 ${
                                isPresent
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {isPresent ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Present</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3 text-rose-500" />
                                  <span>Missing</span>
                                </>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: JOB DESCRIPTION MATCHING */}
          {/* ======================================================== */}
          {activeTab === 'jd' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Target Role & JD Matcher</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Enforces a minimum of 50 words to prevent spam input and ensure accurate keyword comparison.
                    </p>
                  </div>

                  {/* Load Sample JD Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-400 mr-1">Sample JDs:</span>
                    {Object.keys(SAMPLE_JDS).map((role) => (
                      <button
                        key={role}
                        onClick={() => loadSampleJd(role)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-violet-700 bg-purple-50 hover:bg-purple-100 border border-purple-100 transition-colors"
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Role Title Field */}
                <div className="mb-4">
                  <label htmlFor="jd-role-title" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Job Title / Role Name
                  </label>
                  <input
                    id="jd-role-title"
                    type="text"
                    value={jdRoleTitle}
                    onChange={(e) => setJdRoleTitle(e.target.value)}
                    placeholder="e.g. Senior Frontend Engineer"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-800"
                  />
                </div>

                {/* JD Text Area with Word Counter */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="jd-description-text" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Job Description Text
                    </label>
                    <span className={`text-[11px] font-bold ${
                      jdText.trim().split(/\s+/).filter(Boolean).length >= 50
                        ? 'text-emerald-600'
                        : 'text-amber-600'
                    }`}>
                      {jdText.trim().split(/\s+/).filter(Boolean).length} / 50 words required
                    </span>
                  </div>
                  <textarea
                    id="jd-description-text"
                    rows={6}
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    placeholder="Paste the target job description here (responsibilities, required qualifications, technical skills)..."
                    className="w-full p-4 text-xs font-mono rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-800 bg-slate-50/50 hover:bg-white focus:bg-white transition-all"
                  />
                </div>

                {/* Role Mismatch Warning */}
                {checkRoleMismatch(jdRoleTitle, jdText) && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5 text-xs animate-fadeIn">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Role Mismatch Warning</span>
                      <p className="text-amber-800 mt-0.5">
                        {checkRoleMismatch(jdRoleTitle, jdText).message} You may proceed, but alignment scores and keyword matches may be affected.
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-5 flex items-center justify-end">
                  <button
                    onClick={handleRunJdMatch}
                    disabled={jdLoading || !jdText.trim()}
                    className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-violet-600 hover:bg-violet-700 shadow-md shadow-violet-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {jdLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Matching Skills...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Analyze & Match JD</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* JD Match Results Display */}
              {jdResults && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm space-y-6 animate-fadeIn">
                  
                  {/* Warning State: No Skills Detected */}
                  {!jdResults.has_skills && (
                    <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-bold">No Recognized Skills Detected</h4>
                          <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                            {jdResults.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Success Matching Card */}
                  {jdResults.has_skills && (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-purple-50 via-white to-indigo-50/40 border border-purple-100">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600">
                            Role Alignment: {jdResults.role_title}
                          </span>
                          <h3 className="text-2xl font-black text-slate-900 mt-1">
                            {jdResults.match_percentage}% Match Score
                          </h3>
                          <p className="text-xs text-slate-600 mt-1">
                            {jdResults.feedback}
                          </p>
                        </div>

                        <div className="w-20 h-20 rounded-full border-4 border-violet-600 flex items-center justify-center font-black text-xl text-violet-700 bg-white shadow-sm flex-shrink-0">
                          {jdResults.match_percentage}%
                        </div>
                      </div>

                      {/* Explanation */}
                      <p className="text-xs text-slate-500 italic">
                        {jdResults.explanation}
                      </p>

                      {/* Matching vs Missing Skills Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Matching Skills */}
                        <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                          <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-2 mb-3">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            <span>Matching Skills ({jdResults.matching_skills.length})</span>
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {jdResults.matching_skills.length === 0 ? (
                              <p className="text-xs text-emerald-700">None detected in your resume.</p>
                            ) : (
                              jdResults.matching_skills.map((skill, i) => (
                                <span key={i} className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-100/80 text-emerald-800">
                                  {skill}
                                </span>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Missing Skills */}
                        <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-100">
                          <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-2 mb-3">
                            <XCircle className="w-4 h-4 text-rose-600" />
                            <span>Missing Skills Required ({jdResults.missing_skills.length})</span>
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {jdResults.missing_skills.length === 0 ? (
                              <p className="text-xs text-emerald-700 font-bold">Outstanding! No required skills missing.</p>
                            ) : (
                              jdResults.missing_skills.map((skill, i) => (
                                <span key={i} className="text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-100/80 text-rose-800">
                                  {skill}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* JD Matches History Table */}
              {jdMatchesHistory.length > 0 && (
                <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">Past JD Comparison Records</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                          <th className="py-2.5">Target Role</th>
                          <th className="py-2.5">Match %</th>
                          <th className="py-2.5">Matching</th>
                          <th className="py-2.5">Missing</th>
                          <th className="py-2.5">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {jdMatchesHistory.map((m) => (
                          <tr key={m.id} className="hover:bg-slate-50/50">
                            <td className="py-2.5 font-bold text-slate-900">{m.role_title || 'Role'}</td>
                            <td className="py-2.5">
                              <span className="font-extrabold text-violet-700 bg-purple-50 px-2 py-0.5 rounded-lg">
                                {m.match_percentage}%
                              </span>
                            </td>
                            <td className="py-2.5 text-emerald-700">{(m.matching_skills || []).length} skills</td>
                            <td className="py-2.5 text-rose-700">{(m.missing_skills || []).length} skills</td>
                            <td className="py-2.5 text-slate-400">
                              {new Date(m.timestamp).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: RESUME INSIGHTS & WEAK VERBS */}
          {/* ======================================================== */}
          {activeTab === 'insights' && (
            <div className="space-y-6">
              {!currentReport ? (
                <div className="text-center py-12 bg-white rounded-3xl border border-purple-100 p-8">
                  <p className="text-sm text-slate-500">Please upload or select a resume to view insights.</p>
                </div>
              ) : (
                <>
                  {/* Target Role Selector Header */}
                  <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-black text-slate-900">Resume Optimization Insights</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Targeted keyword benchmarks and contextual action verb replacements.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">Target Role:</span>
                      <select
                        value={selectedTargetRole}
                        onChange={(e) => setSelectedTargetRole(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-purple-200 text-xs font-bold text-violet-700 bg-purple-50 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                      >
                        {TARGET_ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Prioritized Recommendations Cards */}
                  <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900 mb-4">Prioritized Action Items</h3>
                    <div className="space-y-3">
                      {(currentReport.suggestions || []).map((sug, i) => (
                        <div key={i} className="p-4 rounded-2xl border border-slate-100 hover:border-purple-200 bg-slate-50/40 hover:bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                sug.priority === 'High' ? 'bg-rose-100 text-rose-700' :
                                sug.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {sug.priority} Priority
                              </span>
                              <h4 className="text-xs font-bold text-slate-900">{sug.suggestion}</h4>
                            </div>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{sug.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Weak Verbs List with Contextual Replacements */}
                  <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Weak Phrasing & Action Verbs</h3>
                        <p className="text-xs text-slate-400">
                          Detected {(currentReport.weak_verbs || []).length} {(currentReport.weak_verbs || []).length === 1 ? 'passive instance' : 'passive instances'} in your resume.
                        </p>
                      </div>
                      <span className="text-xs font-bold text-violet-600 bg-purple-50 px-2.5 py-1 rounded-full">
                        ATS High-Velocity Phrasing
                      </span>
                    </div>

                    {(currentReport.weak_verbs || []).length === 0 ? (
                      <div className="p-6 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>Excellent work! No passive or weak phrasing detected in this resume.</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {currentReport.weak_verbs.map((item, idx) => (
                          <div key={idx} className="p-4 rounded-2xl bg-purple-50/40 border border-purple-100 text-xs">
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                                Weak: &quot;{item.weak}&quot;
                              </span>
                              <span className="text-slate-400">&rarr;</span>
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                Stronger: {item.replacement}
                              </span>
                            </div>
                            <p className="text-slate-600 italic bg-white p-2.5 rounded-xl border border-slate-100 text-[11px]">
                              &quot;{item.context}&quot;
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Role Keywords & Recommended */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Missing Role Keywords */}
                    <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                        Missing Keywords for {selectedTargetRole}
                      </h4>
                      <p className="text-[11px] text-slate-400 mb-3">
                        Incorporate these terms where truthfully applicable in your project descriptions:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(currentReport.keywords?.missing || []).map((kw, i) => (
                          <span key={i} className="text-xs font-bold px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                            + {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Frequently Used Keywords */}
                    <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                        Most Frequent Keywords
                      </h4>
                      <p className="text-[11px] text-slate-400 mb-3">
                        Repetition density registered by the ATS keyword parser:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(currentReport.keywords?.frequent || []).map((item, i) => (
                          <span key={i} className="text-xs font-bold px-2.5 py-1 rounded-xl bg-violet-50 text-violet-700 border border-purple-100">
                            {item.keyword} ({item.count}x)
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 6: HISTORY & COMPARISON */}
          {/* ======================================================== */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Resume Version History</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    View previous resume analyses, inspect score progression, or select 2 to compare side-by-side.
                  </p>
                </div>

                {compareIds.length === 2 && (
                  <span className="text-xs font-bold text-violet-700 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200">
                    Comparing 2 Selected Versions
                  </span>
                )}
              </div>

              {/* Score Trend History Chart */}
              {history.length > 1 && (
                <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">ATS Score Progression Over Time</h3>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                        <Tooltip
                          formatter={(val, name, props) => [`${val}/100 pts`, props.payload.filename]}
                          contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                        />
                        <Line type="monotone" dataKey="score" stroke="#7C3AED" strokeWidth={3} dot={{ r: 4, fill: '#7C3AED' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Side-by-Side Comparison Box if 2 Selected */}
              {compareIds.length === 2 && (
                (() => {
                  const r1 = history.find(h => h.id === compareIds[0]);
                  const r2 = history.find(h => h.id === compareIds[1]);
                  if (!r1 || !r2) return null;
                  return (
                    <div className="bg-white rounded-3xl p-6 border-2 border-violet-500 shadow-md animate-fadeIn">
                      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                        <h3 className="text-base font-bold text-slate-900">Side-by-Side Version Comparison</h3>
                        <button
                          onClick={() => setCompareIds([])}
                          className="text-xs font-bold text-slate-400 hover:text-slate-600"
                        >
                          Clear Comparison
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs">
                        {/* Version 1 */}
                        <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
                          <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wider block">Version A</span>
                          <h4 className="text-sm font-black text-slate-900 truncate mt-1">{r1.filename}</h4>
                          <p className="text-3xl font-black text-violet-700 mt-2">{r1.ats_score}<span className="text-xs text-slate-400 font-bold">/100</span></p>
                          <div className="mt-3 space-y-1.5 text-slate-600 text-[11px]">
                            <p><strong>Skills:</strong> {(r1.skills || []).length} keywords</p>
                            <p><strong>Strength:</strong> {r1.strength || 'Good'}</p>
                            <p><strong>Weak Verbs:</strong> {(r1.weak_verbs || []).length} detected</p>
                          </div>
                        </div>

                        {/* Version 2 */}
                        <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Version B</span>
                          <h4 className="text-sm font-black text-slate-900 truncate mt-1">{r2.filename}</h4>
                          <p className="text-3xl font-black text-indigo-700 mt-2">{r2.ats_score}<span className="text-xs text-slate-400 font-bold">/100</span></p>
                          <div className="mt-3 space-y-1.5 text-slate-600 text-[11px]">
                            <p><strong>Skills:</strong> {(r2.skills || []).length} keywords</p>
                            <p><strong>Strength:</strong> {r2.strength || 'Good'}</p>
                            <p><strong>Weak Verbs:</strong> {(r2.weak_verbs || []).length} detected</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* History Table */}
              <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="py-3 px-2 w-10">Compare</th>
                        <th className="py-3 px-4">Resume File</th>
                        <th className="py-3 px-4">ATS Score</th>
                        <th className="py-3 px-4">Skills</th>
                        <th className="py-3 px-4">Analyzed Date</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {history.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            No saved resume reports yet.
                          </td>
                        </tr>
                      ) : (
                        history.map((row) => (
                          <tr
                            key={row.id}
                            className={`hover:bg-purple-50/30 transition-colors ${
                              currentReport?.id === row.id ? 'bg-purple-50/50' : ''
                            }`}
                          >
                            <td className="py-3 px-2">
                              <input
                                type="checkbox"
                                checked={compareIds.includes(row.id)}
                                onChange={() => toggleCompare(row.id)}
                                className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
                              />
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              <button
                                onClick={() => { setCurrentReport(row); setActiveTab('overview'); }}
                                className="hover:text-violet-600 text-left truncate max-w-[200px] block"
                              >
                                {row.filename}
                              </button>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`font-extrabold px-2 py-0.5 rounded-lg text-xs ${
                                row.ats_score >= 80 ? 'bg-emerald-50 text-emerald-700' :
                                row.ats_score >= 60 ? 'bg-violet-50 text-violet-700' : 'bg-amber-50 text-amber-700'
                              }`}>
                                {row.ats_score}/100
                              </span>
                            </td>
                            <td className="py-3 px-4">{(row.skills || []).length} skills</td>
                            <td className="py-3 px-4 text-slate-400">
                              {new Date(row.timestamp).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => { setCurrentReport(row); setActiveTab('overview'); }}
                                  className="p-1.5 rounded-lg text-violet-600 hover:bg-purple-100 transition-colors"
                                  title="View this report"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setShowDeleteModal(row.id)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                                  title="Delete report"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 7: SETTINGS & PROFILE */}
          {/* ======================================================== */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-6">
              
              {/* Profile Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-1">Account Profile</h3>
                <p className="text-xs text-slate-400 mb-6">Update your display name.</p>

                {settingsStatus.msg && (
                  <div className={`mb-4 p-3 rounded-xl text-xs font-semibold ${
                    settingsStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                  }`}>
                    {settingsStatus.msg}
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      disabled
                      value={currentUser?.email || ''}
                      className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-slate-800"
                    />
                  </div>

                  <button
                    type="submit"
                    className="py-2.5 px-5 rounded-xl font-bold text-xs text-white bg-violet-600 hover:bg-violet-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </form>
              </div>

              {/* Password Change Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-1">Change Password</h3>
                <p className="text-xs text-slate-400 mb-6">Ensure your new password contains at least 8 characters.</p>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      required
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-slate-800"
                    />
                  </div>

                  <button
                    type="submit"
                    className="py-2.5 px-5 rounded-xl font-bold text-xs text-violet-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors"
                  >
                    Update Password
                  </button>
                </form>
              </div>

              {/* Danger Zone: Delete Account & Data */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-200 shadow-sm">
                <h3 className="text-base font-bold text-rose-700 mb-1">Danger Zone</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Permanently delete your user account, all saved resumes, analyses, and JD matching records.
                </p>

                <button
                  type="button"
                  onClick={() => setShowDeleteAccountModal(true)}
                  className="py-2.5 px-5 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 transition-colors"
                >
                  Delete My Account and All Data
                </button>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* Delete Report Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 animate-scaleUp">
            <h4 className="text-base font-bold text-slate-900">Delete Resume Report?</h4>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Are you sure you want to delete this report? This action cannot be undone.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteReport(showDeleteModal)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-rose-200 animate-scaleUp">
            <h4 className="text-base font-bold text-rose-700">Delete Account & All Data?</h4>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              This will permanently delete your user login, all resumes, analyses, and history from our database.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteAccountModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
