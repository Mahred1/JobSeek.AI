from app.services.ai.base_ai_service import BaseAIService
from app.services.resume.models import ResumeAnalysisOutput, ImprovedResumeOutput, SimpleImprovedResumeOutput
from typing import Optional
from app.db.repositories.resume_analysis_repository import ResumeAnalysisRepository
from datetime import datetime


class ResumeAnalysisService(BaseAIService):

    def __init__(self):
        super().__init__()
        self.repository = ResumeAnalysisRepository()

    async def get_analysis_by_id(self, analysis_id: str) -> Optional[ResumeAnalysisOutput]:
        return await self.repository.get_analysis_by_id(analysis_id)

    async def save_analysis(self, user_id: str, resume_id: str, analysis_result: ResumeAnalysisOutput) -> str:
        analysis_data = analysis_result.model_dump()
        return await self.repository.save_analysis(user_id, resume_id, analysis_data)

    async def analyze_resume(self, resume_text: str, job_title: str, industry: str, user_id: Optional[str] = None, resume_id: Optional[str] = None) -> ResumeAnalysisOutput:
        system_prompt = "You are an expert resume consultant. Respond with ONLY a valid JSON object. No explanations, no markdown, no extra text."

        user_prompt = f"""
Analyze this resume for a {job_title} position in the {industry} industry.

RESUME:
{resume_text[:1500]}

Return ONLY this JSON (replace example values with real analysis):
{{
  "overall_score": 70,
  "overall_feedback": "Your resume shows solid technical skills but needs improvement in quantifying achievements and adding a career summary.",
  "ats_score": 65,
  "content_score": 60,
  "format_score": 55,
  "impact_score": 50,
  "ats_compatibility": {{
    "score": 65,
    "keyword_optimization": 60,
    "format_compatibility": 70,
    "section_structure": 65,
    "file_format_score": 80,
    "strengths": ["Has relevant keywords", "Clear section headers", "Standard format"],
    "issues": ["Missing career summary", "Low keyword density", "No metrics"],
    "recommendations": ["Add career summary", "Include more industry keywords", "Quantify achievements"],
    "matched_keywords": ["Python", "Django", "JavaScript"],
    "missing_keywords": ["Docker", "AWS", "CI/CD", "Agile"],
    "keyword_density": 2.5
  }},
  "content_quality": {{
    "score": 60,
    "achievement_focus": 55,
    "quantification": 40,
    "action_verbs": 60,
    "relevance": 65,
    "strengths": ["Good technical detail", "Relevant projects listed"],
    "weaknesses": ["Lacks metrics and numbers", "Weak action verbs"],
    "recommendations": ["Add numbers to achievements", "Use stronger action verbs", "Focus on impact"],
    "strong_bullets": ["Built REST API backend using FastAPI"],
    "weak_bullets": ["Worked on web projects"],
    "quantified_achievements": []
  }},
  "format_structure": {{
    "score": 55,
    "visual_hierarchy": 50,
    "consistency": 60,
    "readability": 55,
    "length_appropriateness": 65,
    "strengths": ["Logical structure", "Clear education section"],
    "issues": ["Needs more whitespace", "Inconsistent formatting"],
    "recommendations": ["Improve visual hierarchy", "Add consistent spacing", "Use bullet points throughout"]
  }},
  "impact_effectiveness": {{
    "score": 50,
    "first_impression": 45,
    "differentiation": 50,
    "value_proposition": 45,
    "memorability": 55,
    "strengths": ["Shows technical skills", "Has project experience"],
    "weaknesses": ["No clear value proposition", "Lacks memorable achievements"],
    "recommendations": ["Add career summary with value proposition", "Highlight unique achievements", "Show business impact"]
  }},
  "top_strengths": ["Strong technical foundation in Python and Django", "Good project portfolio", "Clear education credentials"],
  "critical_improvements": ["Add a professional summary section", "Quantify all achievements with metrics", "Include missing keywords like Docker and AWS"],
  "quick_wins": ["Add LinkedIn and GitHub URLs", "Fix formatting consistency", "Replace weak verbs with action verbs"],
  "bullet_improvements": [
    {{
      "original": "Worked on web application",
      "improved": "Developed full-stack web application serving 500+ users using Django REST Framework and React",
      "explanation": "Adds specificity, user impact metrics, and specific technologies used",
      "impact_increase": 40
    }}
  ],
  "industry_benchmark": {{
    "industry": "{industry}",
    "percentile_ranking": 40,
    "competitive_advantages": ["Strong Python skills", "Full-stack capability"],
    "improvement_priorities": ["Add quantified metrics", "Improve ATS keyword coverage", "Add professional summary"],
    "industry_specific_feedback": "The {industry} industry values demonstrated impact through metrics and modern tech stack proficiency. Focus on showing measurable results."
  }},
  "target_job_title": "{job_title}",
  "target_industry": "{industry}",
  "analysis_date": "{datetime.now().strftime('%Y-%m-%d')}",
  "estimated_improvement_potential": 75
}}
"""

        try:
            print(f"Starting resume analysis for {job_title} in {industry}...")
            print(f"Resume length: {len(resume_text)} characters")
            result = await self._make_groq_request(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                response_model=ResumeAnalysisOutput,
                temperature=0.2,
            )
            print(f"Resume analysis completed successfully")
            if user_id and resume_id:
                await self.save_analysis(user_id, resume_id, result)
                print(f"Analysis saved for user {user_id}")
            return result
        except Exception as e:
            import traceback
            print(f"Full traceback: {traceback.format_exc()}")
            raise Exception(f"Resume analysis failed: {str(e)}")

    async def optimize_resume(self, resume_text: str, job_title: str, industry: str, analysis_result: ResumeAnalysisOutput) -> SimpleImprovedResumeOutput:
        system_prompt = "You are a professional resume writer. Respond with ONLY a valid JSON object. No extra text."

        missing_keywords = analysis_result.ats_compatibility.missing_keywords[:8]
        critical_improvements = analysis_result.critical_improvements[:3]

        user_prompt = f"""
Enhance this resume for a {job_title} position in {industry}.

RESUME:
{resume_text[:1200]}

IMPROVEMENTS NEEDED: {', '.join(critical_improvements)}
MISSING KEYWORDS TO ADD: {', '.join(missing_keywords)}

Return ONLY this JSON:
{{
  "markdown": "# Full Name\\nemail | phone | linkedin\\n\\n## Summary\\nProfessional summary here...\\n\\n## Experience\\n### Company Name\\nJob Title | Date\\n- Achievement with metrics\\n\\n## Education\\n### University\\nDegree | Year\\n\\n## Skills\\nPython, Django, React, etc.",
  "changes_summary": ["Added professional summary", "Quantified achievements with metrics", "Added missing keywords naturally"],
  "improvement_score": 25
}}

Replace the markdown value with the actual enhanced resume content in proper markdown format.
"""

        try:
            print(f"Starting resume optimization...")
            result = await self._make_groq_request(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                response_model=SimpleImprovedResumeOutput,
                temperature=0.3,
            )
            print(f"Resume optimization completed successfully")
            return result
        except Exception as e:
            import traceback
            print(f"Full traceback: {traceback.format_exc()}")
            raise Exception(f"Resume optimization failed: {str(e)}")