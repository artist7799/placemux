from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ResumeTextRequest(BaseModel):
    raw_text: str = Field(..., description="Raw text extracted from resume", min_length=10)
    target_role: Optional[str] = Field(None, description="Optional target job role for tailored scoring")

class ExtractedSection(BaseModel):
    title: str
    items: List[str]

class ExtractedResumeData(BaseModel):
    skills: List[str] = Field(default_factory=list)
    education: List[str] = Field(default_factory=list)
    experience: List[str] = Field(default_factory=list)
    projects: List[str] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    word_count: int = 0
    quantifiable_metrics_count: int = 0

class ScoreBreakdown(BaseModel):
    section_completeness: float
    skill_density: float
    education_depth: float
    experience_projects: float
    quantifiable_impact: float

class ResumeAnalyzeResponse(BaseModel):
    extracted_data: ExtractedResumeData
    resume_score: float = Field(..., ge=0, le=100)
    score_breakdown: ScoreBreakdown
    missing_skills: List[str] = Field(default_factory=list)
    improvement_suggestions: List[str] = Field(default_factory=list)

class StudentProfileInput(BaseModel):
    id: Optional[str] = None
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    branch: Optional[str] = None
    cgpa: Optional[float] = None
    graduationYear: Optional[int] = None

class JobRequirementsInput(BaseModel):
    jobId: Optional[str] = None
    title: str = Field(..., description="Job role title")
    description: Optional[str] = None
    required_skills: List[str] = Field(default_factory=list)
    min_cgpa: Optional[float] = None
    eligible_branches: Optional[List[str]] = Field(default_factory=list)

class JobMatchRequest(BaseModel):
    student_profile: Optional[StudentProfileInput] = None
    student_skills: List[str] = Field(default_factory=list)
    resume_skills: Optional[List[str]] = Field(default_factory=list)
    resume_text: Optional[str] = None
    job: JobRequirementsInput

class MatchingDetails(BaseModel):
    tfidf_similarity: float
    skill_overlap_ratio: float
    cgpa_eligible: bool
    branch_eligible: bool
    scoring_logic: str = "Explainable Weighted Jaccard & TF-IDF Cosine Similarity algorithm"

class JobMatchResponse(BaseModel):
    match_percentage: float = Field(..., ge=0, le=100)
    matching_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    recommended_skills: List[str] = Field(default_factory=list)
    matching_details: MatchingDetails
    disclaimer: str = (
        "AI match scores are generated purely for decision support and self-assessment. "
        "They must NOT be used for automated hiring decisions."
    )
