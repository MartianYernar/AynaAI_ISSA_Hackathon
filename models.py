from pydantic import BaseModel
from typing import List

class ProfileRequest(BaseModel):
    answers: List[str]
    interests: List[str] = []

class AchievementRequest(BaseModel):
    title: str
    description: str

class RoadmapRequest(BaseModel):
    interests: List[str]