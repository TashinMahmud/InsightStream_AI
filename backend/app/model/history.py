from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime, timezone
from app.data.database import Base

class SearchHistory(Base):
    __tablename__ = "search_history"

    id = Column(Integer, primary_key=True, index=True)
    query = Column(String, index=True)
    response = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
