from openai import AsyncOpenAI
from app.core.config import settings
from datetime import datetime

def get_openai_client():
    if settings.GROQ_API_KEY:
        return AsyncOpenAI(api_key=settings.GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")
    if not settings.OPENAI_API_KEY:
         raise ValueError("Neither OPENAI_API_KEY nor GROQ_API_KEY is set in environment variables.")
    return AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

def get_system_prompt():
    current_time = datetime.now().strftime("%A, %B %d, %Y %H:%M:%S")
    return f"""You are an AI-powered search assistant. You will be provided with a user's prompt and a context consisting of web search results.
Your task is to answer the user's prompt using ONLY the provided context. 
You must include inline citations to the sources used in your answer. 
Citations must be formatted as standard Markdown links using the URLs provided in the context, like this: [[1]](https://example.com). This matches the Source ID and URL provided in the context.
If the context does not contain the answer, you should state that you cannot answer the question based on the provided information.
Do not hallucinate any information or URLs. Be concise and precise.

Current Date and Time: {current_time}"""

async def generate_streaming_response(query: str, context: str, history=None):
    client = get_openai_client()
    
    messages = [
        {"role": "system", "content": get_system_prompt()}
    ]
    
    if history:
        for msg in history:
            messages.append({"role": msg.role, "content": msg.content})

    messages.append({"role": "user", "content": f"Context:\n{context}\n\nQuery:\n{query}"})

    model_name = settings.GROQ_MODEL if settings.GROQ_API_KEY else "gpt-4o-mini"

    response_stream = await client.chat.completions.create(
        model=model_name,
        messages=messages,
        stream=True
    )
    
    return response_stream
