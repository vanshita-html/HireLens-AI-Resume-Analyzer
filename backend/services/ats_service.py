from typing import Dict, List, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
from services.nlp_service import extract_skills, SKILL_CATEGORIES

def calculate_ats_score(
    text: str,
    personal_info: Dict[str, Any],
    sections_found: Dict[str, bool],
    skills_found: List[str],
    weak_verbs: List[Dict[str, str]]
) -> Dict[str, Any]:
    """
    Calculates the ATS score out of 100 based on completeness, skills, contacts, sections, and quality.
    """
    # 1. Resume Completeness (30%)
    # Word count and structure check
    words = text.split()
    word_count = len(words)
    completeness_score = 0
    if 300 <= word_count <= 1200:
        completeness_score += 15
    elif 150 <= word_count < 300 or 1200 < word_count <= 2000:
        completeness_score += 10
    else:
        completeness_score += 5
        
    # Sentence and density structure check
    sentences = re.split(r'[.!?]+', text)
    sentence_count = len([s for s in sentences if s.strip()])
    if sentence_count >= 15:
        completeness_score += 15
    elif 5 <= sentence_count < 15:
        completeness_score += 10
    else:
        completeness_score += 5

    # 2. Skills Coverage (30%)
    # Based on the number of recognized skills
    num_skills = len(skills_found)
    if num_skills >= 8:
        skills_score = 30
    elif num_skills >= 5:
        skills_score = 25
    elif num_skills >= 3:
        skills_score = 18
    elif num_skills >= 1:
        skills_score = 10
    else:
        skills_score = 0

    # 3. Contact Information (10%)
    contact_score = 0
    if personal_info.get("name"): contact_score += 2
    if personal_info.get("email"): contact_score += 2
    if personal_info.get("phone"): contact_score += 2
    if personal_info.get("linkedin"): contact_score += 2
    if personal_info.get("github"): contact_score += 2

    # 4. Section Presence (15%)
    sections_score = 0
    # 5 standard sections
    for sec, found in sections_found.items():
        if found:
            sections_score += 3

    # 5. Resume Quality (15%)
    # Deduct points for weak verbs
    num_weak = len(weak_verbs)
    if num_weak == 0:
        quality_score = 15
    elif num_weak <= 2:
        quality_score = 12
    elif num_weak <= 4:
        quality_score = 8
    elif num_weak <= 6:
        quality_score = 4
    else:
        quality_score = 0

    total_score = completeness_score + skills_score + contact_score + sections_score + quality_score

    # Determine strength level
    if total_score >= 90:
        strength = "Excellent"
    elif total_score >= 75:
        strength = "Good"
    elif total_score >= 60:
        strength = "Average"
    else:
        strength = "Needs Improvement"

    return {
        "ats_score": total_score,
        "strength": strength,
        "score_breakdown": {
            "completeness": completeness_score,
            "skills": skills_score,
            "contact": contact_score,
            "sections": sections_score,
            "quality": quality_score
        }
    }

def match_job_description(resume_text: str, jd_text: str) -> Dict[str, Any]:
    """
    Compares the resume text against the job description using TF-IDF and Cosine Similarity.
    Also extracts matching and missing skills.
    """
    if not resume_text.strip() or not jd_text.strip():
        return {
            "match_percentage": 0,
            "matching_skills": [],
            "missing_skills": []
        }

    # Cosine Similarity
    try:
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf = vectorizer.fit_transform([resume_text, jd_text])
        sim = cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0]
        match_percentage = round(sim * 100)
    except Exception as e:
        print(f"Error in cosine similarity calculation: {e}")
        match_percentage = 45 # Fallback score

    # Extract skills from Resume and JD
    resume_skills = set(extract_skills(resume_text))
    jd_skills = set(extract_skills(jd_text))

    matching_skills = sorted(list(resume_skills.intersection(jd_skills)))
    missing_skills = sorted(list(jd_skills.difference(resume_skills)))

    # If missing skills is empty and matching is empty, we can extract generic keywords from JD
    # to suggest as missing skills, but using our skill vocabulary is more reliable.
    # Let's add a boost to match percentage if there are more matching skills
    if jd_skills:
        skill_match_ratio = len(matching_skills) / len(jd_skills)
        # Combine TF-IDF score and skill match ratio for a more realistic ATS rating
        match_percentage = round((match_percentage * 0.4) + (skill_match_ratio * 60))
    
    # Cap between 5% and 98% (rarely 100% unless perfect match)
    match_percentage = max(min(match_percentage, 98), 5)

    return {
        "match_percentage": match_percentage,
        "matching_skills": matching_skills,
        "missing_skills": missing_skills
    }

def generate_suggestions(
    personal_info: Dict[str, Any],
    sections_found: Dict[str, bool],
    skills_found: List[str],
    weak_verbs: List[Dict[str, str]]
) -> List[Dict[str, str]]:
    """
    Generates actionable resume enhancement suggestions sorted by importance.
    """
    suggestions = []

    # 1. Contact links missing
    if not personal_info.get("github"):
        suggestions.append({
            "suggestion": "Add GitHub Profile Link",
            "description": "Showcase your source code, projects, and collaboration history directly to recruiters.",
            "priority": "High"
        })
    if not personal_info.get("linkedin"):
        suggestions.append({
            "suggestion": "Add LinkedIn Profile Link",
            "description": "Provide a link to your online professional network to help recruiters verify your profile.",
            "priority": "High"
        })

    # 2. Key sections missing
    if not sections_found.get("projects"):
        suggestions.append({
            "suggestion": "Add a Dedicated Projects Section",
            "description": "Structure your academic or personal projects clearly with technologies used and outcomes.",
            "priority": "High"
        })
    if not sections_found.get("experience"):
        suggestions.append({
            "suggestion": "Include Professional Experience / Internships",
            "description": "Add any internships, part-time work, or freelance engagements to show corporate relevance.",
            "priority": "Medium"
        })
    if not sections_found.get("certifications"):
        suggestions.append({
            "suggestion": "Add Certifications Section",
            "description": "Include relevant certifications (AWS, Google Cloud, FreeCodeCamp, etc.) to validate your skills.",
            "priority": "Medium"
        })

    # 3. Weak verbs replacement
    if len(weak_verbs) > 2:
        suggestions.append({
            "suggestion": "Replace Weak Action Verbs",
            "description": f"You used {len(weak_verbs)} weak verbs (e.g., 'worked on', 'helped with'). Replace them with strong verbs.",
            "priority": "High"
        })

    # 4. Skill expansion
    if len(skills_found) < 5:
        suggestions.append({
            "suggestion": "Expand Technical Skills Keywords",
            "description": "Extract more core skills from your projects and add them as tags so ATS scanners register your expertise.",
            "priority": "High"
        })
    elif len(skills_found) < 8:
        suggestions.append({
            "suggestion": "Include Modern Tooling / Cloud Tech",
            "description": "Add cloud technologies (AWS/GCP), containerization (Docker), or CI/CD pipelines to stand out.",
            "priority": "Medium"
        })

    # 5. Quantifiable achievements
    suggestions.append({
        "suggestion": "Use Quantifiable Metrics",
        "description": "Instead of describing tasks, include numbers (e.g., 'Optimized database queries, reducing loading time by 30%').",
        "priority": "Medium"
    })

    # Sort suggestions: High priority first
    priority_order = {"High": 0, "Medium": 1, "Low": 2}
    suggestions = sorted(suggestions, key=lambda x: priority_order.get(x["priority"], 3))

    return suggestions

def predict_improvement(
    current_score: int,
    suggestions: List[Dict[str, str]]
) -> Dict[str, Any]:
    """
    Predicts the future ATS score and point gain if recommendations are implemented.
    """
    points_to_gain = 0
    for sug in suggestions:
        priority = sug.get("priority", "Medium")
        if priority == "High":
            points_to_gain += 4
        elif priority == "Medium":
            points_to_gain += 2
        else:
            points_to_gain += 1

    # Cap potential score at 95 (no resume is perfect)
    potential_score = min(current_score + points_to_gain, 95)
    
    # Ensure potential score is at least current score + 5 if there are suggestions
    if suggestions and potential_score <= current_score:
        potential_score = min(current_score + 8, 95)
        
    actual_gain = potential_score - current_score
    if actual_gain < 0:
        actual_gain = 0
        potential_score = current_score

    return {
        "current_score": current_score,
        "potential_score": potential_score,
        "gain": actual_gain
    }
