import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Sidebar from '../components/Sidebar';
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  AlertCircle, 
  Check, 
  Trash2, 
  BookOpen, 
  Briefcase, 
  User, 
  FileCode, 
  Award,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  RadialBarChart, 
  RadialBar
} from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [currentReport, setCurrentReport] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Upload State
  const [file, setFile] = useState(null);
  const [uploadError, setUploadError] = useState('');
  
  // JD Match State
  const [jdText, setJdText] = useState('');
  const [jdResults, setJdResults] = useState(null);
  const [jdLoading, setJdLoading] = useState(false);

  useEffect(() => {
    // Auth Guard
    if (localStorage.getItem('isLoggedIn') !== 'true') {
      navigate('/login');
    } else {
      fetchHistory();
    }
  }, [navigate]);

  const fetchHistory = async () => {
    try {
      const reports = await api.getHistory();
      setHistory(reports);
      // If no current report set, default to the latest from history
      if (!currentReport && reports.length > 0) {
        setCurrentReport(reports[0]);
      }
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  // Drag and Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setUploadError('');
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const handleFileChange = (e) => {
    setUploadError('');
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.name.toLowerCase().endsWith('.pdf') && selectedFile.type !== 'application/pdf') {
      setUploadError('Please upload a PDF file only.');
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds the 5MB limit.');
      return;
    }
    setFile(selectedFile);
  };

  const handleUploadAndAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setUploadError('');
    try {
      // 1. Upload and Parse Text
      const uploadRes = await api.uploadResume(file);
      // 2. Full NLP analysis
      const report = await api.analyzeResume(uploadRes.filename, uploadRes.text);
      
      setCurrentReport(report);
      setFile(null);
      setJdResults(null); // Clear previous JD matches
      setJdText('');
      fetchHistory();
      setActiveTab('overview');
    } catch (err) {
      console.error(err);
      setUploadError(err.response?.data?.detail || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJDMatch = async (e) => {
    e.preventDefault();
    if (!currentReport || !jdText.trim()) return;
    setJdLoading(true);
    try {
      const results = await api.analyzeJobDescription(currentReport.github ? `${currentReport.skills.join(" ")} ${currentReport.name}` : currentReport.skills.join(" "), jdText);
      // Let's call standard JD comparison using full resume text for higher accuracy
      const finalResults = await api.analyzeJobDescription(
        // Fallback or full details
        history.find(h => h.id === currentReport.id)?.skills?.join(", ") || currentReport.skills?.join(", "),
        jdText
      );
      setJdResults(finalResults);
    } catch (err) {
      console.error(err);
    } finally {
      setJdLoading(false);
    }
  };

  const handleDeleteReport = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this report?")) return;
    try {
      await api.deleteHistory(id);
      if (currentReport && currentReport.id === id) {
        setCurrentReport(null);
      }
      fetchHistory();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReopenReport = (report) => {
    setCurrentReport(report);
    setJdResults(null);
    setJdText('');
    setActiveTab('overview');
  };

  // Recharts Helper Data
  const getScoreData = () => {
    if (!currentReport) return [];
    const breakdown = currentReport.score_breakdown || {};
    return [
      { name: 'Completeness', value: breakdown.completeness || 0, max: 30, fill: '#c4b5fd' },
      { name: 'Skills', value: breakdown.skills || 0, max: 30, fill: '#7c3aed' },
      { name: 'Contact Info', value: breakdown.contact || 0, max: 10, fill: '#10b981' },
      { name: 'Sections', value: breakdown.sections || 0, max: 15, fill: '#a78bfa' },
      { name: 'Quality', value: breakdown.quality || 0, max: 15, fill: '#f87171' }
    ];
  };

  const getImprovementData = () => {
    if (!currentReport) return [];
    const pred = currentReport.improvement_prediction || {};
    return [
      { name: 'Current Score', score: pred.current_score || currentReport.ats_score, fill: '#EF4444' },
      { name: 'Potential Score', score: pred.potential_score || 85, fill: '#10B981' }
    ];
  };

  const getSkillsDistributionData = () => {
    if (!currentReport) return [];
    // Categories matching SKILL_CATEGORIES
    const categories = {
      "Programming": ["java", "python", "c++", "javascript", "sql", "typescript", "ruby", "go", "rust", "c#", "php", "kotlin", "swift"],
      "Web Dev": ["react", "node.js", "express", "html", "css", "angular", "vue", "next.js", "django", "flask", "bootstrap", "tailwind", "svelte", "jquery", "webflow"],
      "AI / ML": ["machine learning", "deep learning", "tensorflow", "pytorch", "nlp", "natural language processing", "computer vision", "scikit-learn", "keras", "spacy", "nltk", "opencv", "hugging face"],
      "Analytics": ["power bi", "tableau", "excel", "pandas", "numpy", "spark", "hadoop", "matplotlib", "seaborn", "sql server", "postgresql", "mongodb", "mysql"]
    };

    const counts = { "Programming": 0, "Web Dev": 0, "AI / ML": 0, "Analytics": 0 };
    const skills = currentReport.skills || [];

    skills.forEach(skill => {
      const skillLower = skill.toLowerCase();
      for (const [cat, list] of Object.entries(categories)) {
        if (list.includes(skillLower)) {
          counts[cat]++;
        }
      }
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  // Color mappings for scores
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-emerald-600 border-emerald-200 bg-emerald-50/50';
    if (score >= 75) return 'text-primary-600 border-primary-200 bg-primary-50/50';
    if (score >= 60) return 'text-amber-600 border-amber-200 bg-amber-50/50';
    return 'text-red-600 border-red-200 bg-red-50/50';
  };

  return (
    <div className="min-h-screen bg-slatebg flex">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout} 
      />

      {/* Main Workspace Area */}
      <main className="flex-1 ml-64 p-8 min-h-screen overflow-y-auto">
        {/* Header Summary */}
        <header className="flex items-center justify-between mb-8 border-b border-slate-200/50 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'upload' && 'Upload Workspace'}
              {activeTab === 'ats' && 'ATS Score Analysis'}
              {activeTab === 'jd' && 'Job Description Matcher'}
              {activeTab === 'insights' && 'Enhancement Insights'}
              {activeTab === 'history' && 'Report History'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {currentReport ? `Active Resume: ${currentReport.filename}` : "Upload a resume to begin AI analysis."}
            </p>
          </div>

          {currentReport && (
            <div className="flex items-center space-x-3 bg-white border border-slate-200/60 p-2.5 rounded-xl shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Active Score:</span>
              <span className={`px-2.5 py-1 rounded-lg text-sm font-bold border ${getScoreColor(currentReport.ats_score)}`}>
                {currentReport.ats_score}/100
              </span>
            </div>
          )}
        </header>

        {/* LOADING SKELETON */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-600 font-semibold">Analyzing your Resume using spaCy NLP parser...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              currentReport ? (
                <div className="space-y-6">
                  {/* Summary Metric Row */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Score Card */}
                    <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">ATS Score</span>
                        <div className="flex items-baseline space-x-2 mt-2">
                          <span className="text-4xl font-extrabold text-slate-800">{currentReport.ats_score}</span>
                          <span className="text-sm text-slate-500">/100</span>
                        </div>
                      </div>
                      <div className="mt-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${getScoreColor(currentReport.ats_score)}`}>
                          {currentReport.strength}
                        </span>
                      </div>
                    </div>

                    {/* Match percentage */}
                    <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">JD Match Rate</span>
                        <div className="flex items-baseline space-x-2 mt-2">
                          <span className="text-4xl font-extrabold text-slate-800">
                            {jdResults ? `${jdResults.match_percentage}%` : 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 text-xs text-slate-500">
                        {jdResults ? 'Job description compared' : 'Paste JD in the matching tab'}
                      </div>
                    </div>

                    {/* Skills Count */}
                    <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Skills Extracted</span>
                        <div className="flex items-baseline space-x-2 mt-2">
                          <span className="text-4xl font-extrabold text-slate-800">{currentReport.skills?.length || 0}</span>
                        </div>
                      </div>
                      <div className="mt-4 text-xs text-slate-500">
                        Recognized tech tags detected
                      </div>
                    </div>

                    {/* Missing Keywords */}
                    <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Missing Keywords</span>
                        <div className="flex items-baseline space-x-2 mt-2">
                          <span className="text-4xl font-extrabold text-red-500">{currentReport.keywords?.missing?.length || 0}</span>
                        </div>
                      </div>
                      <div className="mt-4 text-xs text-slate-500">
                        Recommended additions
                      </div>
                    </div>
                  </div>

                  {/* Charts Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Score Breakdown Chart */}
                    <div className="glass-card p-6 rounded-2xl">
                      <h3 className="text-md font-bold text-slate-800 mb-4">ATS Weight Breakdown</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={getScoreData()} layout="vertical" margin={{ left: 10, right: 10 }}>
                            <XAxis type="number" domain={[0, 30]} hide />
                            <YAxis dataKey="name" type="category" width={90} tickLine={false} axisLine={false} style={{ fontSize: '11px', fontWeight: 'bold' }} />
                            <Tooltip formatter={(value, name, props) => [`${value} / ${props.payload.max}`, 'Score']} />
                            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={14}>
                              {getScoreData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Skills Category Breakdown */}
                    <div className="glass-card p-6 rounded-2xl">
                      <h3 className="text-md font-bold text-slate-800 mb-4">Skills Category Distribution</h3>
                      <div className="h-64 flex items-center justify-center">
                        {currentReport.skills?.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={getSkillsDistributionData()}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {getSkillsDistributionData().map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={['#7c3aed', '#c4b5fd', '#10b981', '#fbbf24'][index % 4]} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend verticalAlign="bottom" height={36} style={{ fontSize: '12px' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="text-sm text-slate-400">No skills matching active categories.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Predictions Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Prediction Chart */}
                    <div className="glass-card p-6 rounded-2xl lg:col-span-2">
                      <h3 className="text-md font-bold text-slate-800 mb-4">Resume Improvement Prediction</h3>
                      <div className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={getImprovementData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <XAxis dataKey="name" tickLine={false} />
                            <YAxis domain={[0, 100]} />
                            <Tooltip formatter={(value) => [`${value} Points`, 'Score']} />
                            <Bar dataKey="score" radius={[8, 8, 0, 0]} barSize={50}>
                              {getImprovementData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Quick Suggestions Card */}
                    <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
                      <div>
                        <h3 className="text-md font-bold text-slate-800 mb-4">Top Action Items</h3>
                        <div className="space-y-3">
                          {currentReport.suggestions?.slice(0, 3).map((sug, idx) => (
                            <div key={idx} className="flex items-start space-x-2.5">
                              <span className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${
                                sug.priority === 'High' ? 'bg-red-500' : 'bg-amber-500'
                              }`}></span>
                              <div>
                                <h4 className="text-xs font-bold text-slate-700">{sug.suggestion}</h4>
                                <p className="text-[11px] text-slate-500 line-clamp-2">{sug.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('insights')}
                        className="mt-4 text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center justify-end space-x-1"
                      >
                        <span>Analyze Details</span>
                        <span>&rarr;</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-card rounded-2xl p-12 text-center max-w-2xl mx-auto mt-12 border border-dashed border-slate-300">
                  <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-5 text-primary-600">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">No Resume Analyzed Yet</h2>
                  <p className="text-slate-500 mt-2 text-sm leading-relaxed max-w-md mx-auto">
                    To access the analytics dashboard, upload a PDF resume first. We will parse your technical skills, section coverage, and calculate your score.
                  </p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="mt-6 px-6 py-3 rounded-xl font-semibold shadow-md gradient-button"
                  >
                    Upload Resume
                  </button>
                </div>
              )
            )}

            {/* UPLOAD RESUME TAB */}
            {activeTab === 'upload' && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div 
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="glass-card rounded-2xl p-12 text-center border-2 border-dashed border-slate-300/80 hover:border-primary-500/80 transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[300px]"
                >
                  <input 
                    type="file" 
                    id="resume-file" 
                    className="hidden" 
                    accept=".pdf"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="resume-file" className="cursor-pointer flex flex-col items-center">
                    <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-5 text-primary-600 shadow-md shadow-primary-600/5">
                      <Upload className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Drag & Drop Resume PDF</h3>
                    <p className="text-sm text-slate-500 mt-2">
                      or <span className="text-primary-600 font-semibold">browse files</span> from your system.
                    </p>
                    <p className="text-xs text-slate-400 mt-4">
                      PDF files only, maximum file size 5MB.
                    </p>
                  </label>
                </div>

                {file && (
                  <div className="glass-card p-4 rounded-xl border border-primary-100 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700">{file.name}</h4>
                        <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      onClick={handleUploadAndAnalyze}
                      className="px-5 py-2 rounded-xl text-sm font-semibold gradient-button shadow-sm"
                    >
                      Run Analysis
                    </button>
                  </div>
                )}

                {uploadError && (
                  <div className="rounded-xl bg-red-50 border border-red-100 p-4 flex items-center space-x-3 text-sm text-danger font-medium">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>
            )}

            {/* ATS ANALYSIS TAB */}
            {activeTab === 'ats' && (
              currentReport ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Factors list */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="glass-card p-6 rounded-2xl">
                      <h3 className="text-md font-bold text-slate-800 mb-5">Scoring Factors Breakdown</h3>
                      <div className="space-y-4">
                        {/* Factor 1 */}
                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                          <div>
                            <h4 className="text-sm font-bold text-slate-700">Resume Completeness</h4>
                            <p className="text-xs text-slate-500">Evaluates length structure and formatting</p>
                          </div>
                          <span className="text-sm font-bold text-slate-700">{currentReport.score_breakdown?.completeness} / 30 pts</span>
                        </div>
                        {/* Factor 2 */}
                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                          <div>
                            <h4 className="text-sm font-bold text-slate-700">Skills Coverage</h4>
                            <p className="text-xs text-slate-500">Scans volume of matched tech keywords</p>
                          </div>
                          <span className="text-sm font-bold text-slate-700">{currentReport.score_breakdown?.skills} / 30 pts</span>
                        </div>
                        {/* Factor 3 */}
                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                          <div>
                            <h4 className="text-sm font-bold text-slate-700">Contact Information</h4>
                            <p className="text-xs text-slate-500">Email, Phone, LinkedIn, and Github URL flags</p>
                          </div>
                          <span className="text-sm font-bold text-slate-700">{currentReport.score_breakdown?.contact} / 10 pts</span>
                        </div>
                        {/* Factor 4 */}
                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                          <div>
                            <h4 className="text-sm font-bold text-slate-700">Section Presence</h4>
                            <p className="text-xs text-slate-500">Checks layout segmentation (e.g. Projects, Education)</p>
                          </div>
                          <span className="text-sm font-bold text-slate-700">{currentReport.score_breakdown?.sections} / 15 pts</span>
                        </div>
                        {/* Factor 5 */}
                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                          <div>
                            <h4 className="text-sm font-bold text-slate-700">Resume Language Quality</h4>
                            <p className="text-xs text-slate-500">Deducts score for excessive passive/weak verbs</p>
                          </div>
                          <span className="text-sm font-bold text-slate-700">{currentReport.score_breakdown?.quality} / 15 pts</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Section Presence Checks */}
                  <div className="space-y-6">
                    <div className="glass-card p-6 rounded-2xl">
                      <h3 className="text-md font-bold text-slate-800 mb-5">Section Checklists</h3>
                      <div className="space-y-3.5">
                        {Object.entries(currentReport.sections_found || {}).map(([sec, found]) => {
                          const iconMap = {
                            education: BookOpen,
                            experience: Briefcase,
                            skills: FileCode,
                            projects: Award,
                            certifications: Award
                          };
                          const IconComp = iconMap[sec] || Award;
                          return (
                            <div key={sec} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white shadow-sm">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
                                  <IconComp className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-bold text-slate-700 capitalize">{sec}</span>
                              </div>
                              {found ? (
                                <span className="text-emerald-500 flex items-center text-xs font-semibold">
                                  <CheckCircle className="w-4 h-4 mr-1 fill-emerald-500/10" />
                                  Present
                                </span>
                              ) : (
                                <span className="text-red-500 flex items-center text-xs font-semibold">
                                  <XCircle className="w-4 h-4 mr-1 fill-red-500/10" />
                                  Missing
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-center py-10">Please upload a resume first.</p>
              )
            )}

            {/* JD MATCHING TAB */}
            {activeTab === 'jd' && (
              currentReport ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: input form */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="glass-card p-6 rounded-2xl">
                      <h3 className="text-md font-bold text-slate-800 mb-4 font-sans">Compare against Job Description</h3>
                      <form onSubmit={handleJDMatch} className="space-y-4">
                        <div>
                          <textarea
                            rows={8}
                            placeholder="Paste the Job Description (JD) text here to compare it against your active resume..."
                            value={jdText}
                            onChange={(e) => setJdText(e.target.value)}
                            className="block w-full p-4 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm bg-white/80"
                            required
                          ></textarea>
                        </div>
                        <button
                          type="submit"
                          disabled={jdLoading}
                          className="px-6 py-3 rounded-xl font-semibold shadow-md gradient-button text-sm disabled:opacity-50"
                        >
                          {jdLoading ? 'Processing TF-IDF Vectorization...' : 'Analyze JD Match'}
                        </button>
                      </form>
                    </div>

                    {/* Results display */}
                    {jdResults && (
                      <div className="glass-card p-6 rounded-2xl space-y-6">
                        <h3 className="text-md font-bold text-slate-800">Comparison Results</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Matching Skills */}
                          <div className="border border-slate-100 p-4 rounded-xl bg-slate-50/50">
                            <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center text-emerald-600">
                              <Check className="w-4 h-4 mr-1.5 stroke-[3]" />
                              Matching Skills
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {jdResults.matching_skills?.length > 0 ? (
                                jdResults.matching_skills.map((skill, idx) => (
                                  <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                    {skill}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-slate-400">No matching skills found.</span>
                              )}
                            </div>
                          </div>

                          {/* Missing Skills */}
                          <div className="border border-slate-100 p-4 rounded-xl bg-slate-50/50">
                            <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center text-red-600">
                              <span className="w-4 h-4 mr-1.5 flex items-center justify-center font-bold text-xs border-2 border-red-500 rounded-full leading-none">✗</span>
                              Missing Skills
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {jdResults.missing_skills?.length > 0 ? (
                                jdResults.missing_skills.map((skill, idx) => (
                                  <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-700 border border-red-100">
                                    {skill}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-emerald-600">Perfect match! No missing skills from JD.</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Match Meter */}
                  <div className="space-y-6">
                    <div className="glass-card p-6 rounded-2xl flex flex-col items-center text-center">
                      <h3 className="text-md font-bold text-slate-800 mb-6">Cosine Match Index</h3>
                      {jdResults ? (
                        <div className="relative flex items-center justify-center">
                          {/* Circle Progress */}
                          <div className="w-36 h-36 rounded-full border-8 border-slate-100 flex items-center justify-center shadow-inner relative">
                            <div className="absolute inset-0 rounded-full border-8 border-primary-500 border-r-transparent animate-pulse"></div>
                            <span className="text-3xl font-extrabold text-slate-800">{jdResults.match_percentage}%</span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-36 h-36 rounded-full border-8 border-slate-100 flex items-center justify-center text-slate-300">
                          N/A
                        </div>
                      )}
                      <p className="text-xs text-slate-500 mt-6 leading-relaxed">
                        Checks TF-IDF overlap vector between candidate profile keywords and description content. Target score is 70%+.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-center py-10">Please upload a resume first.</p>
              )
            )}

            {/* RESUME INSIGHTS TAB */}
            {activeTab === 'insights' && (
              currentReport ? (
                <div className="space-y-6">
                  {/* Suggestions List */}
                  <div className="glass-card p-6 rounded-2xl">
                    <h3 className="text-md font-bold text-slate-800 mb-5 flex items-center">
                      <Sparkles className="w-5 h-5 mr-2 text-primary-500" />
                      Priority Recommendations
                    </h3>
                    <div className="space-y-4">
                      {currentReport.suggestions?.map((sug, idx) => (
                        <div key={idx} className="flex items-start space-x-3.5 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all duration-200">
                          <span className={`mt-0.5 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                            sug.priority === 'High' 
                              ? 'bg-red-50 text-red-700 border-red-100' 
                              : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {sug.priority}
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-slate-700">{sug.suggestion}</h4>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{sug.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Weak Verb Analysis */}
                  <div className="glass-card p-6 rounded-2xl">
                    <h3 className="text-md font-bold text-slate-800 mb-5">Weak Verb Language Review</h3>
                    {currentReport.weak_verbs?.length > 0 ? (
                      <div className="space-y-4">
                        {currentReport.weak_verbs.map((item, idx) => (
                          <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                            {/* Left Side: Weak verb */}
                            <div className="space-y-2 border-r border-slate-200/50 pr-4">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-danger border border-red-100">
                                Weak Phrase Detected
                              </span>
                              <h4 className="text-sm font-extrabold text-red-600">"{item.weak}"</h4>
                              <p className="text-xs text-slate-500 leading-relaxed italic">
                                Context: "{item.context}"
                              </p>
                            </div>
                            
                            {/* Right Side: Suggested alternative */}
                            <div className="space-y-2 flex flex-col justify-center pl-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 w-fit">
                                Stronger Action Alternatives
                              </span>
                              <h4 className="text-sm font-extrabold text-slate-700">{item.replacement}</h4>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-emerald-600 bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl text-sm font-semibold">
                        <Check className="w-5 h-5 stroke-[3]" />
                        <span>No weak verbs found! Excellent action language structure in your resume.</span>
                      </div>
                    )}
                  </div>

                  {/* Keywords Tag Lists */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Frequently Used */}
                    <div className="glass-card p-5 rounded-2xl">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Frequently Used</h3>
                      <div className="flex flex-wrap gap-2">
                        {currentReport.keywords?.frequent?.map((item, idx) => (
                          <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {item.keyword} ({item.count}x)
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Missing Keywords */}
                    <div className="glass-card p-5 rounded-2xl">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Missing Keywords</h3>
                      <div className="flex flex-wrap gap-2">
                        {currentReport.keywords?.missing?.map((item, idx) => (
                          <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-700 border border-red-100">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Recommended Keywords */}
                    <div className="glass-card p-5 rounded-2xl">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Recommended Additions</h3>
                      <div className="flex flex-wrap gap-2">
                        {currentReport.keywords?.recommended?.map((item, idx) => (
                          <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-primary-50 text-primary-700 border border-primary-100">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-center py-10">Please upload a resume first.</p>
              )
            )}

            {/* HISTORY TAB */}
            {activeTab === 'history' && (
              <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/50">
                {history.length > 0 ? (
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Resume Filename</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">ATS Score</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date Analyzed</th>
                        <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {history.map((report) => (
                        <tr 
                          key={report.id} 
                          className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                          onClick={() => handleReopenReport(report)}
                        >
                          <td className="px-6 py-4.5 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <FileText className="w-5 h-5 text-slate-400" />
                              <span className="text-sm font-semibold text-slate-700">{report.filename}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4.5 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getScoreColor(report.ats_score)}`}>
                              {report.ats_score}/100
                            </span>
                          </td>
                          <td className="px-6 py-4.5 whitespace-nowrap text-sm text-slate-400">
                            {new Date(report.timestamp).toLocaleDateString(undefined, { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-6 py-4.5 whitespace-nowrap text-right text-sm font-semibold">
                            <button
                              onClick={(e) => handleDeleteReport(report.id, e)}
                              className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                              title="Delete Report"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-16 text-center text-slate-400">
                    No historical reports found. Upload a resume to create your first report.
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
