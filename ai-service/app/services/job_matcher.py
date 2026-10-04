from typing import List, Set, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.schemas import JobMatchRequest, JobMatchResponse, MatchingDetails
from app.services.resume_analyzer import SKILL_DISPLAY_MAP

class JobMatcherService:
    @classmethod
    def match(cls, request: JobMatchRequest) -> JobMatchResponse:
        """Perform transparent explainable job matching calculation."""
        student_profile = request.student_profile
        job = request.job

        # Combine student skill inputs (direct skills + resume skills)
        candidate_skills: Set[str] = set()
        for s in request.student_skills:
            candidate_skills.add(s.strip().lower())
        if request.resume_skills:
            for s in request.resume_skills:
                candidate_skills.add(s.strip().lower())

        required_skills: Set[str] = set()
        for s in job.required_skills:
            required_skills.add(s.strip().lower())

        # 1. Skill Overlap Calculation (Jaccard Index)
        matching_skills_lower = candidate_skills.intersection(required_skills)
        missing_skills_lower = required_skills.difference(candidate_skills)

        matching_skills = sorted([SKILL_DISPLAY_MAP.get(s, s.title()) for s in matching_skills_lower])
        missing_skills = sorted([SKILL_DISPLAY_MAP.get(s, s.title()) for s in missing_skills_lower])

        skill_overlap_ratio = (
            len(matching_skills_lower) / len(required_skills)
            if len(required_skills) > 0
            else 1.0
        )

        # 2. Text Vectorization (TF-IDF Cosine Similarity between Candidate profile & Job Description)
        candidate_text_parts = list(candidate_skills)
        if request.resume_text:
            candidate_text_parts.append(request.resume_text)
        if student_profile and student_profile.branch:
            candidate_text_parts.append(student_profile.branch)

        candidate_full_text = " ".join(candidate_text_parts)
        job_full_text = f"{job.title} {job.description or ''} {' '.join(job.required_skills)}"

        tfidf_similarity = 0.0
        if candidate_full_text.strip() and job_full_text.strip():
            try:
                vectorizer = TfidfVectorizer(stop_words='english')
                tfidf_matrix = vectorizer.fit_transform([candidate_full_text, job_full_text])
                similarity_matrix = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
                tfidf_similarity = float(similarity_matrix[0][0])
            except Exception:
                tfidf_similarity = skill_overlap_ratio

        # 3. CGPA Eligibility Check
        cgpa_eligible = True
        if job.min_cgpa and student_profile and student_profile.cgpa is not None:
            if student_profile.cgpa < job.min_cgpa:
                cgpa_eligible = False

        # 4. Branch Eligibility Check
        branch_eligible = True
        if job.eligible_branches and len(job.eligible_branches) > 0 and student_profile and student_profile.branch:
            normalized_eligible = [b.lower() for b in job.eligible_branches]
            if student_profile.branch.lower() not in normalized_eligible:
                branch_eligible = False

        # 5. Composite Match Percentage Calculation
        raw_skill_score = skill_overlap_ratio * 55.0
        raw_tfidf_score = tfidf_similarity * 30.0
        academic_score = 15.0 if (cgpa_eligible and branch_eligible) else 5.0

        match_percentage = round(min(100.0, max(0.0, raw_skill_score + raw_tfidf_score + academic_score)), 1)

        # Recommended Skills to Learn
        recommended_skills = missing_skills.copy()
        if len(recommended_skills) < 3:
            complimentary_suggestions = ["Docker", "System Design", "PostgreSQL", "AWS"]
            for comp in complimentary_suggestions:
                if comp.lower() not in candidate_skills and comp not in recommended_skills:
                    recommended_skills.append(comp)

        matching_details = MatchingDetails(
            tfidf_similarity=round(tfidf_similarity, 3),
            skill_overlap_ratio=round(skill_overlap_ratio, 3),
            cgpa_eligible=cgpa_eligible,
            branch_eligible=branch_eligible
        )

        return JobMatchResponse(
            match_percentage=match_percentage,
            matching_skills=matching_skills,
            missing_skills=missing_skills,
            recommended_skills=recommended_skills[:5],
            matching_details=matching_details
        )
