from fastapi import APIRouter, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.schemas.history import SearchRequest
from app.services.tavily_client import fetch_search_context
from app.services.openai_client import generate_streaming_response
from app.data.database import get_db
from app.model.history import SearchHistory
import json
import uuid

router = APIRouter()

def save_to_db(db: Session, session_id: str, title: str, query: str, full_response: str):
    new_history = SearchHistory(
        session_id=session_id, 
        title=title, 
        query=query, 
        response=full_response
    )
    db.add(new_history)
    db.commit()

@router.post("/search")
async def search_streaming(request: SearchRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    query = request.query
    history = request.history
    session_id = request.session_id or str(uuid.uuid4())
    
    # Determine the title (use first query if it's a new session, or fetch existing)
    title = query[:50] + "..." if len(query) > 50 else query
    if request.session_id:
        existing_session = db.query(SearchHistory).filter(SearchHistory.session_id == session_id).first()
        if existing_session and existing_session.title:
            title = existing_session.title
    
    try:
        # 1. Fetch search context using Tavily (ONLY SINGLE QUERY)
        context = fetch_search_context(query)
    except Exception as e:
        # Return a simple generator stream if Tavily fails
        async def error_stream():
            yield f"Error fetching search context: {str(e)}"
        return StreamingResponse(error_stream(), media_type="text/event-stream")

    try:
        # 2. Get the OpenAI Response Stream (SENDS HISTORY FOR CONTEXT MEMORY LOOP FIX)
        openai_stream = await generate_streaming_response(query, context, history)
    except Exception as e:
        # Return a simple generator stream if OpenAI fails
        async def error_stream():
             yield f"Error generating answer: {str(e)}"
        return StreamingResponse(error_stream(), media_type="text/event-stream")

    # 3. Stream and accumulate the response
    async def event_generator():
        # Yield the session ID as a system JSON string before actual text begins
        yield json.dumps({"session_id": session_id}) + "\n"

        full_response = ""
        try:
            async for chunk in openai_stream:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    full_response += content
                    yield content
                    
            # 4. Save to DB in the background after streaming completes
            background_tasks.add_task(save_to_db, db, session_id, title, query, full_response)
        except Exception as e:
            yield f"\n\n[Error during stream: {str(e)}]"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
