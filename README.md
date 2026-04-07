# HR Candidate Levelling Engine

An AI-powered tool that automatically evaluates candidate resumes against a standardised **CMS (Capacity Management System)** role framework — assigning each applicant their most appropriate level across five role families: **Programme Assistant (PAS)**, **Project Officer (PO)**, **Junior Programme Associate (JPA)**, **Programme Associate (PRA)**, and **Senior Programme Associate (SPA)**.

Built for real-world HR use in public health programme environments in Africa.

---

## What It Does

Instead of manually reading through CVs and guessing suitability, this engine:

1. **Extracts structured metrics from each resume** using an LLM (Groq / llama-3.3-70b-versatile):
   - Total years of professional experience
   - Years of relevant Public Health experience in Africa
   - Highest qualification level (OND → BSc → MSc/MPH → PhD)
   - Number of formal certifications
   - Domain keyword matches (e.g., LMIS, RI, OBR, LQAS, Donor reporting, Workplan, Data quality…)
   - Seniority verb matches (e.g., led, managed, coordinated, supervised, designed…)

2. **Runs a deterministic scoring engine** against 25 CMS role levels (5 families × 5 levels):
   - Enforces **Hard Gates** first (minimum experience, qualifications, Africa PH background)
   - Calculates a **weighted composite score** for every level the candidate clears
   - Assigns the **highest eligible CMS level** the candidate qualifies for

3. **Returns a detailed breakdown** for every candidate:
   - Assigned CMS level (e.g., `PO-3`, `PAS-2`)
   - Matrix math breakdown (how each factor contributed to the score)
   - For unqualified candidates: a gate-by-gate Pass/Fail table and the closest level they narrowly missed, with the exact points gap

---

## Role Families & Levels

| Code | Role Family | Levels | Score Range |
|------|------------|--------|-------------|
| PAS | Programme Assistant | 1–5 | 35% – 50% |
| PO | Project Officer | 1–5 | 60% – 75% |
| JPA | Junior Programme Associate | 1–5 | 62% – 77% |
| PRA | Programme Associate | 1–5 | 65% – 80% |
| SPA | Senior Programme Associate | 1–5 | 65% – 80% |

Scoring weight categories: **Total Years · Relevant PH Years · Qualification · Certifications · Domain Keywords · Seniority Verbs**

---

## Tech Stack

### Backend
- **FastAPI** — REST API server
- **LangChain + LangGraph** — LLM extraction pipeline with a stateful workflow graph
- **Groq (llama-3.3-70b-versatile)** — Fast, free-tier LLM for structured data extraction
- **PyPDF / Docx2txt** — Resume file parsing
- **Python-dotenv** — Environment variable management

### Frontend
- **React + TypeScript** — Component-based UI
- **Vite** — Build tooling & dev server
- **TailwindCSS + shadcn/ui** — Design system and UI components
- **Lucide React** — Icons

---

## Project Structure

```
resume_ranker_application/
├── backend/
│   ├── main.py                  # FastAPI app and /rank_resumes/ endpoint
│   ├── workflow_processing.py   # LLM extraction, scoring engine, LangGraph workflow
│   ├── requirements.txt
│   └── .env                     # GROQ_API_KEY (not committed)
│
└── frontend/
    ├── src/
    │   ├── pages/Index.tsx       # Main page — upload & trigger analysis
    │   └── components/
    │       ├── RankingResults.tsx # Results cards with full breakdown UI
    │       └── FileUpload.tsx     # Drag & drop file upload component
    ├── .env                       # VITE_API_URL (not committed)
    └── ...
```

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- A free [Groq API key](https://console.groq.com)

### Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create your .env file
echo "GROQ_API_KEY=your_key_here" > .env

# Start the server
fastapi dev main.py
# Server runs at http://localhost:8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create your local .env file
echo "VITE_API_URL=http://localhost:8000" > .env.local

# Start the dev server
npm run dev
# App runs at http://localhost:8080
```

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | Your Groq API key from [console.groq.com](https://console.groq.com) |

### Frontend (`frontend/.env.local`)
| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Base URL of the backend API | Falls back to production URL |

---

## How the Scoring Works

### Step 1 — Hard Gates (Mandatory)
A candidate is only scored for a level if they meet **all three** minimum requirements:
- ✅ Total years of experience ≥ minimum
- ✅ Africa Public Health experience ≥ minimum  
- ✅ Qualification level ≥ minimum

### Step 2 — Weighted Score
Each factor is normalised to `0–1` (capped at a sensible maximum) then multiplied by its weight:

```
Score = (norm_total_yrs × W₁) + (norm_ph_yrs × W₂) + (norm_qual × W₃)
      + (norm_certs × W₄) + (norm_keywords × W₅) + (norm_verbs × W₆)
```

Normalization caps: Total Years → 15y · Relevant Years → 10y · Keywords → 8 hits · Seniority Verbs → 6 hits

### Step 3 — Level Assignment
The candidate is assigned the **highest level** for which their score meets or exceeds the minimum threshold. If no level is reached, the system reports the closest level they fell short of and the exact points gap.

---

## Supported File Formats

Resumes can be uploaded as:
- `.pdf`
- `.docx`
- `.txt`

Multiple resumes can be uploaded and analysed in a single batch. Files are processed concurrently for speed.

---

## Key Domain Keywords Tracked

`LMIS · RI · OBR · LQAS · IDSR · Supportive supervision · Stakeholder engagement · Donor reporting · Workplan · Quality assurance · Budget · Policy · Logistics · Data quality`

## Seniority Verbs Tracked

`led · managed · coordinated · supervised · designed · owned · delivered · facilitated · implemented · oversaw`