from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.schemas.history import SearchHistoryResponse
from app.data.database import get_db
from app.model.history import SearchHistory

router = APIRouter()

@router.get("/history", response_model=List[SearchHistoryResponse])
def get_search_history(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    history = db.query(SearchHistory).order_by(SearchHistory.created_at.desc()).offset(skip).limit(limit).all()
    return history
