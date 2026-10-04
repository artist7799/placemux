import pytest
import httpx
from app.main import app

@pytest.fixture
def anyio_backend():
    return 'asyncio'

@pytest.fixture
async def client():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as c:
        yield c

@pytest.mark.anyio
async def test_health_check(client):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "PlaceMux AI Microservice" in data["service"]

@pytest.mark.anyio
async def test_resume_analyze_text(client):
    sample_resume = """
    Jaikrishna Janjanam
    Full Stack Developer & AI Engineer
    Email: jaikrishna@example.com | Phone: 9876543210
    
    SKILLS:
    JavaScript, TypeScript, Node.js, Express, React, Python, FastAPI, PostgreSQL, Docker, Git, REST API
    
    EDUCATION:
    B.Tech in Computer Science Engineering, 2024 - GPA: 8.9 / 10.0
    
    EXPERIENCE:
    Software Developer Intern - TechCorp
    - Built responsive microservices using Node.js and TypeScript, handling over 50,000 requests per day.
    - Improved database query performance by 40% using PostgreSQL indexing.
    
    PROJECTS:
    PlaceMux - AI Recruitment Platform
    - Developed full-stack SaaS platform with automated candidate matching and assessment scoring.
    """

    response = await client.post("/api/v1/resume/analyze-text", json={"raw_text": sample_resume})
    assert response.status_code == 200
    data = response.json()
    
    assert data["resume_score"] > 60.0
    assert "TypeScript" in data["extracted_data"]["skills"]
    assert "PostgreSQL" in data["extracted_data"]["skills"]
    assert len(data["improvement_suggestions"]) > 0
    assert "section_completeness" in data["score_breakdown"]

@pytest.mark.anyio
async def test_resume_analyze_short_text(client):
    response = await client.post("/api/v1/resume/analyze-text", json={"raw_text": "Too short"})
    assert response.status_code == 422

@pytest.mark.anyio
async def test_job_match(client):
    payload = {
        "student_profile": {
            "firstName": "Jaikrishna",
            "lastName": "Janjanam",
            "branch": "Computer Science",
            "cgpa": 8.5
        },
        "student_skills": ["TypeScript", "Node.js", "React", "PostgreSQL", "Git"],
        "resume_skills": ["Docker", "Python", "REST API"],
        "job": {
            "title": "Senior Backend Engineer",
            "description": "We are seeking a backend engineer proficient in Node.js, TypeScript, PostgreSQL, and Docker.",
            "required_skills": ["TypeScript", "Node.js", "PostgreSQL", "Docker", "AWS"],
            "min_cgpa": 7.5,
            "eligible_branches": ["Computer Science", "Information Technology"]
        }
    }

    response = await client.post("/api/v1/job/match", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["match_percentage"] >= 65.0
    assert "TypeScript" in data["matching_skills"]
    assert "AWS" in data["missing_skills"]
    assert data["matching_details"]["cgpa_eligible"] is True
    assert "disclaimer" in data
