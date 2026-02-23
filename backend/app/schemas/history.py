from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class SearchHistoryResponse(BaseModel):
    id: int
    session_id: str
    title: str
    query: str
    response: str
    created_at: datetime

    class Config:
        from_attributes = True

class SessionGroupResponse(BaseModel):
    session_id: str
    title: str
    created_at: datetime

class Message(BaseModel):
    role: str
    content: str

class SearchRequest(BaseModel):
    query: str
    session_id: Optional[str] = None
    history: Optional[List[Message]] = []
