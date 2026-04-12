import asyncio
from datetime import datetime
from fastapi import UploadFile
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, TypedDict
import tempfile
import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from langgraph.graph import StateGraph, END

# --- Define the CMS HR Matrix based on provided rules ---
CMS_MATRIX = {
    "PAS-1": {"level": 1, "min_total_exp": 1, "min_ph_exp": 0, "min_qual": 1, "w_total_yrs": 12, "w_rel_yrs": 6, "w_qual": 10, "w_cert": 0, "w_dom_keywords": 18, "w_sen_verbs": 4, "min_score": 35},
    "PAS-2": {"level": 2, "min_total_exp": 1, "min_ph_exp": 0, "min_qual": 1, "w_total_yrs": 14, "w_rel_yrs": 8, "w_qual": 10, "w_cert": 0, "w_dom_keywords": 20, "w_sen_verbs": 5, "min_score": 38},
    "PAS-3": {"level": 3, "min_total_exp": 2, "min_ph_exp": 0.5,"min_qual": 2, "w_total_yrs": 16, "w_rel_yrs": 10, "w_qual": 10, "w_cert": 4, "w_dom_keywords": 20, "w_sen_verbs": 6, "min_score": 42},
    "PAS-4": {"level": 4, "min_total_exp": 2.5,"min_ph_exp": 1,  "min_qual": 2, "w_total_yrs": 18, "w_rel_yrs": 12, "w_qual": 10, "w_cert": 6, "w_dom_keywords": 20, "w_sen_verbs": 7, "min_score": 46},
    "PAS-5": {"level": 5, "min_total_exp": 3, "min_ph_exp": 1.5,"min_qual": 2, "w_total_yrs": 18, "w_rel_yrs": 14, "w_qual": 10, "w_cert": 8, "w_dom_keywords": 20, "w_sen_verbs": 8, "min_score": 50},

    "PO-1": {"level": 6, "min_total_exp": 3, "min_ph_exp": 2, "min_qual": 2, "w_total_yrs": 20, "w_rel_yrs": 16, "w_qual": 10, "w_cert": 8, "w_dom_keywords": 24, "w_sen_verbs": 10, "min_score": 60},
    "PO-2": {"level": 7, "min_total_exp": 4, "min_ph_exp": 2.5, "min_qual": 2, "w_total_yrs": 20, "w_rel_yrs": 18, "w_qual": 10, "w_cert": 10, "w_dom_keywords": 24, "w_sen_verbs": 10, "min_score": 63},
    "PO-3": {"level": 8, "min_total_exp": 5, "min_ph_exp": 3, "min_qual": 2, "w_total_yrs": 20, "w_rel_yrs": 20, "w_qual": 10, "w_cert": 12, "w_dom_keywords": 24, "w_sen_verbs": 12, "min_score": 68},
    "PO-4": {"level": 9, "min_total_exp": 6, "min_ph_exp": 4, "min_qual": 3, "w_total_yrs": 20, "w_rel_yrs": 20, "w_qual": 10, "w_cert": 12, "w_dom_keywords": 24, "w_sen_verbs": 14, "min_score": 72},
    "PO-5": {"level": 10, "min_total_exp": 7, "min_ph_exp": 5, "min_qual": 3, "w_total_yrs": 20, "w_rel_yrs": 20, "w_qual": 10, "w_cert": 12, "w_dom_keywords": 24, "w_sen_verbs": 14, "min_score": 75},

    "JPA-1": {"level": 11, "min_total_exp": 4.5, "min_ph_exp": 2.5, "min_qual": 2, "w_total_yrs": 20, "w_rel_yrs": 18, "w_qual": 10, "w_cert": 8, "w_dom_keywords": 24, "w_sen_verbs": 10, "min_score": 62},
    "JPA-2": {"level": 12, "min_total_exp": 5.5, "min_ph_exp": 3, "min_qual": 2, "w_total_yrs": 20, "w_rel_yrs": 20, "w_qual": 10, "w_cert": 10, "w_dom_keywords": 24, "w_sen_verbs": 12, "min_score": 66},
    "JPA-3": {"level": 13, "min_total_exp": 6.5, "min_ph_exp": 4, "min_qual": 2, "w_total_yrs": 20, "w_rel_yrs": 20, "w_qual": 10, "w_cert": 12, "w_dom_keywords": 24, "w_sen_verbs": 12, "min_score": 70},
    "JPA-4": {"level": 14, "min_total_exp": 7.5, "min_ph_exp": 5, "min_qual": 3, "w_total_yrs": 20, "w_rel_yrs": 20, "w_qual": 10, "w_cert": 12, "w_dom_keywords": 24, "w_sen_verbs": 14, "min_score": 74},
    "JPA-5": {"level": 15, "min_total_exp": 8.5, "min_ph_exp": 6, "min_qual": 3, "w_total_yrs": 20, "w_rel_yrs": 20, "w_qual": 10, "w_cert": 12, "w_dom_keywords": 24, "w_sen_verbs": 14, "min_score": 77},

    "PRA-1": {"level": 16, "min_total_exp": 5, "min_ph_exp": 3, "min_qual": 2, "w_total_yrs": 20, "w_rel_yrs": 20, "w_qual": 10, "w_cert": 12, "w_dom_keywords": 22, "w_sen_verbs": 12, "min_score": 65},
    "PRA-2": {"level": 17, "min_total_exp": 6, "min_ph_exp": 4, "min_qual": 2, "w_total_yrs": 20, "w_rel_yrs": 20, "w_qual": 10, "w_cert": 12, "w_dom_keywords": 22, "w_sen_verbs": 12, "min_score": 68},
    "PRA-3": {"level": 18, "min_total_exp": 7, "min_ph_exp": 5, "min_qual": 3, "w_total_yrs": 20, "w_rel_yrs": 20, "w_qual": 10, "w_cert": 12, "w_dom_keywords": 22, "w_sen_verbs": 14, "min_score": 72},
    "PRA-4": {"level": 19, "min_total_exp": 8, "min_ph_exp": 6, "min_qual": 3, "w_total_yrs": 20, "w_rel_yrs": 20, "w_qual": 10, "w_cert": 12, "w_dom_keywords": 22, "w_sen_verbs": 14, "min_score": 76},
    "PRA-5": {"level": 20, "min_total_exp": 9, "min_ph_exp": 7, "min_qual": 3, "w_total_yrs": 20, "w_rel_yrs": 20, "w_qual": 10, "w_cert": 12, "w_dom_keywords": 22, "w_sen_verbs": 16, "min_score": 80},

    "SPA-1": {"level": 21, "min_total_exp": 7, "min_ph_exp": 5, "min_qual": 2, "w_total_yrs": 22, "w_rel_yrs": 22, "w_qual": 10, "w_cert": 12, "w_dom_keywords": 20, "w_sen_verbs": 14, "min_score": 65},
    "SPA-2": {"level": 22, "min_total_exp": 8, "min_ph_exp": 6, "min_qual": 2, "w_total_yrs": 22, "w_rel_yrs": 22, "w_qual": 10, "w_cert": 12, "w_dom_keywords": 20, "w_sen_verbs": 14, "min_score": 68},
    "SPA-3": {"level": 23, "min_total_exp": 9, "min_ph_exp": 7, "min_qual": 3, "w_total_yrs": 22, "w_rel_yrs": 22, "w_qual": 10, "w_cert": 12, "w_dom_keywords": 20, "w_sen_verbs": 14, "min_score": 72},
    "SPA-4": {"level": 24, "min_total_exp": 10, "min_ph_exp": 8, "min_qual": 3, "w_total_yrs": 22, "w_rel_yrs": 22, "w_qual": 10, "w_cert": 12, "w_dom_keywords": 20, "w_sen_verbs": 14, "min_score": 76},
    "SPA-5": {"level": 25, "min_total_exp": 11, "min_ph_exp": 9, "min_qual": 3, "w_total_yrs": 22, "w_rel_yrs": 22, "w_qual": 10, "w_cert": 12, "w_dom_keywords": 20, "w_sen_verbs": 14, "min_score": 80},
}

# Recalibrated caps — set so a genuinely strong-but-not-extreme candidate scores near 100%
MAX_TOTAL_YEARS = 10.0        # 10-year veteran = full credit
MAX_RELEVANT_YEARS = 7.0      # 7y Africa PH = full credit
MAX_QUALIFICATION = 4.0       # unchanged
MAX_CERTIFICATIONS = 3.0      # unchanged
MAX_DOMAIN_KEYWORDS = 6.0     # 6 keyword hits = full credit
MAX_SENIORITY_VERBS = 4.0     # 4 leadership verbs = full credit


class ResumeExtractionOutput(BaseModel):
    total_exp_years: float = Field(description="Total years of professional experience across all roles. E.g., 5.5")
    ph_africa_exp_years: float = Field(description="Years of relevant Public Health (PH) experience specifically in Africa.")
    qualification: int = Field(description="Highest qualification integer level: 1 for OND/Diploma/BSc in view, 2 for BSc, 3 for MSc/MPH, 4 for PhD.")
    certifications_count: int = Field(description="Number of professional certifications listed in the resume.")
    domain_keywords_found: List[str] = Field(description="List of domain keywords explicitly found in the resume from this exact list: [LMIS, RI, OBR, LQAS, IDSR, Supportive supervision, Stakeholder engagement, Donor reporting, Workplan, Quality assurance, Budget, Policy, Logistics, Data quality]")
    seniority_verbs_found: List[str] = Field(description="List of seniority verbs explicitly found in the resume from this exact list: [led, managed, coordinated, supervised, designed, owned, delivered, facilitated, implemented, oversaw]")
    
output_parser = PydanticOutputParser(pydantic_object=ResumeExtractionOutput)

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0.0,  # low temperature for data extraction accuracy
    max_tokens=None,
    timeout=None,
    max_retries=2
)

def _current_month_year() -> str:
    return datetime.now().strftime("%B %Y")  # e.g. "April 2026"

prompt = PromptTemplate(
    input_variables=["resume"],
    template="""You are a precise HR documentation parser. Your job is to extract structured numeric data from a candidate resume for an automated role-levelling engine.

CRITICAL RULES — read carefully before extracting:

1. TOTAL EXPERIENCE (total_exp_years):
   - Count ALL years of paid professional work, including internships, consultancy, volunteer-with-stipend, and programme support roles.
   - Use the date ranges in the resume. If a role is "till date" or "present", calculate to """ + _current_month_year() + """.
   - Sum all non-overlapping periods.

2. AFRICA PUBLIC HEALTH EXPERIENCE (ph_africa_exp_years):
   - This means time spent working ON or IN SUPPORT OF a public health programme in any African country.
   - African countries include Nigeria, Ghana, Kenya, Ethiopia, Uganda, Rwanda, Tanzania, South Africa, Malawi, Zimbabwe, Zambia, and all others on the continent.
   - Qualifying programme areas: HIV/AIDS, malaria, tuberculosis, polio, nutrition, immunisation, health system strengthening, RMNCH, family planning, disease surveillance.
   - Qualifying roles: Programme Officer, Programme Assistant, M&E Officer, Admin Support (on a health project), Community Health Worker, Surge Staff, Intern (on a health project), Data Officer (on a health project).
   - Do NOT restrict this to "Public Health" job titles. If the person is working on an HIV/AIDS or health project in an African country, those years count.
   - Example: "Programme Assistant at AHNi, Anambra State, supporting HIV/AIDS programme" = Africa PH experience.

3. QUALIFICATION (qualification integer):
   - 1 = OND, HND, Diploma, or "BSc in view" / "awaiting results"
   - 2 = BSc, BA, B.Ed, BTech or equivalent bachelor's degree
   - 3 = MSc, MPH, MA, MBA, MPhil or equivalent postgraduate degree
   - 4 = PhD or Doctorate
   - Return the HIGHEST completed or in-view qualification found.

4. CERTIFICATIONS (certifications_count):
   - Count only formal certifications and structured professional trainings listed.
   - Include: training courses completed, certificates awarded, and professional development programmes.
   - Do NOT count degree programmes (those go in qualification).

5. DOMAIN KEYWORDS (domain_keywords_found):
   - Return ONLY keywords from this exact list that appear in the resume (case-insensitive):
   - [LMIS, RI, OBR, LQAS, IDSR, Supportive supervision, Stakeholder engagement, Donor reporting, Workplan, Quality assurance, Budget, Policy, Logistics, Data quality]
   - Include a keyword if the concept is clearly present, even if phrased slightly differently (e.g. "work plan" counts as "Workplan").

6. SENIORITY VERBS (seniority_verbs_found):
   - Return ONLY verbs from this exact list that appear in the resume:
   - [led, managed, coordinated, supervised, designed, owned, delivered, facilitated, implemented, oversaw]
   - Include a verb if any conjugation of it appears (e.g. "coordinates", "leading", "managed" all count).

Candidate Resume Text:
---------------------
{resume}
---------------------

{format_instructions}""",
    partial_variables={"format_instructions": output_parser.get_format_instructions()}
)

rank_chain = prompt | llm | output_parser

def extract_text_from_file(file: UploadFile) -> str | None:
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

def evaluate_candidate(extracted: ResumeExtractionOutput):
    QUAL_MAP = {0: "None/Unknown", 1: "OND/Diploma", 2: "BSc", 3: "MSc/MPH", 4: "PhD"}

    eligible_levels = []
    passed_gates_failed_score = []  # Passed all hard gates but score below threshold
    failed_gate_records = []        # Failed at least one hard gate

    for level_name, reqs in CMS_MATRIX.items():
        # --- Gate-by-gate audit ---
        gates = [
            {
                "criterion": "Total Experience",
                "required": f"{reqs['min_total_exp']}y",
                "has": f"{extracted.total_exp_years}y",
                "passed": extracted.total_exp_years >= reqs["min_total_exp"],
                "gap": max(0, round(reqs["min_total_exp"] - extracted.total_exp_years, 1)),
            },
            {
                "criterion": "Africa PH Experience",
                "required": f"{reqs['min_ph_exp']}y",
                "has": f"{extracted.ph_africa_exp_years}y",
                "passed": extracted.ph_africa_exp_years >= reqs["min_ph_exp"],
                "gap": max(0, round(reqs["min_ph_exp"] - extracted.ph_africa_exp_years, 1)),
            },
            {
                "criterion": "Minimum Qualification",
                "required": QUAL_MAP.get(reqs["min_qual"], "Unknown"),
                "has": QUAL_MAP.get(extracted.qualification, "Unknown"),
                "passed": extracted.qualification >= reqs["min_qual"],
                "gap": 0,
            },
        ]
        gate_failed = any(not g["passed"] for g in gates)

        if gate_failed:
            failed_gate_records.append({"level": level_name, "gates": gates})
            continue

        # --- Weighted score (all gates passed) ---
        # Normalize weights per level so max achievable is always 100%.
        # This corrects the original matrix where lower-level weight sums < 100.
        w_total = (reqs["w_total_yrs"] + reqs["w_rel_yrs"] + reqs["w_qual"] +
                   reqs["w_cert"] + reqs["w_dom_keywords"] + reqs["w_sen_verbs"])
        factor  = 100.0 / w_total  # e.g. PAS-1 sum=50 → factor=2.0

        norm_total_yrs = min(1.0, extracted.total_exp_years / MAX_TOTAL_YEARS) if extracted.total_exp_years else 0
        norm_rel_yrs   = min(1.0, extracted.ph_africa_exp_years / MAX_RELEVANT_YEARS) if extracted.ph_africa_exp_years else 0
        norm_qual      = min(1.0, extracted.qualification / MAX_QUALIFICATION) if extracted.qualification else 0
        norm_cert      = min(1.0, extracted.certifications_count / MAX_CERTIFICATIONS) if extracted.certifications_count else 0
        norm_dom       = min(1.0, len(extracted.domain_keywords_found) / MAX_DOMAIN_KEYWORDS) if extracted.domain_keywords_found else 0
        norm_sen       = min(1.0, len(extracted.seniority_verbs_found) / MAX_SENIORITY_VERBS) if extracted.seniority_verbs_found else 0

        # Effective (normalized) weight for each factor
        ew_total = reqs["w_total_yrs"]     * factor
        ew_rel   = reqs["w_rel_yrs"]       * factor
        ew_qual  = reqs["w_qual"]          * factor
        ew_cert  = reqs["w_cert"]          * factor
        ew_dom   = reqs["w_dom_keywords"]  * factor
        ew_sen   = reqs["w_sen_verbs"]     * factor

        score = (norm_total_yrs * ew_total +
                 norm_rel_yrs   * ew_rel   +
                 norm_qual      * ew_qual  +
                 norm_cert      * ew_cert  +
                 norm_dom       * ew_dom   +
                 norm_sen       * ew_sen)

        breakdown = {
            "Total Years":    f"{round(norm_total_yrs * ew_total, 1)}/{round(ew_total, 1)}",
            "Relevant Years": f"{round(norm_rel_yrs   * ew_rel,   1)}/{round(ew_rel,   1)}",
            "Qualification":  f"{round(norm_qual      * ew_qual,  1)}/{round(ew_qual,  1)}",
            "Certifications": f"{round(norm_cert      * ew_cert,  1)}/{round(ew_cert,  1)}",
            "Keywords":       f"{round(norm_dom       * ew_dom,   1)}/{round(ew_dom,   1)}",
            "Verbs":          f"{round(norm_sen       * ew_sen,   1)}/{round(ew_sen,   1)}",
        }

        if score >= reqs["min_score"]:
            eligible_levels.append({
                "level_name": level_name,
                "level_rank": reqs["level"],
                "score": round(score, 2),
                "breakdown": breakdown,
            })
        else:
            passed_gates_failed_score.append({
                "level": level_name,
                "level_rank": reqs["level"],
                "score": round(score, 2),
                "threshold": reqs["min_score"],
                "gap": round(reqs["min_score"] - score, 2),
                "breakdown": breakdown,
            })

    # --- Common extracted metrics returned for all candidates ---
    common_metrics = {
        "total_exp":      extracted.total_exp_years,
        "ph_exp":         extracted.ph_africa_exp_years,
        "qualification":  extracted.qualification,
        "certifications": extracted.certifications_count,
        "keywords_found": extracted.domain_keywords_found,
        "verbs_found":    extracted.seniority_verbs_found,
    }

    if not eligible_levels:
        # Closest level the candidate almost reached (passed gates, smallest score gap)
        closest = min(passed_gates_failed_score, key=lambda x: x["gap"]) if passed_gates_failed_score else None

        # Show gate details for the first 3 PAS levels so HR can see the basic bar
        gate_summary = [r for r in failed_gate_records if r["level"].startswith("PAS")][:3]

        if closest:
            reasoning = (
                f"Passed all hard gates for {closest['level']} but scored {closest['score']}% "
                f"against the required threshold of {closest['threshold']}% "
                f"({closest['gap']} points short). "
                f"Increasing Africa PH experience, domain keyword coverage, and formal "
                f"certifications would improve the score significantly."
            )
        else:
            top_failure_gates = []
            if failed_gate_records:
                top_failure_gates = [g["criterion"] for g in failed_gate_records[0]["gates"] if not g["passed"]]
            reasoning = (
                f"Did not meet the minimum hard gate requirements for any CMS level. "
                f"Primary blockers: {', '.join(top_failure_gates) if top_failure_gates else 'multiple criteria'}. "
                f"Review the Gate Analysis below for a level-by-level breakdown."
            )

        return {
            "assigned_level": "None",
            "score": closest["score"] if closest else 0,
            "metrics": common_metrics,
            "breakdown": closest["breakdown"] if closest else None,
            "gate_analysis": gate_summary,
            "closest_level": closest,
            "reasoning": reasoning,
        }

    # --- Found eligible levels — return the highest one ---
    eligible_levels.sort(key=lambda x: x["level_rank"], reverse=True)
    best_match = eligible_levels[0]

    return {
        "assigned_level": best_match["level_name"],
        "score": best_match["score"],
        "metrics": common_metrics,
        "breakdown": best_match["breakdown"],
        "gate_analysis": None,
        "closest_level": None,
        "reasoning": (
            f"Met all hard gates and scored {best_match['score']}% "
            f"(threshold: {CMS_MATRIX[best_match['level_name']]['min_score']}%), "
            f"qualifying for {best_match['level_name']}."
        ),
    }

class LevelingState(TypedDict):
    resume_texts: Dict[str, str]
    leveled_results: List[Dict]

async def process_single_resume(filename: str, resume_text: str):
    try:
        # LLM extracts the features
        llm_output: ResumeExtractionOutput = await rank_chain.ainvoke({"resume": resume_text})
        # Score the candidate deterministically
        evaluation = evaluate_candidate(llm_output)
        
        return {
            "filename": filename,
            "assigned_level": evaluation["assigned_level"],
            "score": evaluation["score"],
            "reasoning": evaluation["reasoning"],
            "metrics": evaluation["metrics"],
            "breakdown": evaluation["breakdown"],
            "gate_analysis": evaluation.get("gate_analysis"),
            "closest_level": evaluation.get("closest_level"),
        }
    except Exception as e:
        print(f"Error parsing LLM output for {filename}: {e}")
        return {
            "filename": filename,
            "assigned_level": "Error",
            "score": 0,
            "reasoning": "Could not extract structured data. Ensure resume contains valid text.",
            "metrics": None,
            "breakdown": None,
            "extracted_data": None
        }

async def process_resumes(state: LevelingState):
    tasks = [process_single_resume(filename, text) for filename, text in state["resume_texts"].items()]
    results = await asyncio.gather(*tasks)
    return {"leveled_results": sorted(results, key=lambda x: x["score"], reverse=True)}

def format_results(state: LevelingState):
    return {"leveled_results": state["leveled_results"]}

# Define the LangGraph
workflow = StateGraph(LevelingState)
workflow.add_node("process_resumes", process_resumes)
workflow.add_node("format_results", format_results)

workflow.set_entry_point("process_resumes")
workflow.add_edge("process_resumes", "format_results")
workflow.add_edge("format_results", END)

graph = workflow.compile()
