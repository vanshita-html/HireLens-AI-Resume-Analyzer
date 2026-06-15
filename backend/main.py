import sys
import os
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import db
from services import pdf_service, nlp_service, ats_service

# Initialize database
db.init_db()

# Initialize spaCy
nlp_service.get_spacy_nlp()

app = FastAPI(
    title="HireLens API",
    description="Backend API for AI Resume Analyzer & ATS Score Predictor",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Schemas
class LoginRequest(BaseModel):
    email: str
    password: str

class TextRequest(BaseModel):
    text: str

class AnalyzeResumeRequest(BaseModel):
    filename: str
    text: str

class AnalyzeJDRequest(BaseModel):
    resume_text: str
    jd_text: str

class PredictImprovementRequest(BaseModel):
    current_score: int
    suggestions: List[Dict[str, Any]]

# Endpoints

@app.post("/login")
def login(payload: LoginRequest):
    if payload.email == "demo@hirelens.com" and payload.password == "123456":
        return {"status": "success", "message": "Logged in successfully", "email": payload.email}
    raise HTTPException(
        status_code=400,
        detail="Invalid Credentials.\nUse:\ndemo@hirelens.com\n123456"
    )

@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")
    
    # Read file content
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds the 5MB limit.")
        
    text = pdf_service.extract_text_from_pdf(contents)
    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from the PDF. It may be scanned or empty.")
        
    return {"filename": file.filename, "text": text}

@app.post("/analyze-resume")
def analyze_resume(payload: AnalyzeResumeRequest):
    text = payload.text
    filename = payload.filename
    
    personal_info = nlp_service.extract_personal_info(text)
    sections_found = nlp_service.check_section_presence(text)
    skills = nlp_service.extract_skills(text)
    weak_verbs = nlp_service.analyze_weak_verbs(text)
    keywords = nlp_service.analyze_keywords(text, skills)
    
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
        "suggestions": suggestions,
        "weak_verbs": weak_verbs,
        "keywords": keywords,
        "improvement_prediction": improvement
    }
    
    # Save to history db
    report_id = db.save_report(report_data)
    report_data["id"] = report_id
    
    return report_data

@app.post("/extract-skills")
def extract_skills_endpoint(payload: TextRequest):
    skills = nlp_service.extract_skills(payload.text)
    return {"skills": skills}

@app.post("/calculate-ats-score")
def calculate_ats_score_endpoint(payload: TextRequest):
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
def analyze_job_description(payload: AnalyzeJDRequest):
    results = ats_service.match_job_description(payload.resume_text, payload.jd_text)
    return results

@app.post("/generate-suggestions")
def generate_suggestions_endpoint(payload: TextRequest):
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
def keyword_analysis(payload: TextRequest):
    text = payload.text
    skills = nlp_service.extract_skills(text)
    keywords = nlp_service.analyze_keywords(text, skills)
    return keywords

@app.post("/weak-verb-analysis")
def weak_verb_analysis(payload: TextRequest):
    weak_verbs = nlp_service.analyze_weak_verbs(payload.text)
    return {"weak_verbs": weak_verbs}

@app.post("/predict-improvement")
def predict_improvement_endpoint(payload: PredictImprovementRequest):
    results = ats_service.predict_improvement(payload.current_score, payload.suggestions)
    return results

@app.get("/history")
def get_history():
    reports = db.get_all_reports()
    return reports

@app.delete("/history/{id}")
def delete_history_item(id: int):
    success = db.delete_report(id)
    if success:
        return {"status": "success", "message": f"Report {id} deleted successfully"}
    raise HTTPException(status_code=404, detail="Report not found")
