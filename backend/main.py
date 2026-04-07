from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from workflow_processing import extract_text_from_file, graph

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*", "http://localhost:8081/"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/rank_resumes/")
async def upload_and_rank(
    resume_files: List[UploadFile] = File(...),
):
    resume_texts = {}
    for resume_file in resume_files:
        resume_text = extract_text_from_file(resume_file)
        if resume_text:
            resume_texts[resume_file.filename] = resume_text

    if not resume_texts:
        return {"message": "No valid resumes uploaded."}

    inputs = {"resume_texts": resume_texts, "leveled_results": []}
    result = await graph.ainvoke(inputs)
    return result["leveled_results"]


@app.get("/")
async def root():
    return {
        "message": "HR Candidate Leveling System",
        "project": "API for deterministic levelling of candidates against standard CMS frameworks.",
        "documentation": {
            "swagger": "/docs",
            "redoc": "/redoc"
        }
    }
