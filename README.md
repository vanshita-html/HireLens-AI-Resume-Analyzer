# HireLens – AI Resume Analyzer & ATS Score Predictor

HireLens is a production-ready, AI-powered Resume Analyzer designed to help students and job seekers optimize their resumes for real-world Applicant Tracking Systems (ATS). The platform extracts technical skills, performs TF-IDF job description matching, evaluates 5 transparent ATS scoring factors, flags passive phrasing with contextual action-verb replacements, and exports comprehensive PDF audit reports.

---

## Technical Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Recharts, Lucide Icons, jsPDF
- **Backend**: FastAPI, Python 3.12, Uvicorn, Pydantic
- **AI & NLP**: spaCy (`en_core_web_sm`), Scikit-learn (TF-IDF Vectorization, Cosine Similarity)
- **PDF Extraction**: PyMuPDF (`pymupdf`)
- **Authentication**: Bcrypt password hashing, PyJWT signed tokens
- **Database**: PostgreSQL (via Neon / Supabase / Render) with automatic fallback to local SQLite
- **Deployment**: Vercel (Frontend SPA with rewrites) + Render (Backend API Web Service)

---

## Key Features

1. **Secure JWT Authentication**: Real user registration, login, profile updates, and password management with Bcrypt and JWT tokens. All resumes and reports are strictly scoped to each user.
2. **PyMuPDF Resume Parsing**: Parses layout-clean text from PDF resumes without storing unencrypted raw text or logging personal data.
3. **Transparent 5-Factor ATS Scoring**:
   - Content Completeness & Length (max 25 pts)
   - Technical Skills Breadth (max 25 pts)
   - Contact Identifiers & Clickable URLs (max 15 pts)
   - Standard Section Headers (max 20 pts)
   - Language Quality & Action Impact (max 15 pts)
   - Accompanied by diagnostic explanations and actionable improvement tips.
4. **Target Role & JD Matching**:
   - Enforces 50+ words minimum to prevent spam or garbage input.
   - Calculates semantic alignment and identifies matching vs. missing skill matrices.
   - Pre-populated with sample JDs (Full-Stack, Backend, Data Analyst, Machine Learning).
   - Saves JD match comparison history.
5. **Contextual Action-Verb Rewriter**:
   - Flags all occurrences of weak language (e.g., *"worked on"*, *"helped with"*, *"responsible for"*).
   - Shows before-and-after sentence replacements.
6. **Role-Specific Keyword Gap Analysis**:
   - Benchmarks keyword density against target roles (Full-Stack, Frontend, Backend, Data Analyst, ML Engineer, DevOps, Mobile).
7. **Score Gain Predictor**: Projects potential score improvement upon implementing high-priority suggestions.
8. **Side-by-Side Version Comparison**: Compare two resume reports side-by-side to track iterative enhancements.
9. **Client-Ready PDF Export**: Download formatted, professional ATS audit reports via `jspdf`.
10. **Cold-Start Handling & Reliability**: Built-in 60s timeout with automatic retries and notification banner for Render free-tier servers.

---



## Environment Variables

### Backend Environment Variables (`.env`)
| Variable | Description | Example / Default |
|---|---|---|
| `JWT_SECRET` | Secret key used to sign and verify JWT tokens | `hirelens-production-secret-2026` |
| `DATABASE_URL` | PostgreSQL connection string (Neon / Render / Supabase). If omitted, falls back to local SQLite (`hirelens.db`). | `postgresql://user:pass@ep-xyz.neon.tech/hirelens` |
| `FRONTEND_URL` | Frontend domain allowed by CORS | `https://hirelens-ai-resume-analyzer.vercel.app` |
| `PORT` | Port number for Uvicorn server | `8000` |

### Frontend Environment Variables (`frontend/.env`)
| Variable | Description | Example / Default |
|---|---|---|
| `VITE_API_URL` | URL of the FastAPI backend server (Render in prod, localhost in dev) | `http://127.0.0.1:8000` |

---



## Local Installation & Manual Run Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup
Navigate to the root project directory:
```bash
# Create and activate python virtual environment (recommended)
python -m venv backend/venv

# Windows Powershell:
.\backend\venv\Scripts\Activate.ps1
# macOS/Linux:
source backend/venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download spaCy English model
python -m spacy download en_core_web_sm

# Start FastAPI server
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API documentation is available at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup
In a new terminal window:
```bash
cd frontend

# Install npm dependencies
npm install

# Start Vite development server
npm run dev
```
The React application will be accessible at `http://localhost:5173`.

---

## Production Deployment Guide

### Deploying the Backend on Render
1. Create a new **Web Service** connected to your GitHub repository `HireLens-AI-Resume-Analyzer`.
2. Set **Root Directory** to blank or `.`.
3. Set **Runtime** to `Python 3`.
4. Set **Build Command**: `pip install -r requirements.txt && python -m spacy download en_core_web_sm`
5. Set **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
6. Under **Environment Variables**, add:
   - `JWT_SECRET`: (A strong random secret string)
   - `DATABASE_URL`: (Your connection string from Neon or Supabase PostgreSQL)
   - `FRONTEND_URL`: `https://hirelens-ai-resume-analyzer.vercel.app`

### Deploying the Frontend on Vercel
1. Import the repository on Vercel and set the **Root Directory** to `frontend`.
2. Framework Preset: `Vite`.
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Under **Environment Variables**, add:
   - `VITE_API_URL`: Your Render backend URL (e.g. `https://hirelens-backend.onrender.com`).
6. `vercel.json` is already configured in the `frontend` folder with SPA rewrites to prevent 404s on route refresh.

---

## Author

**Vanshita Shivankar**  
Third-Year Information Technology Engineering Student  
GitHub: [https://github.com/vanshita-html](https://github.com/vanshita-html)
