# Auditchain Compliance Platform

Auditchain is an AI-driven compliance management platform designed to automate control extraction, monitor event logs, and manage remediation workflows.

## 🚀 Quick Start

### 1. Backend Setup (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```
*The backend will run on `http://localhost:8000`*

### 2. Frontend Setup (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
*The frontend will run on `http://localhost:5173`*

---

## 🔑 Test Credentials

Use these credentials to explore the platform's role-based access control (RBAC).

| Role | Email | Password |
| :--- | :--- | :--- |


---

## 🛠 Tech Stack
- **Frontend**: React 19, Vite 6, Tailwind CSS, Lucide Icons
- **Backend**: FastAPI, Gemini AI (Google Generative AI), pdfplumber
- **Database**: Supabase (PostgreSQL) with Row-Level Security (RLS)
- **Deployment**: Vercel (Frontend), Render (Backend)

## 📁 Project Structure
- `/frontend`: React application with dashboard, event logs, and AI policy extraction wizard.
- `/backend`: FastAPI server handling AI processing and document parsing.
- `/docs`: Implementation plans and technical walkthroughs.
- `sample_soc2_policy.pdf`: A sample document provided for testing the AI extraction pipeline.

## 🤖 AI Pipeline
1. **Upload**: Upload a PDF/DOCX policy.
2. **Segmentation**: Gemini identifies requirement clauses.
3. **Extraction**: Gemini converts clauses into structured SOC 2 / ISO 27001 controls.
4. **Activation**: Controls are saved to the database to begin automated monitoring.

---
© 2026 Auditchain Technologies. All rights reserved.
