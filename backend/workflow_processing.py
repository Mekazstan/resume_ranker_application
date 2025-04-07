import asyncio
from fastapi import UploadFile
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import tempfile
import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.output_parsers import PydanticOutputParser
from langgraph.graph import StateGraph, END


class LLMRelevanceOutput(BaseModel):
    relevance_score: int = Field(description="Relevance score on a scale of 1 to 10")
    reasoning: str = Field(description="Reasoning for the assigned relevance score")
    
output_parser = PydanticOutputParser(pydantic_object=LLMRelevanceOutput)

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0.5,
    max_tokens=None,
    timeout=None,
    max_retries=2
)

prompt = PromptTemplate(
    input_variables=["job_description", "resume"],
    template="""You are an experienced recruiter evaluating resumes against a job description. 
    Please read the following job description and resume and provide a relevance score on a scale of 1 to 10 (1 being least relevant, 10 being most relevant) and a brief explanation for your score.

    Job Description:
    {job_description}

    Resume:
    {resume}

    {format_instructions}""",
        partial_variables={"format_instructions": output_parser.get_format_instructions()}
)

rank_chain = prompt | llm | output_parser

def extract_text_from_file(file: UploadFile) -> str | None:
    # Using Python's tempfile module to create a temporary file for storing the extracted texts
    with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
        tmp_file.write(file.file.read())
        temp_file_path = tmp_file.name

    try:
        if file.filename.endswith(".pdf"):
            loader = PyPDFLoader(temp_file_path)
            documents = loader.load()
        elif file.filename.endswith(".docx"):
            loader = Docx2txtLoader(temp_file_path)
            documents = loader.load()
        elif file.filename.endswith(".txt"):
            with open(temp_file_path, 'r', encoding='utf-8') as f:
                text = f.read()
            return text
        else:
            return None
        text = "\n".join([doc.page_content for doc in documents])
        return text
    finally:
        os.unlink(temp_file_path)

class RankingState:
    job_description: str
    resume_texts: Dict[str, str]
    ranked_results: List[Dict[str, any]] = None
    
    def __init__(self, job_description: str, resume_texts: Dict[str, str], ranked_results: Optional[List[Dict[str, any]]] = None):
        self.job_description = job_description
        self.resume_texts = resume_texts
        self.ranked_results = ranked_results

async def rank_single_resume(state: RankingState, filename: str, resume_text: str):
    try:
        llm_output: LLMRelevanceOutput = await rank_chain.ainvoke({"job_description": state.job_description, "resume": resume_text})
        score = llm_output.relevance_score
        reasoning = llm_output.reasoning
    except Exception as e:
        print(f"Error parsing LLM output: {e}")
        score = 0
        reasoning = "Could not parse LLM output."
    return {"filename": filename, "score": score, "reasoning": reasoning}

async def process_resumes(state: RankingState):
    tasks = [rank_single_resume(state, filename, text) for filename, text in state.resume_texts.items()]
    results = await asyncio.gather(*tasks)
    return {"ranked_results": sorted(results, key=lambda x: x["score"], reverse=True)}

def format_results(state: RankingState):
    return {"ranked_resumes": state.ranked_results}

# Define the LangGraph
workflow = StateGraph(RankingState)
workflow.add_node("process_resumes", process_resumes)
workflow.add_node("format_results", format_results)

workflow.set_entry_point("process_resumes")
workflow.add_edge("process_resumes", "format_results")
workflow.add_edge("format_results", END)

graph = workflow.compile()
