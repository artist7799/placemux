import logging
from fastapi import APIRouter, File, UploadFile, HTTPException, Form, Body, status
from typing import Optional
from app.schemas import ResumeAnalyzeResponse, ResumeTextRequest
from app.services.resume_analyzer import ResumeAnalyzerService

logger = logging.getLogger("ai_service.resume_router")
router = APIRouter(prefix="/api/v1/resume", tags=["Resume Analyzer"])

@router.post(
    "/analyze",
    response_model=ResumeAnalyzeResponse,
    summary="Analyze Resume PDF or Raw Text",
    description="Extract skills, education, experience, projects, certifications, and calculate transparent resume score & suggestions."
)
async def analyze_resume(
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None),
    target_role: Optional[str] = Form(None)
):
    try:
        extracted_text = ""

        if file:
            if not file.filename.lower().endswith(('.pdf', '.txt')):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid file format. Only PDF and TXT resume files are supported."
                )
            contents = await file.read()
            if file.filename.lower().endswith('.pdf'):
                extracted_text = ResumeAnalyzerService.extract_text_from_pdf_bytes(contents)
            else:
                extracted_text = contents.decode('utf-8', errors='ignore')
        elif raw_text:
            extracted_text = raw_text
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either a resume file or raw_text must be provided."
            )

        logger.info(f"Processing resume text (length: {len(extracted_text)} chars)")
        result = ResumeAnalyzerService.analyze(extracted_text, target_role)
        return result

    except HTTPException as he:
        raise he
    except ValueError as ve:
        logger.warning(f"Validation error during resume parsing: {str(ve)}")
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(ve))
    except Exception as e:
        logger.error(f"Internal error processing resume: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing the resume document."
        )

@router.post(
    "/analyze-text",
    response_model=ResumeAnalyzeResponse,
    summary="Analyze Resume Text (JSON payload)",
    description="JSON endpoint for analyzing raw extracted resume text."
)
async def analyze_resume_text(request: ResumeTextRequest):
    try:
        logger.info(f"Analyzing resume text via JSON request (length: {len(request.raw_text)} chars)")
        result = ResumeAnalyzerService.analyze(request.raw_text, request.target_role)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(ve))
    except Exception as e:
        logger.error(f"Error in analyze-text: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while evaluating the resume text."
        )
