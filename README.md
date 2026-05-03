# 🧬 VeloLabs | Intelligent Experiment Planning Engine

[![Streamlit App](https://static.streamlit.io/badge_streamlit.svg)](https://share.streamlit.io/)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?logo=react)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com/)


[![Streamlit App](https://static.streamlit.io/badge-Streamlit-FF4B4B?style=for-the-badge&logo=Streamlit&logoColor=white)](https://veloabs-ai.streamlit.app)

Streamlit Active Link =>  https://velolabsai-hvrpiesckbbc2lcwqq2xmu.streamlit.app

## 🧪 Short Description
**VeloLabs** is a high-fidelity AI orchestration engine that transforms scientific hypotheses into operationally realistic, peer-referenced experiment protocols. It automates literature verification, supply chain sourcing, and research analytics in one premium, neumorphic interface.

---

## 🔬 Detailed Description

VeloLabs solves the "Zero-to-One" problem in scientific research. Traditionally, moving from a hypothesis to a bench-ready protocol takes weeks of literature review, material sourcing, and budget planning. VeloLabs collapses this timeframe into seconds using a dual-stage AI pipeline:

1.  **Scholarly Verification (Literature QC)**: Every hypothesis is cross-referenced in real-time against 100M+ scholarly records via the **Crossref API**. The system flags exact matches to prevent redundancy and identifies "Similar Work" to provide researchers with a foundational starting point.
2.  **Hypothesis Engineering**: Using procedural generation, VeloLabs constructs a comprehensive 6-step protocol tailored to the specific subjects, interventions, and outcomes of the user's input. 
3.  **Operationally Realistic Planning**: Unlike generic AI, VeloLabs generates a detailed supply chain manifest, including specific suppliers, catalog numbers, and multi-currency cost estimations, alongside a projected research timeline.

The platform is designed with a **Premium UI/UX Language** that combines Google's Material 3 guidelines with modern neumorphism and glassmorphism, making the complex data of scientific planning accessible and visually stunning.

---

## 🚀 Key Features

*   **Intelligent Protocol Synthesis**: Dynamic generation of step-by-step experiment instructions.
*   **Real-time Literature QC**: Integrated scholarly search to ensure project novelty.
*   **Research Insights Dashboard**: Advanced data visualizations for tracking research velocity, failure rates, and budget allocation.
*   **Supply Chain Automation**: Automated materials lists with real-world supplier modeling.
*   **Hybrid Deployment Architecture**: A unique bridge allowing high-end React UIs to be hosted directly within Streamlit Cloud.
*   **Theme Orchestration**: Seamless support for "Space Dark" and "Lab Light" modes.

---

## 🛠️ Tech Stack

*   **Frontend**: React 19, Vite, Recharts (Visualizations), Lucide-React (Iconography).
*   **Backend**: Python, FastAPI, Streamlit (Hybrid Wrapper).
*   **API Integration**: Crossref scholarly database.
*   **Design**: Custom CSS (Material 3 + Neumorphism + Glassmorphism).

---

## 📦 Installation & Setup

### Standalone (React + FastAPI)
1. **Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   python main.py
   ```
2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Streamlit Deployment
1. Build the frontend: `cd frontend && npm run build`
2. Run the wrapper: `streamlit run streamlit_app.py`

---

## 🏛️ Architecture

VeloLabs uses a **Hybrid Bridge** architecture:
- The **React Frontend** handles the complex animations, state management, and data visualization.
- The **Python Backend** handles the heavy lifting of API orchestration and procedural logic.
- A **Streamlit Component Wrapper** allows the entire system to be deployed as a single unit on Streamlit Cloud.

---

Created with ❤️ by the VeloLabs Team.
