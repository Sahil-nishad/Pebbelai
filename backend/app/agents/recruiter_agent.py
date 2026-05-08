from app.services.email_generator import EmailGeneratorService
from app.services.matching import MatchingService
from app.services.recruiter_search import RecruiterSearchService
from app.services.resume_parser import ResumeParserService


class RecruiterOutreachAgent:
    def __init__(self) -> None:
        self.resume_parser = ResumeParserService()
        self.search_service = RecruiterSearchService()
        self.matching_service = MatchingService()
        self.email_service = EmailGeneratorService()

