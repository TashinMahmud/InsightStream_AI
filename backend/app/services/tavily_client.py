from tavily import TavilyClient
from app.core.config import settings

def get_tavily_client():
    if not settings.TAVILY_API_KEY:
        raise ValueError("TAVILY_API_KEY is not set in environment variables.")
    return TavilyClient(api_key=settings.TAVILY_API_KEY)

def fetch_search_context(query: str):
    client = get_tavily_client()
    # Perform a search and get top 5 results
    response = client.search(query=query, search_depth="basic", max_results=5)
    
    context_chunks = []
    for idx, result in enumerate(response.get("results", [])):
        title = result.get("title", "No Title")
        url = result.get("url", "#")
        content = result.get("content", "")
        # Format the context for the LLM
        context_chunks.append(f"Source [{idx+1}]: {title}\nURL: {url}\nContent: {content}\n")
    
    return "\n\n".join(context_chunks)
