import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowRight, CheckCircle2, Shield, Brain, Cpu, BarChart3, 
  ListFilter, Sparkles, FileText, Upload, Target, Zap, 
  Check, LogOut, User, ChevronRight
} from 'lucide-react';
import { api } from '../services/api';

export default function LandingPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('hirelens_token');
    const userStr = localStorage.getItem('hirelens_user');
    if (token && userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        setCurrentUser({ name: 'User' });
      }
    }
  }, []);

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
  };

  const handleAnalyzeClick = () => {
    if (currentUser) {
      navigate('/dashboard');
    } else {
      navigate('/login?tab=register');
    }
  };

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  const getInitials = (name) => {
    if (!name) return 'HL';
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-purple-50/30 to-white text-slate-800 relative selection:bg-violet-100 selection:text-violet-900">
      {/* Background radial glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-200/40 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl pointer-events-none -z-10"></div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-purple-100/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">
              Hire<span className="text-violet-600">Lens</span>
            </span>
          </Link>

          {/* Auth-Aware Top Right Controls */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/dashboard"
                  className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 shadow-sm shadow-violet-500/20 transition-all"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                {/* User Chip */}
                <div className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full bg-purple-50 border border-purple-100">
                  <div className="w-7 h-7 rounded-full bg-violet-600 text-white font-bold text-xs flex items-center justify-center">
                    {getInitials(currentUser.name)}
                  </div>
                  <span className="text-xs font-bold text-slate-700 max-w-[120px] truncate pr-1">
                    {currentUser.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    title="Log Out"
                    className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  to="/login?tab=login"
                  className="px-4 py-2 rounded-xl text-sm font-bold text-slate-700 hover:text-violet-700 hover:bg-purple-50 transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/login?tab=register"
                  className="px-4 sm:px-5 py-2 rounded-xl text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 shadow-sm shadow-violet-500/20 transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-16 sm:pt-24 pb-16 text-center relative z-10">
        <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200/80 px-4 py-1.5 rounded-full text-xs font-bold text-violet-700 mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-violet-600" />
          <span>Production AI Career Engine • Transparent ATS Analytics</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] max-w-4xl mx-auto">
          Pass Applicant Tracking Systems with{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-purple-600">
            Intelligent Resume Analytics
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Instantly evaluate keyword coverage, eliminate passive phrasing, compare side-by-side with target job descriptions, and download verified ATS performance reports.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleAnalyzeClick}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-white bg-violet-600 hover:bg-violet-700 active:scale-[0.99] shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 group transition-all"
          >
            <span>Analyze My Resume</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={scrollToFeatures}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-slate-700 bg-white border border-purple-100 hover:bg-purple-50/50 shadow-sm transition-all"
          >
            View Features
          </button>
        </div>

        {/* Hero Trust Micro-Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>PDF Parsing & Skill Taxonomy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>TF-IDF Job Description Matching</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Private User Scoped History</span>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="py-20 bg-gradient-to-b from-white to-purple-50/40 border-y border-purple-100/80">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-violet-600 bg-purple-100/60 px-3 py-1 rounded-full">
              Streamlined 3-Step Workflow
            </span>
            <h2 className="mt-3 text-3xl font-extrabold text-slate-900 tracking-tight">
              How HireLens Works
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Transform your raw resume into a recruiter-ready application in under two minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-white rounded-3xl p-8 border border-purple-100 shadow-sm hover:shadow-md transition-shadow relative">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-violet-600 flex items-center justify-center font-black text-lg mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Upload Resume (PDF)</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Drag and drop your PDF resume. Our PyMuPDF engine extracts raw layout text and verifies section headers without logging private data.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-3xl p-8 border border-purple-100 shadow-sm hover:shadow-md transition-shadow relative">
              <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center font-black text-lg mb-6 shadow-md shadow-violet-500/20">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">ATS Diagnostics & Insights</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Review your 5-factor ATS score breakdown, discover missing role keywords, and flag weak phrases with recommended action verbs.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-3xl p-8 border border-purple-100 shadow-sm hover:shadow-md transition-shadow relative">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-violet-600 flex items-center justify-center font-black text-lg mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Target JD Match & Export</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Paste any target job description to pinpoint missing requirements, inspect side-by-side versions, and export a clean PDF report.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-24 max-w-6xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-violet-600 bg-purple-100/60 px-3 py-1 rounded-full">
            Core Features
          </span>
          <h2 className="mt-3 text-3xl font-extrabold text-slate-900 tracking-tight">
            Engineered for Modern Tech Roles
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Everything you need to calibrate your resume against actual hiring pipelines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="bg-white rounded-3xl p-7 border border-purple-100 shadow-sm hover:border-violet-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center mb-5">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Transparent ATS Scoring</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              5 weighted factors: completeness, skill coverage, contact info, standard sections, and action phrasing with actionable improvement tips.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-3xl p-7 border border-purple-100 shadow-sm hover:border-violet-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center mb-5">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Target Role JD Matcher</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Enforces 50+ word JDs to prevent garbage input. Compares technical skills and calculates exact matching vs. missing skill matrices.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-3xl p-7 border border-purple-100 shadow-sm hover:border-violet-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center mb-5">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Weak Phrasing Rewriter</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Identifies passive verbs like &quot;worked on&quot; or &quot;helped with&quot; and provides impactful, high-velocity bullet point replacements.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white rounded-3xl p-7 border border-purple-100 shadow-sm hover:border-violet-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center mb-5">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Role-Specific Keywords</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Choose from roles like Full-Stack Developer, Data Analyst, ML Engineer, or DevOps to reveal missing high-demand industry tooling.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-white rounded-3xl p-7 border border-purple-100 shadow-sm hover:border-violet-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center mb-5">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">PDF Report Export</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Generate and download a professional client-ready PDF report of your resume evaluation, score breakdown, and prioritized suggestions.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-white rounded-3xl p-7 border border-purple-100 shadow-sm hover:border-violet-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center mb-5">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Per-User Data Isolation</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Bcrypt hashed passwords, signed JWT tokens, and database foreign-key isolation ensure only you see your resumes and analyses.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-lg font-bold text-white">
              Hire<span className="text-violet-400">Lens</span>
            </span>
          </div>

          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} HireLens AI Resume Analyzer. Built for high-impact tech applicants.
          </p>

          <div className="flex items-center gap-6 text-xs font-semibold text-slate-400">
            <button onClick={scrollToFeatures} className="hover:text-white transition-colors">
              Features
            </button>
            <Link to="/login" className="hover:text-white transition-colors">
              Sign In
            </Link>
            <Link to="/login?tab=register" className="hover:text-white transition-colors">
              Create Account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
