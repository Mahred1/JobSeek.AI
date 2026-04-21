import requests
from typing import Optional
from bs4 import BeautifulSoup
from app.services.ai.base_ai_service import BaseAIService
from app.schemas.skill_gap import SkillGapAnalysisOutput

class SkillGapAIService(BaseAIService):

    async def analyze_skill_gap(self, resume_text: str, job_description: str, job_posting_url: Optional[str] = None) -> SkillGapAnalysisOutput:
        system_prompt = "You are a career mentor and technical recruiter. Analyze resumes against job descriptions. Respond with valid JSON only, no extra text."

        user_prompt = f"""
Analyze my resume against this job description and return ONLY a JSON object.

MY RESUME:
{resume_text[:1200]}

JOB DESCRIPTION:
{job_description[:600]}

Return this exact JSON structure:
{{
  "job_title": "exact job title from description",
  "match_percentage": 75,
  "matched_skills": [
    {{"skill": "Python", "level": "Intermediate", "evidence": "used in project X", "meets_requirement": true}}
  ],
  "missing_skills": [
    {{"skill": "Docker", "importance": "Critical", "why_needed": "for deployment", "learning_path": "take docker course"}}
  ],
  "project_recommendations": [
    {{"title": "Project Name", "description": "what to build", "skills_gained": "skill1, skill2", "time_estimate": "2 weeks", "difficulty": "Medium"}}
  ],
  "top_strengths": "Strength 1. Strength 2. Strength 3.",
  "biggest_gaps": "Gap 1. Gap 2. Gap 3.",
  "next_steps": "Step 1. Step 2. Step 3.",
  "timeline_to_ready": "3 months with focused learning",
  "overall_assessment": "You are a good fit because..."
}}

RULES:
- top_strengths, biggest_gaps, next_steps, timeline_to_ready, overall_assessment must be plain strings
- match_percentage must be an integer
- meets_requirement must be true or false (boolean)
- Return ONLY the JSON, nothing else
"""

        try:
            print(f"Resume length: {len(resume_text)}, JD length: {len(job_description)}")
            result = await self._make_groq_request(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                response_model=SkillGapAnalysisOutput,
                temperature=0.1
            )
            return result
        except Exception as e:
            import traceback
            print(f"Full traceback: {traceback.format_exc()}")
            raise Exception(f"Skill gap analysis failed: {str(e)}")

    async def fetch_job_description(self, url: str) -> str:
        headers = {"User-Agent": "Mozilla/5.0"}
        try:
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            job_description = ""
            if "linkedin.com" in url:
                job_section = soup.find("div", class_="description__text")
                if job_section:
                    job_description = job_section.get_text()
            elif "indeed.com" in url:
                job_section = soup.find("div", id="jobDescriptionText")
                if job_section:
                    job_description = job_section.get_text()
            if not job_description:
                for element in [
                    soup.find("div", class_=lambda c: c and "job-description" in c.lower()),
                    soup.find("div", id=lambda i: i and "job-description" in i.lower()),
                ]:
                    if element:
                        job_description = element.get_text()
                        break
            lines = [line.strip() for line in job_description.split('\n') if line.strip()]
            return '\n'.join(lines).strip() or "Could not extract job description."
        except Exception as e:
            raise Exception(f"Error fetching job description: {str(e)}")