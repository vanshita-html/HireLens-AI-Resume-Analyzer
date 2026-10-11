import re
import spacy
import sys
import subprocess
from typing import Dict, List, Any, Optional

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
    "Programming": ["Java", "Python", "C\\+\\+", "JavaScript", "SQL", "TypeScript", "Ruby", "Go", "Rust", "C#", "PHP", "Kotlin", "Swift", "Bash"],
    "Web Development": ["React", "Node\\.js", "Express", "HTML", "CSS", "Angular", "Vue", "Next\\.js", "Django", "Flask", "Bootstrap", "Tailwind", "Svelte", "jQuery", "GraphQL", "Redux"],
    "AI / ML": ["Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "NLP", "Natural Language Processing", "Computer Vision", "Scikit-learn", "Keras", "spaCy", "NLTK", "OpenCV", "Hugging Face", "MLflow"],
    "Data Analytics": ["Power BI", "Tableau", "Excel", "Pandas", "NumPy", "Spark", "Hadoop", "Matplotlib", "Seaborn", "PostgreSQL", "MongoDB", "MySQL", "Redis"],
    "Cloud & DevOps": ["Docker", "Kubernetes", "AWS", "Azure", "GCP", "CI/CD", "Git", "GitHub", "Linux", "Terraform", "Microservices"]
}

# Role-specific keywords for targeted keyword matching
ROLE_KEYWORDS: Dict[str, List[str]] = {
    "Full-Stack Developer": [
        "React", "Node.js", "TypeScript", "REST API", "PostgreSQL", "Docker", "Git", "Redux", "Tailwind", "CI/CD", "Next.js", "Express", "MongoDB", "Unit Testing", "Microservices"
    ],
    "Frontend Developer": [
        "React", "JavaScript", "TypeScript", "HTML", "CSS", "Tailwind", "Next.js", "Redux", "Webpack", "Responsive Design", "UI/UX", "Jest", "Git", "Performance Optimization"
    ],
    "Backend Developer": [
        "Python", "Node.js", "FastAPI", "Django", "SQL", "PostgreSQL", "Docker", "Redis", "Microservices", "REST API", "Git", "Kubernetes", "AWS", "Database Design", "Security"
    ],
    "Data Analyst": [
        "Python", "SQL", "Excel", "Power BI", "Tableau", "Pandas", "NumPy", "Data Visualization", "Statistics", "ETL", "Matplotlib", "Seaborn", "PostgreSQL", "Data Cleansing"
    ],
    "Machine Learning Engineer": [
        "Python", "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Scikit-learn", "NLP", "Computer Vision", "Docker", "AWS", "MLflow", "Pandas", "Model Evaluation"
    ],
    "DevOps / Cloud Engineer": [
        "Docker", "Kubernetes", "AWS", "CI/CD", "Linux", "Terraform", "Git", "Python", "Bash", "Prometheus", "Cloud Computing", "Monitoring", "Security"
    ],
    "Mobile App Developer": [
        "Kotlin", "Swift", "React Native", "Flutter", "iOS", "Android", "REST API", "Git", "Firebase", "Mobile UI", "TypeScript", "App Store Deployment"
    ]
}

# General recommended keywords
RECOMMENDED_KEYWORDS = [
    "Docker", "AWS", "REST API", "CI/CD", "Git", "GitHub", "FastAPI", "Kubernetes", "Jira", "Agile",
    "Cloud Computing", "Microservices", "Unit Testing", "System Design", "GraphQL", "Redis", "Docker Compose"
]

WEAK_VERBS_MAP = {
    "worked on": ["Architected", "Engineered", "Spearheaded", "Implemented", "Delivered"],
    "helped with": ["Co-engineered", "Accelerated", "Collaborated on", "Streamlined", "Contributed to"],
    "responsible for": ["Owned", "Spearheaded", "Directed", "Executed", "Administered"],
    "assisted in": ["Partnered in", "Reinforced", "Facilitated", "Collaborated on"],
    "participated in": ["Co-developed", "Spearheaded initiative in", "Contributed to", "Coordinated"],
    "handled": ["Orchestrated", "Resolved", "Managed", "Optimized", "Scaled"],
    "took care of": ["Oversaw", "Administered", "Streamlined", "Resolved"],
    "did": ["Executed", "Implemented", "Constructed", "Achieved"],
    "made": ["Constructed", "Authored", "Established", "Generated"],
    "involved in": ["Pioneered", "Partnered in", "Designed", "Executed"],
    "looked after": ["Maintained", "Safeguarded", "Supervised", "Monitored"],
    "supported": ["Maintained reliability of", "Reinforced", "Upgraded", "Bolstered"]
}

def extract_personal_info(text: str) -> Dict[str, Any]:
    """
    Extracts name, email, phone, and links using regex and spaCy heuristics.
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
        
    # 2. Phone Regex
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
    common_exclusions = ["resume", "cv", "curriculum vitae", "education", "experience", "skills", "summary", "profile", "contact"]
    potential_names = []
    
    for line in lines[:5]:
        line_lower = line.lower()
        if "@" in line or "http" in line or "linkedin" in line or "github" in line or any(ex in line_lower for ex in common_exclusions):
            continue
        words = line.split()
        if 2 <= len(words) <= 4 and all(w.isalpha() or w.replace(".", "").isalpha() for w in words):
            potential_names.append(line)
            
    if potential_names:
        info["name"] = potential_names[0]
    else:
        # Fallback to spaCy PERSON NER
        sp_nlp = get_spacy_nlp()
        if sp_nlp:
            doc = sp_nlp(text[:1000])
            for ent in doc.ents:
                if ent.label_ == "PERSON":
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
        "education": ["education", "academic", "university", "college", "school", "qualification", "bachelor", "master"],
        "skills": ["skills", "technical skills", "technologies", "expertise", "proficiencies", "core competencies", "tools"],
        "experience": ["experience", "employment", "work history", "professional experience", "internship", "work experience", "career"],
        "projects": ["projects", "academic projects", "key projects", "personal projects", "portfolio"],
        "certifications": ["certifications", "certificates", "courses", "licenses", "credentials"]
    }
    
    presence = {}
    for section, keywords in sections.items():
        found = False
        for kw in keywords:
            pattern = rf'\b{re.escape(kw)}\b'
            if re.search(pattern, text_lower):
                found = True
                break
        presence[section] = found
        
    return presence

def extract_skills(text: str) -> List[str]:
    """
    Extracts matches for skills defined across all categories.
    """
    found_skills = set()
    text_lower = text.lower()
    
    for category, skills in SKILL_CATEGORIES.items():
        for skill in skills:
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
                pattern = rf'\b{re.escape(skill.lower())}\b'
                
            if re.search(pattern, text_lower):
                display_name = skill.replace("\\", "")
                found_skills.add(display_name)
                
    return sorted(list(found_skills))

def extract_quantified_metrics(text: str) -> List[str]:
    """
    Extracts measurable, data-driven accomplishments and metrics from resume text.
    """
    pattern = r'(\b\d+(?:\.\d+)?%|\b\d+(?:\.\d+)?x\b|\b\d+\+?\s*(?:users|clients|customers|requests|queries|endpoints|teams|engineers|projects|stars|downloads|dau|mau|qps|rps|tps|ms|seconds|minutes|hours|days|weeks|months|percent)\b|[\$€£]\d+(?:[,\.]\d+)?(?:\s*(?:k|m|million|thousand|billion))?|\b\d+(?:\.\d+)?[kKmM]\+?\b)'
    matches = re.findall(pattern, text, re.IGNORECASE)
    return matches

def get_contextual_replacement(weak_phrase: str, line: str, start: int, end: int) -> List[str]:
    """
    Determines action verb alternatives based on the immediate sentence and clause context.
    """
    window = line[start:min(len(line), end + 90)].lower()
    full = line.lower()
    ctx = window if len(window) > 10 else full

    # 1. Machine Learning, Preprocessing, Training & Data Pipelines
    if any(k in ctx for k in ["preprocess", "train", "dataset", "deep learning", "machine learning", "neural", "model", "pipeline"]):
        return ["Implemented", "Built", "Developed"]
    # 2. Backend, API, Database & Infrastructure
    if any(k in ctx for k in ["api", "backend", "microservice", "database", "infrastructure", "server", "endpoint", "query"]):
        return ["Architected", "Engineered", "Developed"]
    # 3. Frontend, UI, UX & Components
    if any(k in ctx for k in ["frontend", "ui", "ux", "component", "dashboard", "interface", "react", "css", "layout"]):
        return ["Designed", "Crafted", "Built"]
    # 4. Performance, Optimization & Scalability
    if any(k in ctx for k in ["optimiz", "latenc", "throughput", "scale", "scaling", "performan", "speed", "efficien"]):
        return ["Optimized", "Accelerated", "Streamlined"]
    # 5. Bugs, Issues & Troubleshooting
    if any(k in ctx for k in ["bug", "issue", "ticket", "incident", "defect", "fix", "troubleshoot"]):
        return ["Resolved", "Diagnosed", "Remediated"]
    # 6. Testing, QA & Verification
    if any(k in ctx for k in ["test", "qa", "coverage", "unit test", "validation", "audit"]):
        return ["Automated", "Validated", "Executed"]
    # 7. Team, Stakeholder & Project Leadership
    if any(k in ctx for k in ["team", "stakeholder", "cross-functional", "lead", "deliverable", "initiative"]):
        return ["Spearheaded", "Directed", "Orchestrated"]

    # Fallback to predefined mapped verbs
    base = WEAK_VERBS_MAP.get(weak_phrase.lower(), ["Engineered", "Implemented", "Spearheaded"])
    return base[:3]

def analyze_weak_verbs(text: str) -> List[Dict[str, str]]:
    """
    Finds all instances of weak resume language across all lines and provides context-aware strong replacements.
    Detects and lists all weak phrases, not just the first one.
    """
    weak_findings = []
    lines = text.split("\n")
    
    for line in lines:
        line_clean = line.strip()
        if not line_clean or len(line_clean) < 8:
            continue
        line_lower = line_clean.lower()
        
        # Track occupied index ranges on this line to avoid overlapping matches
        occupied_spans = []
        line_matches = []
        
        # Sort by length descending to match multi-word phrases first
        for weak_phrase in sorted(WEAK_VERBS_MAP.keys(), key=len, reverse=True):
            pattern = rf'\b{re.escape(weak_phrase)}\b'
            for m in re.finditer(pattern, line_lower):
                start, end = m.start(), m.end()
                if any(start < o_end and end > o_start for o_start, o_end in occupied_spans):
                    continue
                occupied_spans.append((start, end))
                line_matches.append((start, end, weak_phrase))
                
        # Sort line matches by position in line
        line_matches.sort(key=lambda x: x[0])
        for start, end, phrase in line_matches:
            matched_text = line_clean[start:end]
            alts = get_contextual_replacement(phrase, line_clean, start, end)
            weak_findings.append({
                "weak": matched_text,
                "replacement": ", ".join(alts),
                "context": line_clean[:180] + ("..." if len(line_clean) > 180 else "")
            })
                
    return weak_findings[:30]


def analyze_keywords(text: str, skills_found: List[str], target_role: Optional[str] = None) -> Dict[str, Any]:
    """
    Generates a list of frequently used, missing, and recommended keywords,
    tailored to the target_role if provided.
    """
    text_lower = text.lower()
    
    # 1. Frequently Used Keywords
    freq_keywords = []
    for skill in skills_found:
        count = len(re.findall(rf'\b{re.escape(skill.lower())}\b', text_lower))
        if count >= 1:
            freq_keywords.append({"keyword": skill, "count": count})
            
    freq_keywords = sorted(freq_keywords, key=lambda x: x["count"], reverse=True)[:8]
    
    # 2. Missing Keywords based on Target Role
    missing = []
    role_candidates = ROLE_KEYWORDS.get(target_role or "Full-Stack Developer", ROLE_KEYWORDS["Full-Stack Developer"])
    
    for kw in role_candidates:
        pattern = rf'\b{re.escape(kw.lower())}\b'
        if not re.search(pattern, text_lower):
            missing.append(kw)
            
    # 3. Recommended Keywords
    recommended = []
    for kw in RECOMMENDED_KEYWORDS:
        pattern = rf'\b{re.escape(kw.lower())}\b'
        if not re.search(pattern, text_lower) and kw not in missing:
            recommended.append(kw)
            
    return {
        "frequent": freq_keywords,
        "missing": missing[:8],
        "recommended": recommended[:8],
        "target_role": target_role or "Full-Stack Developer"
    }
