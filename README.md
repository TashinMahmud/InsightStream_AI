# AI Search Engine Production MVP

This is a full-stack AI-powered search engine built with FastAPI, Next.js, OpenAI, and Tavily.

## Prerequisites
- Node.js 18+
- Python 3.10+

## Setup Instructions

### 1. Backend Setup (FastAPI)
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Mac/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up Environment Variables:
   - Copy `.env.example` to a new file named `.env`.
   - **Crucial**: Paste your `OPENAI_API_KEY` and `TAVILY_API_KEY` in the newly created `.env` file.
   ```bash
   cp .env.example .env
   ```
5. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The backend will start at `http://localhost:8000`.

### 2. Frontend Setup (Next.js)
1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the Next.js development server:
   ```bash
   npm run dev
   ```
   The frontend will start at `http://localhost:3000`.

## Architecture Note
- **Backend Model**: Uses SQLite for fast local deployment. Chat history is saved entirely locally. 
- **Streaming**: Implements robust SSE (Server-Sent Events) returning chunks straight to the frontend using `ReadableStream`.
