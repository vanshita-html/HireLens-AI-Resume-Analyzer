import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Shield, Brain, Cpu, BarChart3, ListFilter, Sparkles, FileText } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleStart = () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slatebg relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-primary-300/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-slate-200/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-600/20">
            <Brain className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">
            Hire<span className="text-primary-600">Lens</span>
          </span>
        </div>

        <button
          onClick={() => navigate('/login')}
          className="px-5 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:text-primary-600 hover:bg-slate-100/80 transition-all"
        >
          Sign In
        </button>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center relative z-10">
        <div className="inline-flex items-center space-x-2 bg-primary-50 border border-primary-100 px-3 py-1 rounded-full text-xs font-semibold text-primary-600 mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          <span>V1 Release: AI-Powered Career Optimization</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-800 tracking-tight leading-tight max-w-4xl mx-auto">
          Land More Interviews with <span className="gradient-text">AI-Powered</span> Resume Analysis
        </h1>
        <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Analyze your resume, improve ATS scores, and match job descriptions instantly.
          Optimized for recruiters and placement-ready portfolios.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleStart}
            className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold shadow-lg shadow-primary-600/20 flex items-center justify-center space-x-2 group gradient-button"
          >
            <span>Analyze My Resume</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={scrollToFeatures}
            className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-slate-700 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-all"
          >
            View Features
          </button>
        </div>
      </section>

      {/* Analytics Preview Section */}
      <section className="max-w-5xl mx-auto px-6 pb-24 relative z-10">
        <div className="glass-card rounded-2xl p-6 border border-slate-200/80 shadow-2xl relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary-600 to-primary-400 rounded-2xl blur opacity-10 -z-10"></div>
          
          {/* Mock Dashboard Preview */}
          <div className="bg-slate-900/95 rounded-xl p-4 sm:p-6 text-slate-300 font-mono text-left shadow-inner overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-xs text-slate-500">hirelens-analysis-v1.json</div>
            </div>
            
            <div className="space-y-2 text-xs sm:text-sm">
              <p className="text-green-400"># Initializing HireLens parser engine...</p>
              <p className="text-slate-400">Found: Resume_John_Doe_Developer.pdf (Size: 1.4 MB)</p>
              <p className="text-primary-400">&gt; Contact Information Extracted:</p>
              <p className="pl-4 text-slate-400">Name: John Doe | Email: john.doe@gmail.com | Github: github.com/johndoe</p>
              <p className="text-primary-400">&gt; ATS Score Calculation:</p>
              <p className="pl-4"><span className="text-yellow-400">Score: 82/100</span> | <span className="text-green-400">Level: Good</span></p>
              <p className="text-primary-400">&gt; Weak Action Verbs Found: <span className="text-red-400">3 occurrences</span></p>
              <p className="pl-4 text-slate-500">// Replacement suggested: "Worked on" -&gt; "Engineered and deployed"</p>
              <p className="text-green-400"># Optimization report generated successfully.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-24 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">
              Engineered for Candidate Success
            </h2>
            <p className="mt-4 text-slate-600">
              Unlock actionable feedback to bypass screeners and get your resume in front of hiring managers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">ATS Score Prediction</h3>
              <p className="mt-2 text-sm text-slate-600">
                Predicts your ATS compatibility score out of 100 based on completeness, keyword coverage, and resume structure.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center mb-4">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">NLP Resume Parsing</h3>
              <p className="mt-2 text-sm text-slate-600">
                Instantly extracts contact details, education history, job experience, and certifications.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Skill Extraction</h3>
              <p className="mt-2 text-sm text-slate-600">
                Matches resume content against programming, web dev, AI/ML, and data analytics skill maps automatically.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center mb-4">
                <ListFilter className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Job Description Matching</h3>
              <p className="mt-2 text-sm text-slate-600">
                Upload resume and job description to perform cosine similarity checking and extract missing skill keywords.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Weak Verb Analysis</h3>
              <p className="mt-2 text-sm text-slate-600">
                Detects passive voice or repetitive weak verbs and suggests high-impact replacements with side-by-side reviews.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Improvement Prediction</h3>
              <p className="mt-2 text-sm text-slate-600">
                Dynamically maps prospective score increases once the requested revisions are integrated.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-slate-50 py-24 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-slate-600">
              Follow our simple four-step process to optimize your resume.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center mx-auto text-lg font-bold shadow-lg shadow-primary-600/20 mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Upload Resume</h3>
              <p className="mt-2 text-sm text-slate-600">
                Drag and drop your PDF resume into our secure dashboard workspace.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center mx-auto text-lg font-bold shadow-lg shadow-primary-600/20 mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Analyze Resume</h3>
              <p className="mt-2 text-sm text-slate-600">
                Our parser reads your profile structure and extracts core skill metrics.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center mx-auto text-lg font-bold shadow-lg shadow-primary-600/20 mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Get ATS Score</h3>
              <p className="mt-2 text-sm text-slate-600">
                Inspect score breakdowns, missing keywords, and weak action language.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center mx-auto text-lg font-bold shadow-lg shadow-primary-600/20 mb-4">
                4
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Improve Resume</h3>
              <p className="mt-2 text-sm text-slate-600">
                Apply real-time predictions and re-verify to match any target role.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 text-slate-500 py-12 px-6 border-t border-slate-200/60">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Brain className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-800">
              Hire<span className="text-primary-600">Lens</span>
            </span>
          </div>
          <p className="text-sm text-slate-400">
            &copy; 2026 HireLens. Built with FastAPI, React, and spaCy.
          </p>
        </div>
      </footer>

    </div>
  );
}
