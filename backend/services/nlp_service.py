import re
import spacy
import sys
import subprocess
from typing import Dict, List, Any

nlp = None

def get_spacy_nlp():
    global nlp
    if nlp is not None:
        return nlp
    try:
        nlp = spacy.load("en_core_web_sm")
    except OSError:
        try:
            print("spaCy model en_core_web_sm not found. Downloading...")
            subprocess.run([sys.executable, "-m", "spacy", "download", "en_core_web_sm"], check=True)
            nlp = spacy.load("en_core_web_sm")
        except Exception as e:
            print(f"Failed to load/download spaCy model: {e}. Falling back to basic string parsing.")
            nlp = None
    return nlp

# Predefined skill database categorised
SKILL_CATEGORIES = {
    "Programming": ["Java", "Python", "C\\+\\+", "JavaScript", "SQL", "TypeScript", "Ruby", "Go", "Rust", "C#", "PHP", "Kotlin", "Swift"],
    "Web Development": ["React", "Node\\.js", "Express", "HTML", "CSS", "Angular", "Vue", "Next\\.js", "Django", "Flask", "Bootstrap", "Tailwind", "Svelte", "jQuery", "Webflow"],
    "AI / ML": ["Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "NLP", "Natural Language Processing", "Computer Vision", "Scikit-learn", "Keras", "spaCy", "NLTK", "OpenCV", "Hugging Face"],
    "Data Analytics": ["Power BI", "Tableau", "Excel", "Pandas", "NumPy", "Spark", "Hadoop", "Matplotlib", "Seaborn", "SQL Server", "PostgreSQL", "MongoDB", "MySQL"]
}

# General high-demand keywords to check/suggest
RECOMMENDED_KEYWORDS = [
    "Docker", "AWS", "REST API", "CI/CD", "Git", "GitHub", "FastAPI", "Kubernetes", "Jira", "Agile",
    "Cloud Computing", "Microservices", "Unit Testing", "System Design", "GraphQL", "Redis", "Docker Compose"
]

WEAK_VERBS_MAP = {
    "worked on": ["Developed", "Engineered", "Designed", "Architected", "Spearheaded"],
    "helped with": ["Collaborated on", "Assisted in", "Facilitated", "Contributed to"],
    "responsible for": ["Led", "Executed", "Managed", "Directed", "Oversaw"],
    "assisted in": ["Collaborated on", "Supported", "Aided", "Partnered in"],
    "participated in": ["Engaged in", "Contributed to", "Partnered in", "Cooperated in"],
    "handled": ["Managed", "Orchestrated", "Administered", "Executed"],
    "took care of": ["Managed", "Supervised", "Maintained", "Optimized"]
}

def extract_personal_info(text: str) -> Dict[str, Any]:
    """
    Extracts name, email, phone, and links using regex and spaCy.
    """
    info = {
        "name": None,
        "email": None,
        "phone": None,
        "linkedin": None,
        "github": None
    }
    
    # Clean text lines
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    
    # 1. Email Regex
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    if email_match:
        info["email"] = email_match.group(0)
        
    # 2. Phone Regex (supports formats like +1-234-567-8900, (123) 456-7890, etc.)
    phone_match = re.search(r'(?:(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?\d{9,13})', text)
    if phone_match:
        info["phone"] = phone_match.group(0)
        
    # 3. LinkedIn & GitHub Links
    linkedin_match = re.search(r'(?:https?://)?(?:www\.)?linkedin\.com/in/[\w\.-]+', text, re.IGNORECASE)
    if linkedin_match:
        info["linkedin"] = linkedin_match.group(0)
        
    github_match = re.search(r'(?:https?://)?(?:www\.)?github\.com/[\w\.-]+', text, re.IGNORECASE)
    if github_match:
        info["github"] = github_match.group(0)
        
    # 4. Name extraction
    # Heuristic: The name is usually at the top. Let's look at the first 3 lines.
    # Exclude lines that contain emails, phone numbers, website links, or common section titles.
    common_exclusions = ["resume", "cv", "curriculum vitae", "education", "experience", "skills", "summary"]
    potential_names = []
    
    for line in lines[:5]:
        line_lower = line.lower()
        # Skip if contains contact elements
        if "@" in line or "http" in line or "linkedin" in line or "github" in line or any(ex in line_lower for ex in common_exclusions):
            continue
        # Check if line looks like a name (2-3 words, mostly alphabetic)
        words = line.split()
        if 2 <= len(words) <= 4 and all(w.isalpha() or w.replace(".", "").isalpha() for w in words):
            potential_names.append(line)
            
    if potential_names:
        info["name"] = potential_names[0]
    else:
        # Fallback to spaCy PERSON NER if available
        sp_nlp = get_spacy_nlp()
        if sp_nlp:
            doc = sp_nlp(text[:1000]) # Scan first 1000 characters
            for ent in doc.ents:
                if ent.label_ == "PERSON":
                    # Simple sanitization
                    name_words = ent.text.strip().split()
                    if 1 < len(name_words) <= 3 and "\n" not in ent.text:
                        info["name"] = ent.text.strip()
                        break

    return info

def check_section_presence(text: str) -> Dict[str, bool]:
    """
    Checks for the presence of standard resume sections.
    """
    text_lower = text.lower()
    
    sections = {
        "education": ["education", "academic", "university", "college", "school", "qualification"],
        "skills": ["skills", "technical skills", "technologies", "expertise", "proficiencies", "core competencies"],
        "experience": ["experience", "employment", "work history", "professional experience", "internship", "professional background"],
        "projects": ["projects", "academic projects", "key projects", "personal projects"],
        "certifications": ["certifications", "certificates", "courses", "licenses"]
    }
    
    presence = {}
    for section, keywords in sections.items():
        # Match as whole word or section header line
        found = False
        for kw in keywords:
            # Look for keyword with boundary
            pattern = rf'\b{re.escape(kw)}\b'
            if re.search(pattern, text_lower):
                found = True
                break
        presence[section] = found
        
    return presence

def extract_skills(text: str) -> List[str]:
    """
    Extracts matches for skills defined in SKILL_CATEGORIES.
    """
    found_skills = set()
    text_lower = text.lower()
    
    for category, skills in SKILL_CATEGORIES.items():
        for skill in skills:
            # Clean skill search pattern
            # Replace C\\+\\+ pattern with custom boundary check because + isn't a word character
            if skill == "C\\+\\+":
                pattern = r'\bc\+\+'
            elif skill == "C#":
                pattern = r'\bc#'
            elif skill == "Next\\.js":
                pattern = r'\bnext\.js\b'
            elif skill == "Node\\.js":
                pattern = r'\bnode\.js\b'
            elif skill == "Express":
                pattern = r'\bexpress\b'
            else:
                # Standard word boundaries
                pattern = rf'\b{re.escape(skill.lower())}\b'
                
            if re.search(pattern, text_lower):
                # Save display name of skill (strip regex escape characters if any)
                display_name = skill.replace("\\", "")
                found_skills.add(display_name)
                
    return sorted(list(found_skills))

def analyze_weak_verbs(text: str) -> List[Dict[str, str]]:
    """
    Finds instances of weak resume language and suggests strong replacements.
    """
    weak_findings = []
    lines = text.split("\n")
    
    for line in lines:
        line_clean = line.strip()
        if not line_clean:
            continue
        line_lower = line_clean.lower()
        
        for weak_phrase, improvements in WEAK_VERBS_MAP.items():
            pattern = rf'\b{re.escape(weak_phrase)}\b'
            match = re.search(pattern, line_lower)
            if match:
                # Found weak verb! Construct context
                # Highlight weak verb in context, or provide context sentence
                weak_findings.append({
                    "weak": line_clean[match.start():match.end()],
                    "replacement": improvements[0] + " (or " + ", ".join(improvements[1:]) + ")",
                    "context": line_clean
                })
                break # Move to next line once one weak verb is found on it
                
    return weak_findings[:10] # limit to top 10 weak verbs

def analyze_keywords(text: str, skills_found: List[str]) -> Dict[str, Any]:
    """
    Generates a list of missing, frequently used, and recommended keywords.
    """
    text_lower = text.lower()
    
    # 1. Frequently Used Keywords:
    # Look for words in text and count. We can filter for tech words or just general nouns/skills.
    # Let's count occurrences of skills_found
    freq_keywords = []
    for skill in skills_found:
        count = len(re.findall(rf'\b{re.escape(skill.lower())}\b', text_lower))
        if count >= 2:
            freq_keywords.append({"keyword": skill, "count": count})
            
    # Sort by count descending
    freq_keywords = sorted(freq_keywords, key=lambda x: x["count"], reverse=True)[:5]
    
    # 2. Recommended Keywords:
    # High-demand tech stack keywords that are general but fit nicely.
    recommended = []
    for kw in RECOMMENDED_KEYWORDS:
        if kw.lower() not in text_lower:
            recommended.append(kw)
            
    # 3. Missing Keywords:
    # Keywords that fit their profile. E.g., if they do Python/ML, they might miss PyTorch/Tensorflow.
    # Let's define a simple mapping of profile keywords:
    missing = []
    profile_rules = {
        "react": ["Redux", "TypeScript", "Webpack", "Tailwind CSS", "Jest"],
        "python": ["Django", "Flask", "Docker", "Pytest", "Git"],
        "machine learning": ["PyTorch", "TensorFlow", "MLflow", "Docker", "AWS"],
        "sql": ["PostgreSQL", "Database Design", "Redis", "NoSQL"]
    }
    
    skills_lower = [s.lower() for s in skills_found]
    for key_skill, missing_candidates in profile_rules.items():
        if key_skill in skills_lower:
            for candidate in missing_candidates:
                if candidate.lower() not in text_lower:
                    missing.append(candidate)
                    
    # Remove duplicates from missing and make sure they are not in recommended
    missing = list(set(missing))[:6]
    # If missing is empty, provide a default list of tech standard tools
    if not missing:
        missing = [kw for kw in RECOMMENDED_KEYWORDS[:5] if kw.lower() not in text_lower]
        
    return {
        "frequent": freq_keywords,
        "missing": missing,
        "recommended": recommended[:6]
    }
