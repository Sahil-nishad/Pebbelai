import fitz  # PyMuPDF
import docx
import json
import logging
from typing import Any, Dict

from openai import OpenAI
from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

def extract_text_from_file(file_path: str) -> str:
    """
    Extracts raw text from PDF or DOCX files.
    """
    ext = file_path.lower().split('.')[-1]
    text = ""
    
    try:
        if ext == 'pdf':
            doc = fitz.open(file_path)
            for page in doc:
                text += page.get_text()
            doc.close()
        elif ext == 'docx':
            doc = docx.Document(file_path)
            text = "\n".join([para.text for para in doc.paragraphs])
        else:
            # Fallback to plain text read
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                text = f.read()
    except Exception as e:
        logger.error(f"Error extracting text from {file_path}: {e}")
        
    return text

async def parse_resume_content(text: str) -> Dict[str, Any]:
    """
    Parses resume text into structured data using OpenAI.
    """
    if not settings.openai_api_key:
        logger.warning("OpenAI API key not set, skipping parsing")
        return {}

    client = OpenAI(api_key=settings.openai_api_key)
    
    prompt = f"""
    Analyze the following resume text and extract structured information.
    Return ONLY a JSON object with the following keys:
    - parsed_skills: (list of strings)
    - parsed_experience: (list of objects with title, company, duration, description)
    - parsed_education: (list of objects with degree, school, year)
    - parsed_projects: (list of objects with name, description)
    - parsed_summary: (short professional summary string)

    Resume Text:
    {text[:4000]}  # Limit text to avoid token limits
    """

    try:
        response = client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": "You are an expert ATS (Applicant Tracking System) parser."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        logger.error(f"Error parsing resume with AI: {e}")
        return {}
