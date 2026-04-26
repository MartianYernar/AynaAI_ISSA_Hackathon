from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import AchievementRequest, ProfileRequest, RoadmapRequest
from services import ai

app = FastAPI()

# CORS: the React (or any) front end on another port can call this API
# without the browser blocking requests.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _require_gemini():
    """Short guard so we fail fast with a clear message if the key is missing."""
    if not ai.is_configured():
        raise HTTPException(
            status_code=503,
            detail="Gemini is not configured. Set GEMINI_API_KEY in backend/.env",
        )


@app.get("/")
def root():
    return {"status": "ok", "message": "Ayna AI backend running"}


@app.post("/api/profile/analyze")
def analyze_profile(data: ProfileRequest):
    """
    Turn survey answers + interests into interest clusters and a short summary.
    The heavy lifting is delegated to Gemini; we only shape the prompt and return JSON.
    """
    _require_gemini()

    answers_block = "\n".join(
        f"- {a}" for a in data.answers
    ) or "(no free-text answers)"
    interests_block = ", ".join(data.interests) or "(none listed)"

    prompt = f"""You are helping a student career app analyze a profile.

User's stated interests: {interests_block}

Their questionnaire answers (each line is one answer):
{answers_block}

Return a JSON object with exactly these keys:
- "interestClusters": an array of 3 to 6 objects, each with "name" (string) and "score" (integer 0-100).
- "summary": a short paragraph (2-4 sentences) in a supportive tone.

Be specific: reference themes from the answers, not generic praise."""

    try:
        out = ai.generate_json_object(prompt)
    except (ValueError, RuntimeError) as e:
        raise HTTPException(status_code=502, detail=str(e)) from e

    if not isinstance(out, dict) or "interestClusters" not in out or "summary" not in out:
        raise HTTPException(
            status_code=502,
            detail="Unexpected response shape from the model. Try again.",
        )
    return out


@app.post("/api/achievement/analyze")
def analyze_achievement(data: AchievementRequest):
    """Reframe a single achievement into impact, level, and a next-step idea."""
    _require_gemini()

    prompt = f"""You are a mentor reviewing a student achievement for a portfolio.

Title: {data.title}
Description: {data.description}

Return JSON with exactly these keys:
- "title": the same title as input (string)
- "impact": one or two sentences on why this matters
- "level": one of "Emerging", "Solid", "Strong" based on the write-up
- "suggestion": one concrete way to go deeper (project, role, or skill)

Be honest: if the description is thin, say so gently in "impact" and give a specific improvement in "suggestion"."""

    try:
        out = ai.generate_json_object(prompt)
    except (ValueError, RuntimeError) as e:
        raise HTTPException(status_code=502, detail=str(e)) from e

    if not isinstance(out, dict) or not all(
        k in out for k in ("title", "impact", "level", "suggestion")
    ):
        raise HTTPException(
            status_code=502,
            detail="Unexpected response shape from the model. Try again.",
        )
    return out


@app.post("/api/roadmap/generate")
def roadmap(data: RoadmapRequest):
    """A simple ordered roadmap from the user's interest list — good for planning screens."""
    _require_gemini()

    interests = data.interests or ["general learning"]
    interests_block = ", ".join(interests)

    prompt = f"""The student wants a learning roadmap. Their interests: {interests_block}

Return JSON with:
- "steps": an array of 5 to 8 short strings, ordered from first to later (actionable, specific)
- "based_on": a copy of the same interests as an array of strings, in the same order as above

Do not add keys other than "steps" and "based_on"."""

    try:
        out = ai.generate_json_object(prompt)
    except (ValueError, RuntimeError) as e:
        raise HTTPException(status_code=502, detail=str(e)) from e

    if not isinstance(out, dict) or "steps" not in out:
        raise HTTPException(
            status_code=502,
            detail="Unexpected response shape from the model. Try again.",
        )
    # Trust request interests if the model shuffled "based_on"
    out["based_on"] = data.interests
    return out
