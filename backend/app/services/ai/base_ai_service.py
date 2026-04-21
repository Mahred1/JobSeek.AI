from app.core.config import settings
import json
import re
import httpx

class BaseAIService:
    def __init__(self):
        self.model_name = "meta-llama/Llama-3.1-8B-Instruct:cerebras"
        self.api_url = "https://router.huggingface.co/v1/chat/completions"

    def _ensure_client_initialized(self):
        pass

    async def _make_groq_request(self, system_prompt: str, user_prompt: str, response_model, temperature: float = 0.3):
        headers = {
            "Authorization": f"Bearer {settings.HF_API_KEY}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": temperature,
            "max_tokens": 2000,
        }

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(self.api_url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()

                print("FULL API RESPONSE:", json.dumps(data, indent=2))

                content = data.get("choices", [{}])[0].get("message", {}).get("content")

                print("RAW CONTENT:", repr(content))

                if not content:
                    raise Exception(f"Empty response. Full response: {data}")

                text = content.strip()
                text = re.sub(r'^```(?:json)?\s*', '', text)
                text = re.sub(r'\s*```$', '', text)

                print("AFTER STRIP:", repr(text[:500]))

                match = re.search(r'\{.*\}', text, re.DOTALL)
                if match:
                    text = match.group(0)

                print("FINAL JSON TEXT:", repr(text[:500]))

                parsed = json.loads(text)
                # For skill gap schema - these fields must be strings
                for field in ['biggest_gaps', 'next_steps', 'timeline_to_ready', 'overall_assessment']:
                    if field in parsed and isinstance(parsed[field], list):
                        parsed[field] = ' | '.join(str(i) for i in parsed[field])
                # For skill gap schema - top_strengths is a string in skill gap but list in resume analysis
                # Only convert if it's in a skill gap context (check if match_percentage exists)
                if 'match_percentage' in parsed and 'top_strengths' in parsed and isinstance(parsed['top_strengths'], list):
                    parsed['top_strengths'] = ' | '.join(str(i) for i in parsed['top_strengths'])
                return response_model(**parsed)

        except Exception as e:
            error_msg = f"Error from Groq API: {str(e)}"
            print(error_msg)
            raise Exception(error_msg)