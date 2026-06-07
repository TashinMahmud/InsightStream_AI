# 🔍 InsightStream AI — Full-Stack Real-Time SSE Search Platform

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-005571?style=for-the-badge&logo=fastapi&logoColor=white)](#1-backend-setup-fastapi)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/)
[![Groq](https://img.shields.io/badge/Groq-llama--3.3-orange?style=for-the-badge)](#openai-stream-client)
[![Tavily API](https://img.shields.io/badge/Tavily-Search_API-0284C7?style=for-the-badge)](#tavily-search-context-client)
[![SQLite](https://img.shields.io/badge/SQLite-Local_DB-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](#sqlite-history-database)

---

**InsightStream AI** is a high-performance, full-stack search application. By marrying a **FastAPI** backend with a **Next.js** frontend, it takes natural language queries, queries the **Tavily API** for real-time web context, processes and summarizes the fetched results through **OpenAI GPT** or **Groq** models (if configured), streams responses to the client using Server-Sent Events (SSE), and saves session chat history to a local SQLite database.

</div>

---

## 🛠️ Technical Architecture

The platform splits execution between a Next.js client-side UI and an asynchronous FastAPI backend coordinator.

```
+-------------------------------------------------------------+
|                     NEXT.JS FRONTEND                        |
|  Displays search bar, parses SSE, renders real-time stream  |
+------------------------------+------------------------------+
                               | (HTTP POST /api/search)
                               v
+-------------------------------------------------------------+
|                     FASTAPI API ROUTER                      |
|  Validates queries and manages SSE StreamingResponse        |
+------------------------------+------------------------------+
                               |
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
+-----------------------+               +-----------------------+
|  TAVILY SEARCH CLIENT |               |  OPENAI STREAM CLIENT |
|  Queries web indexing  | <===========> |  Generates response   |
|  for live context     |               |  using live web data  |
+-----------------------+               +-----------┬-----------+
                                                    |
                                                    v (BackgroundTasks)
                                        +-----------------------+
                                        |    SQLITE DATABASE    |
                                        |  Saves search history |
                                        +-----------------------+
```

### Core Code Modules & Responsibilities

*   `backend/` Directory:
    *   [`app/api/routes/search.py`](backend/app/api/routes/search.py): Coordinates Tavily queries, initiates the OpenAI chat completion parsing loop, streams events, and triggers asynchronous background database saves.
    *   [`app/api/routes/history.py`](backend/app/api/routes/history.py): Retrieves past search sessions and individual logs.
    *   [`app/services/tavily_client.py`](backend/app/services/tavily_client.py): Formulates queries and fetches search context from Tavily.
    *   [`app/services/openai_client.py`](backend/app/services/openai_client.py): Formats prompts with web context and conversation history, calling the OpenAI streaming API.
    *   [`app/data/database.py`](backend/app/data/database.py): Initializes SQLite engine and handles session database access.
*   `frontend/` Directory:
    *   Next.js web components utilizing browser `ReadableStream` readers to parse SSE chunks and dynamically render markdown responses.

---

## ⚡ Core Integration Interfaces

<details>
<summary><b>🌐 Tavily Search Context Client</b></summary>

Connects to the Tavily API to fetch clean, search-optimized web snippets. It bypasses raw HTML scraping to retrieve structured text summaries, which are then injected as a prompt supplement to the LLM.
</details>

<details>
<summary><b>📡 SSE StreamingResponse & Generator</b></summary>

Uses FastAPI `StreamingResponse` with `media_type="text/event-stream"`. The engine yields the unique `session_id` in a JSON header block, then streams text tokens from the OpenAI generator directly to the frontend, preventing request timeouts.
</details>

<details>
<summary><b>💾 SQLite History Database</b></summary>

Saves the search queries and completed AI summaries to a local SQLite file (`search_history.db`). Database insertions are offloaded to FastAPI `BackgroundTasks` to avoid delaying the client streaming session.
</details>

---

## 🚀 Setup Instructions

### 1. Backend Setup (FastAPI)
1.  Navigate to the `backend/` directory:
    ```bash
    cd backend
    ```
2.  Create and activate a virtual environment:
    ```bash
    python -m venv venv
    # On Windows:
    .\venv\Scripts\activate
    # On macOS/Linux:
    source venv/bin/activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Configure environment variables:
    Copy `.env.example` to `.env` and fill in your keys:
    ```env
    OPENAI_API_KEY=your_openai_key_here
    TAVILY_API_KEY=your_tavily_key_here
    DATABASE_URL=sqlite:///./search_history.db

    # Optional: Set GROQ API Key to switch the chat completion client from OpenAI to Groq
    GROQ_API_KEY=your_groq_key_here
    GROQ_MODEL=llama-3.3-70b-versatile
    ```
5.  Run the server:
    ```bash
    uvicorn app.main:app --reload
    ```
    Backend will run at `http://localhost:8000`.

### 2. Frontend Setup (Next.js)
1.  Open a new terminal and navigate to the `frontend/` directory:
    ```bash
    cd frontend
    ```
2.  Install packages:
    ```bash
    npm install
    ```
3.  Start the Next.js development server:
    ```bash
    npm run dev
    ```
    Frontend will run at `http://localhost:3000`.

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
