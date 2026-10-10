"""CareNexus Triage Engine — symptom analysis, severity scoring, and AI response generation."""

import json
import logging

from app.core.triage.prompts import SYSTEM_PROMPT, build_user_prompt
from app.core.triage.red_flags import check_red_flags
from app.models.chat import Message, TriageLevel

logger = logging.getLogger(__name__)


async def analyze_symptoms(
    user_message: str,
    conversation_history: list[Message] | None = None,
) -> dict:
    """Analyze user symptoms and generate a triage response.

    This is the main entry point for the triage engine.
    Returns a dict with: response, triage_level, sources
    """
    # Step 1: Check for red-flag emergency symptoms
    red_flag_result = check_red_flags(user_message)
    if red_flag_result:
        return {
            "response": red_flag_result["message"],
            "triage_level": TriageLevel.RED,
            "sources": "Emergency triage protocol",
        }

    # Step 2: Try LLM-based analysis
    try:
        return await _llm_analyze(user_message, conversation_history)
    except Exception as e:
        logger.warning(f"LLM analysis failed, using fallback: {e}")
        return _fallback_response(user_message)


async def _llm_analyze(
    user_message: str,
    conversation_history: list[Message] | None = None,
) -> dict:
    """Generate AI response using LLM (OpenAI/Gemini)."""
    from app.core.config import settings

    # Build conversation context
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Add conversation history for context
    if conversation_history:
        for msg in conversation_history[-10:]:  # Last 10 messages for context
            messages.append(
                {
                    "role": msg.role.value,
                    "content": msg.content,
                }
            )

    # Add current user message
    messages.append({"role": "user", "content": build_user_prompt(user_message)})

    if settings.LLM_PROVIDER == "openai" and settings.OPENAI_API_KEY:
        return await _call_openai(messages, settings)
    elif settings.LLM_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
        return await _call_gemini(user_message, messages, settings)
    else:
        logger.info("No LLM API key configured, using rule-based fallback")
        return _fallback_response(user_message)


async def _call_openai(messages: list[dict], settings) -> dict:
    """Call OpenAI API for symptom analysis."""
    import openai

    client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    response = await client.chat.completions.create(
        model=settings.LLM_MODEL,
        messages=messages,
        temperature=0.3,  # Low temperature for medical accuracy
        max_tokens=1000,
    )

    content = response.choices[0].message.content
    return _parse_llm_response(content)


async def _call_gemini(user_message: str, messages: list[dict], settings) -> dict:
    """Call Google Gemini API for symptom analysis."""
    try:
        from google import genai

        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        # Build prompt from messages
        prompt = messages[0]["content"] + "\n\nUser: " + user_message

        response = client.models.generate_content(
            model=settings.LLM_MODEL,
            contents=prompt,
        )

        return _parse_llm_response(response.text)
    except Exception as e:
        logger.warning(f"Gemini API failed: {e}")
        return _fallback_response(user_message)


def _parse_llm_response(content: str) -> dict:
    """Parse LLM response and extract triage level."""
    # Try to parse structured JSON response
    try:
        # Look for JSON block in the response
        if "```json" in content:
            json_str = content.split("```json")[1].split("```")[0].strip()
        elif "{" in content and "}" in content:
            start = content.index("{")
            end = content.rindex("}") + 1
            json_str = content[start:end]
        else:
            return {
                "response": content,
                "triage_level": TriageLevel.NONE,
                "sources": None,
            }

        data = json.loads(json_str)
        triage_map = {
            "green": TriageLevel.GREEN,
            "yellow": TriageLevel.YELLOW,
            "red": TriageLevel.RED,
            "none": TriageLevel.NONE,
        }

        return {
            "response": data.get("response", content),
            "triage_level": triage_map.get(
                data.get("triage_level", "none").lower(), TriageLevel.NONE
            ),
            "sources": data.get("sources"),
        }
    except (json.JSONDecodeError, ValueError, KeyError):
        return {
            "response": content,
            "triage_level": TriageLevel.NONE,
            "sources": None,
        }


def _fallback_response(user_message: str) -> dict:
    """Rule-based fallback when no LLM is available."""
    message_lower = user_message.lower()

    # Simple keyword-based triage
    severe_keywords = [
        "severe",
        "unbearable",
        "worst",
        "can't breathe",
        "blood",
        "unconscious",
    ]
    moderate_keywords = [
        "fever",
        "pain",
        "cough",
        "headache",
        "vomiting",
        "diarrhea",
        "rash",
        "swelling",
    ]
    mild_keywords = ["cold", "sneeze", "tired", "sore throat", "runny nose"]

    if any(kw in message_lower for kw in severe_keywords):
        triage = TriageLevel.YELLOW
        advice = "Based on your symptoms, I recommend consulting a doctor soon. These symptoms may need professional evaluation."
    elif any(kw in message_lower for kw in moderate_keywords):
        triage = TriageLevel.YELLOW
        advice = "Your symptoms suggest a condition that may benefit from medical attention. Monitor your symptoms and consider visiting a healthcare provider if they persist or worsen."
    elif any(kw in message_lower for kw in mild_keywords):
        triage = TriageLevel.GREEN
        advice = "Your symptoms appear mild. Rest, stay hydrated, and monitor your condition. If symptoms persist beyond 3-5 days or worsen, please consult a doctor."
    else:
        triage = TriageLevel.NONE
        advice = (
            "I understand you have a health concern. Could you please describe your symptoms "
            "in more detail? Include information like:\n"
            "- What symptoms are you experiencing?\n"
            "- How long have you had them?\n"
            "- How severe are they on a scale of 1-10?\n"
            "- Any other relevant medical history?"
        )

    return {
        "response": advice
        + "\n\n⚕️ *Disclaimer: This is not medical advice. Please consult a healthcare professional for proper diagnosis and treatment.*",
        "triage_level": triage,
        "sources": "CareNexus rule-based triage",
    }
