from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class SearchHistoryResponse(BaseModel):
    id: int
    query: str
    response: str
    created_at: datetime

    class Config:
        from_attributes = True

class Message(BaseModel):
    role: str
    content: str

class SearchRequest(BaseModel):
    query: str
    history: Optional[List[Message]] = []
