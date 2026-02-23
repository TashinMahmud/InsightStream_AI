from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.schemas.history import SearchHistoryResponse, SessionGroupResponse
from app.data.database import get_db
from app.model.history import SearchHistory

router = APIRouter()

@router.get("/history", response_model=List[SessionGroupResponse])
def get_search_history(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    # Group history by session_id to show unique chat instances in the sidebar
    subquery = (
        db.query(
            SearchHistory.session_id,
            func.max(SearchHistory.created_at).label("latest_created_at")
        )
        .group_by(SearchHistory.session_id)
        .subquery()
    )

    history = (
        db.query(SearchHistory)
        .join(subquery, (SearchHistory.session_id == subquery.c.session_id) & (SearchHistory.created_at == subquery.c.latest_created_at))
        .order_by(SearchHistory.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return history

@router.get("/history/{session_id}", response_model=List[SearchHistoryResponse])
def get_search_history_by_session(session_id: str, db: Session = Depends(get_db)):
    # Return chronological chat loops for a specific session to reconstruct the UI
    history = db.query(SearchHistory).filter(SearchHistory.session_id == session_id).order_by(SearchHistory.created_at.asc()).all()
    if not history:
        raise HTTPException(status_code=404, detail="Session not found")
    return history
