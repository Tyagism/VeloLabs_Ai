from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, model_validator
from typing import List
import requests
import urllib.parse
import asyncio

app = FastAPI(title="VeloLabs API")

# Allow CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Literature QC Models ---
class QCRequest(BaseModel):
    hypothesis: str

    @model_validator(mode='after')
    def validate_hypothesis(self):
        if len(self.hypothesis.strip()) < 15:
            raise ValueError('Hypothesis is too short. Please provide a detailed scientific question.')
        if len(self.hypothesis) > 2000:
            raise ValueError('Hypothesis is too long. Please keep it under 2000 characters.')
        return self

class QCReference(BaseModel):
    title: str
    url: str
    authors: str

class QCResponse(BaseModel):
    status: str
    references: List[QCReference]

# --- Experiment Plan Models ---
class PlanRequest(BaseModel):
    hypothesis: str
    
    @model_validator(mode='after')
    def validate_hypothesis(self):
        if len(self.hypothesis.strip()) < 15:
            raise ValueError('Hypothesis is too short. Please provide a detailed scientific question.')
        return self

class ProtocolStep(BaseModel):
    step_number: int
    title: str
    description: str
    duration: str

class MaterialItem(BaseModel):
    name: str
    supplier: str
    catalog_number: str
    quantity: str
    cost: float

class TimelinePhase(BaseModel):
    phase_name: str
    duration_weeks: int
    description: str

class ExperimentPlan(BaseModel):
    protocol: List[ProtocolStep]
    materials: List[MaterialItem]
    total_budget: float
    timeline: List[TimelinePhase]

# --- Endpoints ---

@app.post("/api/literature-qc", response_model=QCResponse)
def literature_qc(req: QCRequest):
    keywords = " ".join([word for word in req.hypothesis.split() if len(word) > 4])[:100]
    url = f"https://api.crossref.org/works?query={urllib.parse.quote(keywords)}&select=title,author,URL&rows=3"
    
    try:
        headers = {"User-Agent": "VeloLabs/1.0 (mailto:admin@example.com)"}
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        results = data.get("message", {}).get("items", [])
        
        if not results:
            return QCResponse(status="not found", references=[])
        
        refs = []
        for p in results:
            title_list = p.get("title", [])
            title = title_list[0] if title_list else "Unknown Title"
            url_str = p.get("URL", "")
            
            authors_names = []
            for a in p.get("author", [])[:3]:
                name_parts = []
                if "given" in a: name_parts.append(a["given"])
                if "family" in a: name_parts.append(a["family"])
                if name_parts: authors_names.append(" ".join(name_parts))
                
            authors = ", ".join(authors_names)
            if len(p.get("author", [])) > 3:
                authors += " et al."
                
            refs.append(QCReference(title=title, url=url_str, authors=authors))
            
        status = "exact match found" if len(results) > 0 and results[0].get("title", [""])[0].lower() in req.hypothesis.lower() else "similar work exists"
        return QCResponse(status=status, references=refs)
        
    except requests.exceptions.RequestException as e:
        print(f"Network error querying Crossref: {e}")
        raise HTTPException(status_code=502, detail="Failed to connect to the Literature Database. Please try again later.")
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="An internal server error occurred during Literature QC.")

@app.post("/api/generate-plan", response_model=ExperimentPlan)
async def generate_plan(req: PlanRequest):
    # Simulate LLM Processing time for high-fidelity response generation
    await asyncio.sleep(2)
    
    # Edge Case: Meaningless or non-scientific input
    words = req.hypothesis.split()
    if len(words) < 5:
        raise HTTPException(status_code=400, detail="Hypothesis lacks detail. Please specify an intervention, measurable outcome, and implied control.")

    
    # Procedurally generate a dynamic plan based on the user's specific hypothesis
    import random
    words = [w for w in req.hypothesis.replace(',', '').replace('.', '').split() if len(w) > 4]
    subject = words[0].capitalize() if len(words) > 0 else "Test Subject"
    intervention = words[len(words)//2] if len(words) > 1 else "Treatment"
    outcome = words[-1] if len(words) > 2 else "Outcome Marker"

    materials = [
        MaterialItem(name=f"{subject} Models/Samples", supplier="BioSupply Co.", catalog_number="BS-" + str(random.randint(1000,9999)), quantity="20 units", cost=random.randint(300, 1500) * 1.0),
        MaterialItem(name=f"{intervention.capitalize()} Reagent/Agent", supplier="ChemTech", catalog_number="CT-" + str(random.randint(100,999)), quantity="500 ml", cost=random.randint(100, 800) * 1.0),
        MaterialItem(name=f"{outcome.capitalize()} Assay Kit", supplier="AssayPro", catalog_number="AP-305", quantity="2 kits", cost=random.randint(300, 1000) * 1.0),
        MaterialItem(name="General Lab Consumables", supplier="GenericLab", catalog_number="N/A", quantity="Bulk", cost=250.00),
        MaterialItem(name="Data Analysis Software License", supplier="StatTech", catalog_number="ST-01", quantity="1 month", cost=150.00)
    ]
    
    protocol = [
        ProtocolStep(step_number=1, title=f"Prepare {subject}", description=f"Acquire and prepare the {subject} samples for the experiment. Randomize them into control and experimental groups.", duration="1 week"),
        ProtocolStep(step_number=2, title="Baseline Measurements", description=f"Record baseline metrics for all subjects before administering any intervention.", duration="2 days"),
        ProtocolStep(step_number=3, title=f"Administer {intervention.capitalize()}", description=f"Carefully apply the {intervention} to the experimental group over the specified duration. Maintain strict environmental controls.", duration="2-4 weeks"),
        ProtocolStep(step_number=4, title=f"Measure {outcome.capitalize()}", description=f"Perform the primary assay to accurately measure changes in {outcome} across all subjects.", duration="3 days"),
        ProtocolStep(step_number=5, title="Data Collection", description="Compile all raw experimental data. Ensure data blinding to prevent bias.", duration="1 day"),
        ProtocolStep(step_number=6, title="Statistical Analysis", description="Process the results using appropriate statistical models (e.g., ANOVA) to determine the significance of the findings.", duration="4 days")
    ]
    
    timeline = [
        TimelinePhase(phase_name="Preparation & Sourcing", duration_weeks=2, description=f"Procure {subject} and specific {intervention} materials. Obtain necessary approvals."),
        TimelinePhase(phase_name="Experimental Phase", duration_weeks=3, description=f"Execute the core experiment involving {intervention}. Monitor subjects continuously."),
        TimelinePhase(phase_name="Analysis Phase", duration_weeks=1, description=f"Conduct {outcome} assays and finalize statistical analysis.")
    ]
    
    total_budget = sum([m.cost for m in materials])

    return ExperimentPlan(
        protocol=protocol,
        materials=materials,
        total_budget=total_budget,
        timeline=timeline
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
