from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from workflow_processing import extract_text_from_file, graph

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/rank_resumes/")
async def upload_and_rank(
    job_description_file: UploadFile = File(...),
    resume_files: List[UploadFile] = File(...),
):
    job_description_text = extract_text_from_file(job_description_file)
    if not job_description_text:
        return {"error": "Failed to extract text from the job description."}

    resume_texts = {}
    for resume_file in resume_files:
        resume_text = extract_text_from_file(resume_file)
        if resume_text:
            resume_texts[resume_file.filename] = resume_text

    if not resume_texts:
        return {"message": "No valid resumes uploaded."}

    inputs = {"job_description": job_description_text, "resume_texts": resume_texts, "ranked_results": []}
    result = await graph.ainvoke(inputs)
    return result["ranked_results"]


@app.get("/")
async def root():
    return {
        "message": "Resume Ranker Endpoint",
        "project": "API for Ranking Resume based on relevance to the Job Description given",
        "documentation": {
            "swagger": "/docs",
            "redoc": "/redoc"
        }
    }

