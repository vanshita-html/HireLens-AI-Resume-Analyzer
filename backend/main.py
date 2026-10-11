import sys
import os
import re
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import db
from services import pdf_service, nlp_service, ats_service, auth_service

# Initialize database
db.init_db()

# Initialize spaCy
nlp_service.get_spacy_nlp()

app = FastAPI(
    title="HireLens API",
    description="Production API for HireLens AI Resume Analyzer & ATS Score Predictor",
    version="2.0.0"
)

# CORS Configuration
frontend_env = os.getenv("FRONTEND_URL", "").rstrip("/")
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://hirelens-ai-resume-analyzer.vercel.app"
]
if frontend_env and frontend_env not in allowed_origins:
    allowed_origins.append(frontend_env)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security scheme
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> Dict[str, Any]:
    token = credentials.credentials
    payload = auth_service.decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=401,
            detail="Session expired or invalid credentials. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = int(payload["sub"])
    user = db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="User account no longer exists. Please register or sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

# Pydantic Schemas
class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=150)
    password: str = Field(..., min_length=8, max_length=100)

class LoginRequest(BaseModel):
    email: str
    password: str

class UpdateProfileRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=100)

class TextRequest(BaseModel):
    text: str

class AnalyzeResumeRequest(BaseModel):
    filename: str
    text: str
    target_role: Optional[str] = "Full-Stack Developer"

class AnalyzeJDRequest(BaseModel):
    resume_text: str
    jd_text: str
    role_title: Optional[str] = "Target Role"
    report_id: Optional[int] = None

class KeywordAnalysisRequest(BaseModel):
    text: str
    target_role: Optional[str] = "Full-Stack Developer"

class PredictImprovementRequest(BaseModel):
    current_score: int
    suggestions: List[Dict[str, Any]]

# Email validation helper
EMAIL_REGEX = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'

# System Health Endpoints
@app.get("/")
def root():
    return {
        "status": "ok",
        "app": "HireLens AI Resume Analyzer",
        "version": "2.0.0"
    }

@app.get("/health")
@app.head("/health")
def health_check():
    return {"status": "ok"}

# Authentication Endpoints
@app.post("/auth/register")
def register(payload: RegisterRequest):
    email_clean = payload.email.strip().lower()
    if not re.match(EMAIL_REGEX, email_clean):
        raise HTTPException(status_code=400, detail="Please provide a valid email address.")
    
    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")

    existing_user = db.get_user_by_email(email_clean)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email is already registered. Please sign in instead.")

    password_hash = auth_service.hash_password(payload.password)
    user_id = db.create_user(payload.name.strip(), email_clean, password_hash)
    
    if not user_id:
        raise HTTPException(status_code=500, detail="Could not create user account. Please try again.")

    token = auth_service.create_access_token({
        "sub": str(user_id),
        "email": email_clean,
        "name": payload.name.strip()
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "name": payload.name.strip(),
            "email": email_clean
        }
    }

@app.post("/auth/login")
@app.post("/login")
def login(payload: LoginRequest):
    email_clean = payload.email.strip().lower()
    user = db.get_user_by_email(email_clean)
    if not user or not auth_service.verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=400,
            detail="Incorrect email or password. Please verify and try again."
        )

    token = auth_service.create_access_token({
        "sub": str(user["id"]),
        "email": user["email"],
        "name": user["name"]
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"]
        }
    }

@app.get("/auth/me")
def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "name": current_user["name"],
        "email": current_user["email"],
        "created_at": current_user.get("created_at")
    }

@app.post("/auth/logout")
def logout(current_user: Dict[str, Any] = Depends(get_current_user)):
    return {"status": "success", "message": "Logged out successfully"}

@app.put("/auth/profile")
def update_profile(payload: UpdateProfileRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    db.update_user_name(current_user["id"], payload.name.strip())
    return {
        "status": "success",
        "user": {
            "id": current_user["id"],
            "name": payload.name.strip(),
            "email": current_user["email"]
        }
    }

@app.put("/auth/password")
def change_password(payload: ChangePasswordRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    user_record = db.get_user_by_email(current_user["email"])
    if not user_record or not auth_service.verify_password(payload.current_password, user_record["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
        
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters long.")
        
    new_hash = auth_service.hash_password(payload.new_password)
    db.update_user_password(current_user["id"], new_hash)
    return {"status": "success", "message": "Password updated successfully"}

@app.delete("/auth/account")
def delete_account(current_user: Dict[str, Any] = Depends(get_current_user)):
    db.delete_user_and_all_data(current_user["id"])
    return {"status": "success", "message": "Account and all associated resume data permanently deleted."}

# Protected Resume Analysis Endpoints
@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...), current_user: Dict[str, Any] = Depends(get_current_user)):
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds the 5MB limit.")
        
    text = pdf_service.extract_text_from_pdf(contents)
    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from the PDF. It may be scanned or empty.")
        
    return {"filename": file.filename, "text": text}

@app.post("/analyze-resume")
def analyze_resume(payload: AnalyzeResumeRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    text = payload.text
    filename = payload.filename
    target_role = payload.target_role or "Full-Stack Developer"
    
    personal_info = nlp_service.extract_personal_info(text)
    sections_found = nlp_service.check_section_presence(text)
    skills = nlp_service.extract_skills(text)
    weak_verbs = nlp_service.analyze_weak_verbs(text)
    keywords = nlp_service.analyze_keywords(text, skills, target_role=target_role)
    
    ats_results = ats_service.calculate_ats_score(
        text, personal_info, sections_found, skills, weak_verbs
    )
    
    suggestions = ats_service.generate_suggestions(
        personal_info, sections_found, skills, weak_verbs
    )
    
    improvement = ats_service.predict_improvement(
        ats_results["ats_score"], suggestions
    )
    
    report_data = {
        "filename": filename,
        "name": personal_info["name"],
        "email": personal_info["email"],
        "phone": personal_info["phone"],
        "linkedin": personal_info["linkedin"],
        "github": personal_info["github"],
        "skills": skills,
        "sections_found": sections_found,
        "ats_score": ats_results["ats_score"],
        "score_breakdown": ats_results["score_breakdown"],
        "factor_details": ats_results.get("factor_details", {}),
        "strength": ats_results.get("strength", "Moderate"),
        "suggestions": suggestions,
        "weak_verbs": weak_verbs,
        "keywords": keywords,
        "improvement_prediction": improvement,
        "target_role": target_role
    }
    
    # Save to database scoped to current user
    report_id = db.save_report(current_user["id"], report_data)
    report_data["id"] = report_id
    
    return report_data

@app.post("/extract-skills")
def extract_skills_endpoint(payload: TextRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    skills = nlp_service.extract_skills(payload.text)
    return {"skills": skills}

@app.post("/calculate-ats-score")
def calculate_ats_score_endpoint(payload: TextRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    text = payload.text
    personal_info = nlp_service.extract_personal_info(text)
    sections_found = nlp_service.check_section_presence(text)
    skills = nlp_service.extract_skills(text)
    weak_verbs = nlp_service.analyze_weak_verbs(text)
    
    ats_results = ats_service.calculate_ats_score(
        text, personal_info, sections_found, skills, weak_verbs
    )
    return ats_results

@app.post("/analyze-job-description")
def analyze_job_description(payload: AnalyzeJDRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    results = ats_service.match_job_description(payload.resume_text, payload.jd_text, payload.role_title)
    
    # Save JD match to history if successful
    if results.get("status") == "success":
        match_id = db.save_jd_match(
            user_id=current_user["id"],
            report_id=payload.report_id,
            role_title=payload.role_title or "Target Role",
            jd_text=payload.jd_text[:1000],
            match_percentage=results.get("match_percentage", 0),
            matching_skills=results.get("matching_skills", []),
            missing_skills=results.get("missing_skills", [])
        )
        results["match_id"] = match_id
        
    return results

@app.get("/jd-matches")
def get_jd_matches(current_user: Dict[str, Any] = Depends(get_current_user)):
    return db.get_jd_matches_by_user(current_user["id"])

@app.post("/generate-suggestions")
def generate_suggestions_endpoint(payload: TextRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    text = payload.text
    personal_info = nlp_service.extract_personal_info(text)
    sections_found = nlp_service.check_section_presence(text)
    skills = nlp_service.extract_skills(text)
    weak_verbs = nlp_service.analyze_weak_verbs(text)
    
    suggestions = ats_service.generate_suggestions(
        personal_info, sections_found, skills, weak_verbs
    )
    return {"suggestions": suggestions}

@app.post("/keyword-analysis")
def keyword_analysis(payload: KeywordAnalysisRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    text = payload.text
    skills = nlp_service.extract_skills(text)
    keywords = nlp_service.analyze_keywords(text, skills, target_role=payload.target_role)
    return keywords

@app.post("/weak-verb-analysis")
def weak_verb_analysis(payload: TextRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    weak_verbs = nlp_service.analyze_weak_verbs(payload.text)
    return {"weak_verbs": weak_verbs}

@app.post("/predict-improvement")
def predict_improvement_endpoint(payload: PredictImprovementRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    results = ats_service.predict_improvement(payload.current_score, payload.suggestions)
    return results

@app.get("/history")
def get_history(current_user: Dict[str, Any] = Depends(get_current_user)):
    return db.get_reports_by_user(current_user["id"])

@app.get("/history/{id}")
def get_history_item(id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    report = db.get_report_by_id(id, current_user["id"])
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@app.delete("/history/{id}")
def delete_history_item(id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    success = db.delete_report(id, current_user["id"])
    if success:
        return {"status": "success", "message": f"Report {id} deleted successfully"}
    raise HTTPException(status_code=404, detail="Report not found")
