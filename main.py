from fastapi import FastAPI
from models import ProfileRequest, AchievementRequest, RoadmapRequest
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# ✅ CORS (чтобы React работал без ошибок)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🟢 root test
@app.get("/")
def root():
    return {"status": "ok", "message": "Ayna AI backend running"}

# 🧠 1. Profile analysis
@app.post("/api/profile/analyze")
def analyze_profile(data: ProfileRequest):

    # MOCK LOGIC (позже заменишь на Gemini API)
    return {
        "interestClusters": [
            {"name": "Robotics", "score": 88},
            {"name": "AI", "score": 76}
        ],
        "summary": f"You wrote {len(data.answers)} answers. Strong analytical thinking detected."
    }

# 🏆 2. Achievement analysis
@app.post("/api/achievement/analyze")
def analyze_achievement(data: AchievementRequest):

    return {
        "title": data.title,
        "impact": "Shows initiative and technical skills",
        "level": "Strong",
        "suggestion": "Turn this into a portfolio project"
    }

# 🗺️ 3. Roadmap generation
@app.post("/api/roadmap/generate")
def roadmap(data: RoadmapRequest):

    return {
        "steps": [
            "Learn Python basics",
            "Build 1 small project",
            "Join competition or hackathon",
            "Create GitHub portfolio"
        ],
        "based_on": data.interests
    }