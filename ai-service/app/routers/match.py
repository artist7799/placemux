import logging
from fastapi import APIRouter, HTTPException, status
from app.schemas import JobMatchRequest, JobMatchResponse
from app.services.job_matcher import JobMatcherService

logger = logging.getLogger("ai_service.match_router")
router = APIRouter(prefix="/api/v1/job", tags=["Job Matching Engine"])

@router.post(
    "/match",
    response_model=JobMatchResponse,
    summary="Calculate Candidate-to-Job Compatibility",
    description="Calculate transparent match percentage, skill overlap, missing skills, and recommendations."
)
async def match_job(request: JobMatchRequest):
    try:
        logger.info(f"Processing job match request for Job Title: '{request.job.title}'")
        result = JobMatcherService.match(request)
        return result
    except ValueError as ve:
        logger.warning(f"Validation error in job matching: {str(ve)}")
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(ve))
    except Exception as e:
        logger.error(f"Error executing job match calculation: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while calculating job compatibility."
        )
