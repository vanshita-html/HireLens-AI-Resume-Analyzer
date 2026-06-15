# HireLens – AI Resume Analyzer & ATS Score Predictor (V1)

HireLens is an AI-powered Resume Analyzer designed to help students and job seekers improve their resumes for Applicant Tracking Systems (ATS). The platform analyzes resumes, predicts ATS scores, extracts skills, matches resumes against job descriptions, and provides actionable recommendations to increase interview opportunities.

---

## Technical Architecture

- **Frontend**: React.js, Tailwind CSS, React Router, Axios, Recharts, Lucide Icons
- **Backend**: FastAPI, Python
- **AI / NLP**: spaCy, Scikit-learn (TF-IDF Vectorization, Cosine Similarity)
- **PDF Extraction**: PyMuPDF (fitz)
- **Database**: SQLite

---

## Key Features

1. **Static Authentication**: Simple dashboard guard using mock credentials.
2. **Resume Parsing**: Automatically extracts personal contact details and key section presence.
3. **Skill Extraction Engine**: Detects programming, web, AI/ML, and data analytics competencies.
4. **ATS Score Calculator**: Provides a score out of 100 with individual component weights.
5. **Job Description Matcher**: Pastes JDs to calculate matching percentages and outline keyword gaps.
6. **Verb Quality Inspector**: Scans resumes for weak words and lists stronger alternatives.
7. **Score Gain Predictor**: Outlines potential score gains if action items are implemented.
8. **Analysis History**: Manages past reports in local SQLite storage.

---
## Why I Built This

Many candidates are rejected by ATS systems before their resumes reach recruiters. HireLens was developed to help users identify missing keywords, improve resume quality, and better align their profiles with job requirements.

---
## Project Highlights

- ATS Score Prediction (0–100)
- Resume Skill Extraction
- Job Description Matching
- Missing Keyword Detection
- Resume Improvement Suggestions
- Weak Verb Analysis
- Historical Report Tracking

---

## Installation & Setup

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### 1. Backend Setup
Navigate to the root workspace and install python dependencies:
```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

Start the FastAPI development server:
```bash
python -m uvicorn backend.main:app --reload --port 8000
```
The backend API will run at `http://127.0.0.1:8000`.

### 2. Frontend Setup
Navigate to the `frontend` directory:
```bash
cd frontend
npm install
```

Start the Vite development server:
```bash
npm run dev
```
The React frontend will be available at `http://localhost:5173`.

---
## Future Enhancements

- Resume Builder
- AI Resume Rewrite Suggestions
- Cover Letter Generator
- Interview Question Generator
- Multi-Resume Comparison
- Resume Ranking System

---
## Author

Vanshita Shivankar

Third-Year Information Technology Engineering Student

GitHub: https://github.com/vanshita-html

---

NLP • ATS Optimization • Resume Parsing • TF-IDF • Cosine Similarity • Machine Learning • FastAPI • React • SQLite • Python
