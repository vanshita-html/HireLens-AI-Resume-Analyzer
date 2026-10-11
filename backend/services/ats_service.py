from typing import Dict, List, Any, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
from services.nlp_service import extract_skills, extract_quantified_metrics

def calculate_ats_score(
    text: str,
    personal_info: Dict[str, Any],
    sections_found: Dict[str, bool],
    skills_found: List[str],
    weak_verbs: List[Dict[str, str]]
) -> Dict[str, Any]:
    """
    Calculates a balanced, realistic Estimated ATS Score out of 100 based on 5 transparent criteria.
    Includes factor breakdowns, plain-language explanations, and improvement tips.
    Penalizes missing quantified metrics, weak verbs, missing LinkedIn/GitHub, very short or very long resumes,
    and missing sections so typical resumes score between 55 and 90.
    """
    # 1. Resume Completeness & Structure (max 25)
    words = text.split()
    word_count = len(words)
    sentences = [s for s in re.split(r'[.!?\n]+', text) if len(s.strip().split()) >= 3]
    sentence_count = len(sentences)
    
    completeness_score = 0
    if 400 <= word_count <= 800:
        completeness_score += 13
    elif 320 <= word_count < 400 or 801 <= word_count <= 950:
        completeness_score += 9
    elif 200 <= word_count < 320:
        completeness_score += 5  # Too short
    elif 951 <= word_count <= 1300:
        completeness_score += 6  # Too long
    elif word_count < 200:
        completeness_score += 2  # Severely short penalty
    else:
        completeness_score += 3  # Severely long penalty (>1300)
        
    if sentence_count >= 14:
        completeness_score += 12
    elif sentence_count >= 9:
        completeness_score += 8
    elif sentence_count >= 5:
        completeness_score += 4
    else:
        completeness_score += 1
    completeness_score = min(completeness_score, 25)

    # 2. Skills Coverage (max 25)
    num_skills = len(skills_found)
    if num_skills >= 12:
        skills_score = 25
    elif num_skills >= 9:
        skills_score = 21
    elif num_skills >= 7:
        skills_score = 17
    elif num_skills >= 5:
        skills_score = 13
    elif num_skills >= 3:
        skills_score = 8
    elif num_skills >= 1:
        skills_score = 4
    else:
        skills_score = 0

    # 3. Contact Information (max 15)
    contact_score = 0
    if personal_info.get("name"): contact_score += 3
    if personal_info.get("email"): contact_score += 3
    if personal_info.get("phone"): contact_score += 3
    if personal_info.get("linkedin"): contact_score += 3  # Missing penalized
    if personal_info.get("github"): contact_score += 3    # Missing penalized

    # 4. Section Presence (max 20)
    section_weights = {
        "experience": 5,
        "skills": 5,
        "education": 4,
        "projects": 3,
        "certifications": 3
    }
    sections_score = 0
    for sec, weight in section_weights.items():
        if sections_found.get(sec, False):
            sections_score += weight

    # 5. Language Quality & Impact (max 15)
    # Evaluates both weak action phrasing and missing quantified metrics
    metrics_found = extract_quantified_metrics(text)
    num_metrics = len(metrics_found)
    num_weak = len(weak_verbs)

    # Action phrasing component (max 8)
    if num_weak == 0:
        verb_score = 8
    elif num_weak == 1:
        verb_score = 6
    elif num_weak == 2:
        verb_score = 4
    elif num_weak == 3:
        verb_score = 2
    else:
        verb_score = 0

    # Quantified metrics component (max 7)
    if num_metrics >= 4:
        metrics_score = 7
    elif num_metrics >= 2:
        metrics_score = 5
    elif num_metrics == 1:
        metrics_score = 3
    else:
        metrics_score = 0  # Missing quantified metrics penalty

    quality_score = verb_score + metrics_score

    total_score = completeness_score + skills_score + contact_score + sections_score + quality_score
    total_score = max(min(round(total_score), 98), 10)

    # Strength indicator
    if total_score >= 85:
        strength = "Strong Match"
    elif total_score >= 70:
        strength = "Competitive"
    elif total_score >= 55:
        strength = "Moderate"
    else:
        strength = "Needs Optimization"

    factor_details = {
        "completeness": {
            "name": "Resume Completeness",
            "score": completeness_score,
            "max": 25,
            "explanation": f"Resume contains {word_count} words and {sentence_count} key statements (optimal range: 400-800 words).",
            "tip": "Maintain a concise 1-page length (400-800 words) with structured bullet points."
        },
        "skills": {
            "name": "Skills Coverage",
            "score": skills_score,
            "max": 25,
            "explanation": f"Detected {num_skills} recognized technical and domain skill keywords.",
            "tip": "Group relevant technical proficiencies and tooling under a dedicated Skills section."
        },
        "contact": {
            "name": "Contact Information",
            "score": contact_score,
            "max": 15,
            "explanation": "Evaluates essential identifiers: Name, email, phone, LinkedIn, and GitHub profiles.",
            "tip": "Ensure both LinkedIn and GitHub links are formatted as clean, clickable URLs."
        },
        "sections": {
            "name": "Section Presence",
            "score": sections_score,
            "max": 20,
            "explanation": f"Identified {sum(1 for v in sections_found.values() if v)} of 5 standard sections (Education, Skills, Experience, Projects, Certifications).",
            "tip": "Use standard section titles that ATS parsers recognize without ambiguity."
        },
        "quality": {
            "name": "Language Quality",
            "score": quality_score,
            "max": 15,
            "explanation": f"Found {num_weak} passive or weak phrases and {num_metrics} quantified accomplishment metrics.",
            "tip": "Begin bullet points with strong action verbs and quantify achievements with data (e.g., %, $, scale)."
        }
    }

    return {
        "ats_score": total_score,
        "strength": strength,
        "label": "Estimated ATS Score",
        "disclaimer": "Note: Real-world ATS algorithms vary by employer and system configuration (e.g. Workday, Taleo, Greenhouse).",
        "score_breakdown": {
            "completeness": completeness_score,
            "skills": skills_score,
            "contact": contact_score,
            "sections": sections_score,
            "quality": quality_score
        },
        "factor_details": factor_details
    }

def match_job_description(resume_text: str, jd_text: str, role_title: Optional[str] = None) -> Dict[str, Any]:
    """
    Compares the resume text against the job description.
    Enforces a minimum word count of 50 words to avoid garbage/spam input.
    Detects skills and produces logically consistent results.
    """
    clean_resume = resume_text.strip()
    clean_jd = jd_text.strip()
    words = clean_jd.split()

    if len(words) < 50:
        return {
            "status": "error",
            "error_type": "insufficient_length",
            "message": f"Job description is too brief ({len(words)} words). Please enter at least 50 words containing requirements and responsibilities for a meaningful match.",
            "word_count": len(words),
            "match_percentage": 0,
            "matching_skills": [],
            "missing_skills": [],
            "has_skills": False
        }

    # Extract skills
    resume_skills = set(extract_skills(clean_resume))
    jd_skills = set(extract_skills(clean_jd))

    # If no skills could be extracted from the JD
    if len(jd_skills) == 0:
        return {
            "status": "warning",
            "error_type": "no_skills_detected",
            "message": "We couldn't detect recognized technical or domain skills in this job description. Try adding specific responsibilities, qualifications, or tooling keywords.",
            "word_count": len(words),
            "match_percentage": 0,
            "matching_skills": [],
            "missing_skills": [],
            "has_skills": False,
            "role_title": role_title or "Target Role"
        }

    matching_skills = sorted(list(resume_skills.intersection(jd_skills)))
    missing_skills = sorted(list(jd_skills.difference(resume_skills)))

    # Compute TF-IDF Cosine Similarity
    try:
        vectorizer = TfidfVectorizer(stop_words='english', min_df=1)
        tfidf = vectorizer.fit_transform([clean_resume, clean_jd])
        cosine_sim = float(cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0])
    except Exception:
        cosine_sim = 0.2

    # Skill overlap ratio
    skill_ratio = len(matching_skills) / len(jd_skills)

    # Weighted calculation: 65% skill overlap + 35% overall textual alignment
    raw_score = (skill_ratio * 65.0) + (cosine_sim * 35.0)
    match_percentage = int(round(raw_score))

    # Guardrails:
    if len(matching_skills) == 0:
        # If zero matching skills, score should never be inflated
        match_percentage = min(match_percentage, 15)
    elif len(missing_skills) == 0 and len(matching_skills) > 0:
        # Full skill coverage
        match_percentage = max(match_percentage, 90)

    match_percentage = max(min(match_percentage, 98), 5)

    # Feedback message
    if match_percentage >= 80:
        feedback = "Outstanding alignment! Your resume covers the core competencies required for this role."
    elif match_percentage >= 60:
        feedback = "Solid match. Adding the missing skills listed below will significantly boost ATS ranking."
    elif match_percentage >= 40:
        feedback = "Moderate match. Several critical qualifications from the JD are missing from your resume."
    else:
        feedback = "Low alignment. Your resume currently lacks the primary technologies and requirements for this role."

    return {
        "status": "success",
        "match_percentage": match_percentage,
        "matching_skills": matching_skills,
        "missing_skills": missing_skills,
        "has_skills": True,
        "word_count": len(words),
        "total_jd_skills_count": len(jd_skills),
        "matching_count": len(matching_skills),
        "missing_count": len(missing_skills),
        "feedback": feedback,
        "role_title": role_title or "Target Role",
        "explanation": f"Matched {len(matching_skills)} out of {len(jd_skills)} required skill keywords with {int(cosine_sim * 100)}% semantic context similarity."
    }

def generate_suggestions(
    personal_info: Dict[str, Any],
    sections_found: Dict[str, bool],
    skills_found: List[str],
    weak_verbs: List[Dict[str, str]]
) -> List[Dict[str, str]]:
    """
    Generates actionable resume enhancement suggestions prioritized into High, Medium, and Low.
    """
    suggestions = []

    # 1. Contact links
    if not personal_info.get("linkedin"):
        suggestions.append({
            "suggestion": "Include LinkedIn Profile URL",
            "description": "Recruiters and hiring managers check LinkedIn to verify your background and endorsements.",
            "priority": "High"
        })
    if not personal_info.get("github"):
        suggestions.append({
            "suggestion": "Add GitHub Portfolio Link",
            "description": "Showcase your real codebase, repositories, and collaboration history directly on your resume header.",
            "priority": "High"
        })

    # 2. Key sections
    if not sections_found.get("experience"):
        suggestions.append({
            "suggestion": "Include Work Experience or Internships",
            "description": "Add any internships, freelance projects, or relevant professional roles with bullet points highlighting results.",
            "priority": "High"
        })
    if not sections_found.get("projects"):
        suggestions.append({
            "suggestion": "Add Dedicated Projects Section",
            "description": "Detail 2-3 prominent technical projects specifying tech stack, architecture, and live links or repos.",
            "priority": "High"
        })
    if not sections_found.get("certifications"):
        suggestions.append({
            "suggestion": "Add Certifications Section",
            "description": "List relevant credentials (e.g., AWS, Azure, Google Cloud, Coursera) to validate specialized proficiencies.",
            "priority": "Medium"
        })

    # 3. Action verbs
    num_weak = len(weak_verbs)
    if num_weak == 1:
        first_rep = weak_verbs[0].get('replacement', 'Implemented, Built, Developed')
        first_weak = weak_verbs[0].get('weak', 'worked on')
        suggestions.append({
            "suggestion": "Replace 1 weak action verb",
            "description": f"Replace generic phrasing like '{first_weak}' with contextually commanding verbs such as {first_rep}.",
            "priority": "Medium"
        })
    elif num_weak > 1:
        first_rep = weak_verbs[0].get('replacement', 'Implemented, Built, Developed')
        first_weak = weak_verbs[0].get('weak', 'worked on')
        suggestions.append({
            "suggestion": f"Replace {num_weak} weak action verbs",
            "description": f"Replace generic phrasing like '{first_weak}' with contextually commanding verbs such as {first_rep}.",
            "priority": "High" if num_weak >= 3 else "Medium"
        })

    # 4. Skill breadth
    if len(skills_found) < 5:
        suggestions.append({
            "suggestion": "Expand Core Technical Skills",
            "description": "You currently have fewer than 5 detected skill keywords. Group languages, frameworks, and databases under a clear header.",
            "priority": "High"
        })
    elif len(skills_found) < 9:
        suggestions.append({
            "suggestion": "Include Modern Tooling & Cloud Stack",
            "description": "Add complementary developer tooling such as Docker, CI/CD, Git, or unit testing frameworks.",
            "priority": "Medium"
        })

    # 5. Quantifiable metrics
    suggestions.append({
        "suggestion": "Quantify Achievements with Data",
        "description": "Incorporate measurable impact (e.g., 'Reduced API latency by 35%', 'Served 10k+ daily users'). ATS parsers favor quantified bullets.",
        "priority": "Medium"
    })

    # 6. Formatting & Structure
    suggestions.append({
        "suggestion": "Ensure Standard Single-Column Layout",
        "description": "Multi-column tables or text-boxes frequently break ATS parsers. Stick to standard headings and left-aligned text.",
        "priority": "Low"
    })

    # Priority sorting: High first, then Medium, then Low
    priority_order = {"High": 0, "Medium": 1, "Low": 2}
    return sorted(suggestions, key=lambda x: priority_order.get(x["priority"], 3))

def predict_improvement(
    current_score: int,
    suggestions: List[Dict[str, str]]
) -> Dict[str, Any]:
    """
    Predicts the future ATS score and point gain if recommendations are implemented.
    The predicted target must always be higher than the current score (cap at 100).
    If current score is 95 or above, marks top range.
    Computes target from actual high-priority suggestions.
    """
    high_priority = [s for s in suggestions if s.get("priority") == "High"]
    medium_priority = [s for s in suggestions if s.get("priority") == "Medium"]

    # Compute gain based directly on the actual high-priority suggestions
    high_gain = 0
    for s in high_priority:
        text_sug = s.get("suggestion", "")
        if "Section" in text_sug or "Skills" in text_sug:
            high_gain += 5
        elif "LinkedIn" in text_sug or "GitHub" in text_sug:
            high_gain += 4
        elif "weak" in text_sug.lower() or "verb" in text_sug.lower():
            high_gain += 4
        else:
            high_gain += 3

    if high_gain == 0:
        high_gain = min(len(medium_priority) * 2, 8) if medium_priority else 3

    # The predicted target must always be higher than the current score (capped at 100)
    if current_score < 100:
        if current_score >= 95:
            # When current score is 95+, aim for achievable points up to 100
            step = max(1, min(high_gain, 100 - current_score))
            potential_score = min(100, current_score + step)
            if potential_score <= current_score:
                potential_score = 100
        else:
            potential_score = min(100, current_score + max(high_gain, 4))
            if potential_score <= current_score:
                potential_score = min(100, current_score + 1)
        actual_gain = potential_score - current_score
    else:
        potential_score = 100
        actual_gain = 0

    top_range = current_score >= 95

    return {
        "current_score": current_score,
        "potential_score": potential_score,
        "gain": actual_gain,
        "top_range": top_range,
        "badge_text": "Already in the top range" if top_range else f"+{actual_gain} pts gain"
    }
