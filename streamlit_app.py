import streamlit as st
import streamlit.components.v1 as components
import os
import requests
import urllib.parse
import random
import time

# --- Backend Logic (VeloLabs Engine) ---

def literature_qc(hypothesis):
    keywords = " ".join([word for word in hypothesis.split() if len(word) > 4])[:100]
    # Query Crossref API
    url = f"https://api.crossref.org/works?query={urllib.parse.quote(keywords)}&select=title,author,URL&rows=3"
    
    try:
        headers = {"User-Agent": "VeloLabs/1.0 (mailto:admin@example.com)"}
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        results = data.get("message", {}).get("items", [])
        
        if not results:
            return {"status": "not found", "references": []}
        
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
                
            refs.append({"title": title, "url": url_str, "authors": authors})
            
        status = "exact match found" if len(results) > 0 and results[0].get("title", [""])[0].lower() in hypothesis.lower() else "similar work exists"
        return {"status": status, "references": refs}
    except Exception as e:
        return {"error": str(e)}

def generate_plan(hypothesis):
    time.sleep(1.5) # Simulate AI processing time
    
    # Procedural generation logic
    words = [w for w in hypothesis.replace(',', '').replace('.', '').split() if len(w) > 4]
    subject = words[0].capitalize() if len(words) > 0 else "Test Subject"
    intervention = words[len(words)//2] if len(words) > 1 else "Treatment"
    outcome = words[-1] if len(words) > 2 else "Outcome Marker"

    materials = [
        {"name": f"{subject} Models/Samples", "supplier": "BioSupply Co.", "catalog_number": f"BS-{random.randint(1000,9999)}", "quantity": "20 units", "cost": random.randint(300, 1500) * 1.0},
        {"name": f"{intervention.capitalize()} Reagent/Agent", "supplier": "ChemTech", "catalog_number": f"CT-{random.randint(100,999)}", "quantity": "500 ml", "cost": random.randint(100, 800) * 1.0},
        {"name": f"{outcome.capitalize()} Assay Kit", "supplier": "AssayPro", "catalog_number": "AP-305", "quantity": "2 kits", "cost": random.randint(300, 1000) * 1.0},
        {"name": "General Lab Consumables", "supplier": "GenericLab", "catalog_number": "N/A", "quantity": "Bulk", "cost": 250.0},
        {"name": "Data Analysis Software License", "supplier": "StatTech", "catalog_number": "ST-01", "quantity": "1 month", "cost": 150.0}
    ]
    
    protocol = [
        {"step_number": 1, "title": f"Prepare {subject}", "description": f"Acquire and prepare the {subject} samples for the experiment. Randomize them into control and experimental groups.", "duration": "1 week"},
        {"step_number": 2, "title": "Baseline Measurements", "description": "Record baseline metrics for all subjects before administering any intervention.", "duration": "2 days"},
        {"step_number": 3, "title": f"Administer {intervention.capitalize()}", "description": f"Carefully apply the {intervention} to the experimental group over the specified duration.", "duration": "2-4 weeks"},
        {"step_number": 4, "title": f"Measure {outcome.capitalize()}", "description": f"Perform the primary assay to accurately measure changes in {outcome} across all subjects.", "duration": "3 days"},
        {"step_number": 5, "title": "Data Collection", "description": "Compile all raw experimental data. Ensure data blinding to prevent bias.", "duration": "1 day"},
        {"step_number": 6, "title": "Statistical Analysis", "description": "Process the results using appropriate statistical models to determine significance.", "duration": "4 days"}
    ]
    
    timeline = [
        {"phase_name": "Preparation & Sourcing", "duration_weeks": 2, "description": f"Procure {subject} and specific {intervention} materials. Obtain necessary approvals."},
        {"phase_name": "Experimental Phase", "duration_weeks": 3, "description": f"Execute the core experiment involving {intervention}. Monitor subjects continuously."},
        {"phase_name": "Analysis Phase", "duration_weeks": 1, "description": f"Conduct {outcome} assays and finalize statistical analysis."}
    ]
    
    total_budget = sum([m["cost"] for m in materials])
    
    return {
        "protocol": protocol,
        "materials": materials,
        "total_budget": total_budget,
        "timeline": timeline
    }

# --- Streamlit Application ---

st.set_page_config(
    page_title="VeloLabs | Intelligent Experiment Planning",
    page_icon="🧬",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Premium UI Styling
st.markdown("""
    <style>
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    .block-container {padding: 0;}
    iframe {border: none; width: 100vw; height: 100vh;}
    </style>
""", unsafe_allow_html=True)

# Path to the React build
PARENT_DIR = os.path.dirname(os.path.abspath(__file__))
BUILD_DIR = os.path.join(PARENT_DIR, "frontend/dist")

if not os.path.exists(BUILD_DIR):
    st.error("Error: Frontend build directory not found. Please run 'npm run build' first.")
else:
    # Declare the component
    velo_labs_component = components.declare_component("velo_labs", path=BUILD_DIR)

    # Initialize session state for API responses
    if "api_response" not in st.session_state:
        st.session_state.api_response = None

    # Render the component and capture events
    # We pass st.session_state.api_response as 'args' to the component
    result = velo_labs_component(key="velo_main", args=st.session_state.api_response)

    # Handle component events (actions)
    if result:
        action = result.get("action")
        hypothesis = result.get("hypothesis")
        
        if action == "qc":
            with st.spinner("Analyzing Literature..."):
                data = literature_qc(hypothesis)
                st.session_state.api_response = {"type": "qc_result", "data": data}
            st.rerun()
            
        elif action == "generate_plan":
            with st.spinner("Engineering Protocol..."):
                data = generate_plan(hypothesis)
                st.session_state.api_response = {"type": "plan_result", "data": data}
            st.rerun()
