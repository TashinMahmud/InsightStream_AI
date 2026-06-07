from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import search, history
from app.data.database import engine, Base

# Create the database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Search Engine API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for production and preview deployments
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search.router, prefix="/api", tags=["Search"])
app.include_router(history.router, prefix="/api", tags=["History"])

@app.get("/")
def read_root():
    return {"message": "Welcome to AI Search Engine API", "version": "v1.1"}
