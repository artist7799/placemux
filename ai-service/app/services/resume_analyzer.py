import re
import io
from typing import Dict, List, Any, Tuple
from pypdf import PdfReader
from app.schemas import ExtractedResumeData, ResumeAnalyzeResponse, ScoreBreakdown

# Technical skills taxonomy database with canonical display formatting
SKILL_DISPLAY_MAP = {
    "javascript": "JavaScript", "typescript": "TypeScript", "python": "Python", "java": "Java",
    "c++": "C++", "c#": "C#", "go": "Go", "rust": "Rust", "html": "HTML", "css": "CSS",
    "react": "React", "react native": "React Native", "next.js": "Next.js", "vue": "Vue.js",
    "angular": "Angular", "node.js": "Node.js", "express": "Express.js", "fastapi": "FastAPI",
    "django": "Django", "flask": "Flask", "spring boot": "Spring Boot", "postgresql": "PostgreSQL",
    "mysql": "MySQL", "mongodb": "MongoDB", "redis": "Redis", "sqlite": "SQLite",
    "prisma": "Prisma", "sequelize": "Sequelize", "graphql": "GraphQL", "rest api": "REST API",
    "docker": "Docker", "kubernetes": "Kubernetes", "aws": "AWS", "gcp": "GCP", "azure": "Azure",
    "git": "Git", "github": "GitHub", "ci/cd": "CI/CD", "jest": "Jest", "pytest": "Pytest",
    "cypress": "Cypress", "tailwind css": "Tailwind CSS", "bootstrap": "Bootstrap",
    "system design": "System Design", "data structures": "Data Structures", "algorithms": "Algorithms",
    "machine learning": "Machine Learning", "deep learning": "Deep Learning", "nlp": "NLP",
    "pandas": "Pandas", "numpy": "NumPy", "scikit-learn": "Scikit-Learn", "tensorflow": "TensorFlow",
    "pytorch": "PyTorch", "microservices": "Microservices"
}

KNOWN_SKILLS = list(SKILL_DISPLAY_MAP.keys())

RECOMMENDED_INDUSTRY_SKILLS = [
    "Docker", "PostgreSQL", "React", "TypeScript", "Node.js", "System Design",
    "Git", "REST API", "CI/CD", "AWS"
]

class ResumeAnalyzerService:
    @staticmethod
    def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
        """Extract plain text from uploaded PDF file bytes using PyPDF."""
        try:
            reader = PdfReader(io.BytesIO(pdf_bytes))
            text_pages = []
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text_pages.append(extracted)
            return "\n".join(text_pages)
        except Exception as e:
            raise ValueError(f"Failed to parse PDF document: {str(e)}")

    @staticmethod
    def extract_sections(text: str) -> ExtractedResumeData:
        """Extract structured sections, skills, education, experience, and projects from raw text."""
        text_lower = text.lower()
        lines = [line.strip() for line in text.split("\n") if line.strip()]

        # 1. Skill Extraction
        extracted_skills = set()
        for skill_key in KNOWN_SKILLS:
            pattern = r'\b' + re.escape(skill_key) + r'\b'
            if re.search(pattern, text_lower):
                extracted_skills.add(SKILL_DISPLAY_MAP.get(skill_key, skill_key.title()))

        # 2. Section Parsing via Regex heuristics
        education_keywords = ["university", "college", "bachelor", "master", "degree", "b.tech", "b.e", "m.tech", "gpa", "cgpa", "school"]
        experience_keywords = ["developer", "engineer", "intern", "internship", "analyst", "consultant", "experience", "work history", "role", "company"]
        project_keywords = ["project", "developed", "built", "created", "implemented", "application", "system", "designed"]
        certification_keywords = ["certified", "certification", "aws certified", "coursera", "udemy", "license", "certificate"]

        education_items = []
        experience_items = []
        project_items = []
        certification_items = []

        for line in lines:
            line_lower = line.lower()
            if any(k in line_lower for k in education_keywords):
                education_items.append(line)
            elif any(k in line_lower for k in experience_keywords):
                experience_items.append(line)
            elif any(k in line_lower for k in project_keywords):
                project_items.append(line)
            elif any(k in line_lower for k in certification_keywords):
                certification_items.append(line)

        # 3. Quantifiable Impact Analysis (numbers, percentages, metrics like 40%, $10k, 5x, 100 users)
        impact_metrics = re.findall(r'\b(\d+%\b|\$\d+|\d+\+|\d+x|\d+\s*(users|clients|requests|ms|seconds))\b', text_lower)
        quant_count = len(impact_metrics)

        word_count = len(text.split())

        return ExtractedResumeData(
            skills=sorted(list(extracted_skills)),
            education=education_items[:5],
            experience=experience_items[:5],
            projects=project_items[:5],
            certifications=certification_items[:5],
            word_count=word_count,
            quantifiable_metrics_count=quant_count,
        )

    @classmethod
    def analyze(cls, text: str, target_role: str = None) -> ResumeAnalyzeResponse:
        """Perform comprehensive transparent resume evaluation and scoring."""
        if not text or len(text.strip()) < 20:
            raise ValueError("Resume text content is too short to perform AI analysis.")

        extracted = cls.extract_sections(text)

        # 1. Section Completeness (Max 25 pts)
        has_skills = len(extracted.skills) >= 3
        has_edu = len(extracted.education) >= 1
        has_exp_proj = (len(extracted.experience) + len(extracted.projects)) >= 2
        has_cert = len(extracted.certifications) >= 1

        sec_score = 0.0
        if has_skills: sec_score += 8.0
        if has_edu: sec_score += 6.0
        if has_exp_proj: sec_score += 8.0
        if has_cert: sec_score += 3.0
        sec_score = min(25.0, sec_score)

        # 2. Skill Density (Max 25 pts)
        num_skills = len(extracted.skills)
        if num_skills >= 10:
            skill_score = 25.0
        elif num_skills >= 6:
            skill_score = 20.0
        elif num_skills >= 3:
            skill_score = 15.0
        else:
            skill_score = float(num_skills * 4.0)

        # 3. Education Depth (Max 15 pts)
        edu_score = 15.0 if len(extracted.education) >= 1 else 5.0

        # 4. Experience & Projects Depth (Max 20 pts)
        exp_proj_count = len(extracted.experience) + len(extracted.projects)
        if exp_proj_count >= 4:
            exp_score = 20.0
        elif exp_proj_count >= 2:
            exp_score = 15.0
        else:
            exp_score = 8.0

        # 5. Quantifiable Impact Score (Max 15 pts)
        quant_count = extracted.quantifiable_metrics_count
        if quant_count >= 3:
            impact_score = 15.0
        elif quant_count >= 1:
            impact_score = 10.0
        else:
            impact_score = 4.0

        total_score = round(sec_score + skill_score + edu_score + exp_score + impact_score, 1)

        # Identify missing industry core skills
        extracted_skills_lower = {s.lower() for s in extracted.skills}
        missing_skills = [s for s in RECOMMENDED_INDUSTRY_SKILLS if s.lower() not in extracted_skills_lower]

        # Generate Actionable Suggestions
        suggestions = []
        if total_score < 70:
            suggestions.append("Increase technical skill visibility by adding a dedicated 'Technical Skills' section.")
        if quant_count == 0:
            suggestions.append("Include quantifiable achievements and performance metrics (e.g. 'Improved query performance by 35%').")
        if len(extracted.projects) < 2:
            suggestions.append("Add detailed descriptions of 2-3 technical projects highlighting stack and problem solved.")
        if len(missing_skills) > 0:
            suggestions.append(f"Consider learning key industry skills in high demand: {', '.join(missing_skills[:4])}.")
        if extracted.word_count < 150:
            suggestions.append("Expand section bullet points to provide more context on your individual contributions.")

        if not suggestions:
            suggestions.append("Your resume meets high technical standards! Keep project links updated with live demos.")

        score_breakdown = ScoreBreakdown(
            section_completeness=sec_score,
            skill_density=skill_score,
            education_depth=edu_score,
            experience_projects=exp_score,
            quantifiable_impact=impact_score
        )

        return ResumeAnalyzeResponse(
            extracted_data=extracted,
            resume_score=total_score,
            score_breakdown=score_breakdown,
            missing_skills=missing_skills[:6],
            improvement_suggestions=suggestions
        )
