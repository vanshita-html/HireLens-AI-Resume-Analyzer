# HireLens – AI Resume Analyzer & ATS Score Predictor (V1)

HireLens is a professional AI-powered web application that helps students, freshers, and job seekers optimize their resumes for Applicant Tracking Systems (ATS).

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

## Demo Credentials
- **Email**: `demo@hirelens.com`
- **Password**: `123456`
