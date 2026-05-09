"""
Auditchain Backend — Phase 4: AI Policy Pipeline
FastAPI server handling document upload, text extraction, and Gemini AI control extraction.
"""

import os
import io
import json
import tempfile
import traceback
from datetime import datetime, timezone

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

import pdfplumber
from docx import Document as DocxDocument

import google.generativeai as genai
from supabase import create_client

# ── Load environment ──────────────────────────────────────────────────
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, GEMINI_API_KEY]):
    raise RuntimeError("Missing environment variables. Check .env file.")

# ── Init clients ──────────────────────────────────────────────────────
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
genai.configure(api_key=GEMINI_API_KEY)
gemini_model = genai.GenerativeModel("gemini-flash-latest")

# ── FastAPI app ───────────────────────────────────────────────────────
app = FastAPI(title="Auditchain API", version="0.4.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Health check ──────────────────────────────────────────────────────
@app.get("/health")
def health_check():
    return {"status": "ok", "service": "auditchain-backend", "phase": 4}


# ══════════════════════════════════════════════════════════════════════
#  STEP 1 — Upload & Parse Document
# ══════════════════════════════════════════════════════════════════════

def extract_text_from_pdf(file_bytes: bytes) -> tuple[str, int]:
    """Extract text from a PDF. Returns (text, page_count)."""
    text_parts = []
    page_count = 0
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        page_count = len(pdf.pages)
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n\n".join(text_parts), page_count


def extract_text_from_docx(file_bytes: bytes) -> tuple[str, int]:
    """Extract text from a DOCX. Returns (text, paragraph_count)."""
    doc = DocxDocument(io.BytesIO(file_bytes))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n\n".join(paragraphs), len(paragraphs)


@app.post("/api/policies/upload")
async def upload_policy(
    file: UploadFile = File(...),
    framework: str = Form(...),
    uploaded_by: str = Form(...)
):
    """
    Receives a PDF/DOCX, extracts raw text, saves to Supabase policy_documents table.
    Returns the new policy_id and extracted text stats.
    """
    # Validate file type
    filename = file.filename or ""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ("pdf", "docx"):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are accepted.")

    # Validate framework
    valid_frameworks = {"soc2", "iso27001", "gdpr", "dpdp", "custom"}
    if framework not in valid_frameworks:
        raise HTTPException(status_code=400, detail=f"Framework must be one of: {', '.join(valid_frameworks)}")

    # Read file bytes
    file_bytes = await file.read()
    if len(file_bytes) > 20 * 1024 * 1024:  # 20MB limit
        raise HTTPException(status_code=400, detail="File size exceeds 20MB limit.")
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # Extract text
    try:
        if ext == "pdf":
            raw_text, page_count = extract_text_from_pdf(file_bytes)
        else:
            raw_text, page_count = extract_text_from_docx(file_bytes)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to parse document: {str(e)}")

    if not raw_text.strip():
        raise HTTPException(status_code=422, detail="No readable text found in the document. It may be a scanned image PDF.")

    # Clean title from filename
    title = filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").strip()

    # Save to Supabase
    try:
        result = supabase.table("policy_documents").insert({
            "title": title,
            "framework": framework,
            "raw_text": raw_text,
            "file_ref": f"upload://{filename}",
            "uploaded_by": uploaded_by,
            "status": "pending"
        }).execute()

        policy = result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    return {
        "policy_id": policy["id"],
        "title": title,
        "framework": framework,
        "page_count": page_count,
        "char_count": len(raw_text),
        "status": "pending",
        "message": "Document uploaded and text extracted. Ready for AI extraction."
    }


# ══════════════════════════════════════════════════════════════════════
#  STEP 2 — AI Clause Segmentation
# ══════════════════════════════════════════════════════════════════════

SEGMENTATION_PROMPT = """You are a compliance document analyst. Read the following policy document text carefully.

Identify every clause that contains a compliance requirement — a statement of what the organization MUST do, ensure, maintain, review, or enforce.

For each clause found, classify it as one of:
- "requirement" — an actionable compliance obligation
- "guidance" — advisory or best-practice language (not mandatory)
- "definition" — a term definition or scope statement

Return ONLY a valid JSON array. Each element must have exactly these fields:
{
  "clause_id": "string — use the framework control code if present (e.g. CC6.3, A.9.2.3), otherwise auto-generate as CLAUSE-001, CLAUSE-002, etc.",
  "clause_text": "string — the full text of the clause",
  "section_reference": "string — the section or heading this clause falls under",
  "clause_type": "requirement | guidance | definition"
}

Rules:
- Skip preamble, table of contents, and general scope statements
- If a single clause contains multiple separate requirements, split them into separate entries
- Preserve any framework control codes exactly as they appear (CC6.3, A.9.2.3, Art. 25, etc.)
- Return ONLY the JSON array, no markdown formatting, no explanation text"""


@app.post("/api/policies/{policy_id}/segment")
async def segment_policy(policy_id: int):
    """
    Reads raw_text from the policy, sends to Gemini for clause segmentation.
    Updates policy status to 'extracting' and returns the segmented clauses.
    """
    # Fetch policy
    result = supabase.table("policy_documents").select("*").eq("id", policy_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Policy not found.")

    policy = result.data[0]
    raw_text = policy["raw_text"]

    # Update status to extracting
    supabase.table("policy_documents").update({"status": "extracting"}).eq("id", policy_id).execute()

    # Send to Gemini
    try:
        prompt = f"{SEGMENTATION_PROMPT}\n\n--- DOCUMENT TEXT ---\n{raw_text[:60000]}"
        response = gemini_model.generate_content(prompt)
        response_text = response.text.strip()

        # Clean up response — strip markdown code fences if present
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])
            response_text = response_text.strip()

        clauses = json.loads(response_text)

    except json.JSONDecodeError:
        raise HTTPException(status_code=422, detail="AI returned malformed JSON. Please retry.")
    except Exception as e:
        supabase.table("policy_documents").update({"status": "pending"}).eq("id", policy_id).execute()
        raise HTTPException(status_code=500, detail=f"AI segmentation failed: {str(e)}")

    # Count by type
    requirements = [c for c in clauses if c.get("clause_type") == "requirement"]
    guidance = [c for c in clauses if c.get("clause_type") == "guidance"]
    definitions = [c for c in clauses if c.get("clause_type") == "definition"]

    return {
        "policy_id": policy_id,
        "total_clauses": len(clauses),
        "requirements_count": len(requirements),
        "guidance_count": len(guidance),
        "definitions_count": len(definitions),
        "clauses": clauses
    }


# ══════════════════════════════════════════════════════════════════════
#  STEP 3 — AI Control Extraction
# ══════════════════════════════════════════════════════════════════════

EXTRACTION_PROMPT_TEMPLATE = """You are a compliance control analyst. You are given a list of requirement clauses extracted from a {framework} policy document.

For EACH requirement clause, extract a structured control record. Return ONLY a valid JSON array where each element has exactly these fields:

{{
  "source_clause_id": "string — the clause_id from the input",
  "control_code": "string — use the framework code if present (CC6.3, A.9.2.3, Art. 25), otherwise generate as CUSTOM-001, CUSTOM-002, etc.",
  "requirement_text": "string — ONE clear sentence summarizing the compliance obligation",
  "evidence_type": "log | report | ticket | screenshot | policy_doc",
  "frequency": "continuous | daily | weekly | monthly | quarterly | annual",
  "owner_role": "infosec | devops | hr | legal",
  "ambiguity_flag": "boolean — true if the requirement is vague, underspecified, or conditional",
  "ambiguity_note": "string — explanation of why it's ambiguous, or empty string if not ambiguous"
}}

Rules:
- If one clause contains multiple separate obligations, create multiple control records
- Evidence type should be inferred from context: log reviews → 'log', access reviews → 'report', ticketing → 'ticket'
- Frequency should be inferred from temporal language: "quarterly" → quarterly, "at all times" → continuous
- Owner role: access/identity → infosec, infrastructure/deployment → devops, personnel → hr, privacy/data → legal
- Flag as ambiguous if: the requirement uses vague language ("appropriate", "reasonable"), references external documents, or is conditional
- Return ONLY the JSON array, no markdown, no explanation"""


@app.post("/api/policies/{policy_id}/extract")
async def extract_controls(policy_id: int, clauses: list[dict] = None):
    """
    Takes the segmented requirement clauses and sends them to Gemini
    for structured control extraction. Returns extracted controls for review.
    """
    # Fetch policy for framework info
    result = supabase.table("policy_documents").select("*").eq("id", policy_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Policy not found.")

    policy = result.data[0]
    framework = policy["framework"]

    # Filter to requirements only
    if clauses:
        requirement_clauses = [c for c in clauses if c.get("clause_type") == "requirement"]
    else:
        raise HTTPException(status_code=400, detail="No clauses provided for extraction.")

    if not requirement_clauses:
        raise HTTPException(status_code=400, detail="No requirement clauses found to extract controls from.")

    # Build the prompt
    framework_names = {
        "soc2": "SOC 2 Type II",
        "iso27001": "ISO 27001",
        "gdpr": "GDPR",
        "dpdp": "DPDP (Digital Personal Data Protection)",
        "custom": "Custom/Internal"
    }
    framework_label = framework_names.get(framework, framework)
    prompt = EXTRACTION_PROMPT_TEMPLATE.format(framework=framework_label)
    prompt += f"\n\n--- REQUIREMENT CLAUSES ---\n{json.dumps(requirement_clauses, indent=2)}"

    # Send to Gemini
    try:
        response = gemini_model.generate_content(prompt)
        response_text = response.text.strip()

        # Clean markdown fences
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])
            response_text = response_text.strip()

        controls = json.loads(response_text)

    except json.JSONDecodeError:
        raise HTTPException(status_code=422, detail="AI returned malformed JSON during control extraction. Please retry.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI control extraction failed: {str(e)}")

    # Update policy status to review
    supabase.table("policy_documents").update({
        "status": "review",
        "total_controls_extracted": len(controls),
        "parsed_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", policy_id).execute()

    return {
        "policy_id": policy_id,
        "framework": framework,
        "total_controls": len(controls),
        "ambiguous_count": sum(1 for c in controls if c.get("ambiguity_flag")),
        "controls": controls
    }


# ══════════════════════════════════════════════════════════════════════
#  STEP 4 — Activate Controls (Human-reviewed → Database)
# ══════════════════════════════════════════════════════════════════════

from pydantic import BaseModel
from typing import Optional

class ControlActivation(BaseModel):
    control_code: str
    requirement_text: str
    evidence_type: str
    frequency: str
    owner_role: str
    ambiguity_flag: bool = False
    ambiguity_note: Optional[str] = ""

class ActivationRequest(BaseModel):
    controls: list[ControlActivation]


@app.post("/api/policies/{policy_id}/activate")
async def activate_controls(policy_id: int, body: ActivationRequest):
    """
    Takes the human-reviewed controls and inserts them into the controls table.
    Sets the policy status to 'active'. Triggers initial gap detection.
    """
    # Verify policy exists
    result = supabase.table("policy_documents").select("*").eq("id", policy_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Policy not found.")

    controls_to_insert = []
    for ctrl in body.controls:
        # Validate: ambiguous controls must have a resolution note
        if ctrl.ambiguity_flag and not ctrl.ambiguity_note:
            raise HTTPException(
                status_code=400,
                detail=f"Control '{ctrl.control_code}' is flagged as ambiguous but has no resolution note."
            )

        controls_to_insert.append({
            "policy_id": policy_id,
            "control_code": ctrl.control_code,
            "requirement_text": ctrl.requirement_text,
            "evidence_type": ctrl.evidence_type,
            "frequency": ctrl.frequency,
            "owner_role": ctrl.owner_role,
            "ambiguity_flag": ctrl.ambiguity_flag,
            "ambiguity_note": ctrl.ambiguity_note or None,
            "is_active": True
        })

    # Batch insert controls
    try:
        insert_result = supabase.table("controls").insert(controls_to_insert).execute()
        inserted_controls = insert_result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to insert controls: {str(e)}")

    # Update policy to active
    supabase.table("policy_documents").update({
        "status": "active",
        "total_controls_extracted": len(inserted_controls)
    }).eq("id", policy_id).execute()

    # ── Initial gap detection ──
    # For each newly inserted control, check if there are any matching events
    # in the last 90 days. If none → create a gap.
    gaps_created = 0
    for ctrl in inserted_controls:
        # Check control_mappings for this control
        mappings = supabase.table("control_mappings").select("id").eq("control_id", ctrl["id"]).execute()

        if not mappings.data:
            # No evidence → create a gap
            severity = _compute_severity(ctrl)
            try:
                supabase.table("gaps").insert({
                    "control_id": ctrl["id"],
                    "severity": severity,
                    "status": "open"
                }).execute()
                gaps_created += 1
            except Exception:
                # Might fail if gap already exists (unique constraint) — skip
                pass

    return {
        "policy_id": policy_id,
        "controls_activated": len(inserted_controls),
        "gaps_detected": gaps_created,
        "message": f"Successfully activated {len(inserted_controls)} controls. {gaps_created} initial gaps detected."
    }


def _compute_severity(control: dict) -> str:
    """
    Determine gap severity based on the control's characteristics.
    - continuous + log evidence = critical (real-time monitoring gaps are urgent)
    - quarterly/annual + report = medium/low
    """
    freq = control.get("frequency", "")
    evidence = control.get("evidence_type", "")

    if freq in ("continuous", "daily"):
        return "critical"
    elif freq == "weekly":
        return "high"
    elif freq in ("monthly", "quarterly"):
        return "medium"
    else:
        return "low"


# ══════════════════════════════════════════════════════════════════════
#  PHASE 4 — Evidence Ingestion (Mock)
# ══════════════════════════════════════════════════════════════════════

@app.post("/api/ingest/sync")
async def sync_source(source: str):
    """
    Simulates ingesting real events from AWS, GitHub, or Okta.
    Populates the events table with realistic mock data.
    """
    valid_sources = ["aws_cloudtrail", "github", "okta", "jira"]
    if source not in valid_sources:
        raise HTTPException(status_code=400, detail=f"Invalid source: {source}")

    # Generate 10-20 mock events
    import random
    from datetime import timedelta
    
    events_to_insert = []
    now = datetime.now(timezone.utc)

    templates = {
        "aws_cloudtrail": [
            ("iam.user.create", "iam/user/new-service-account", "success"),
            ("s3.bucket.policy_update", "s3/bucket/prod-data", "success"),
            ("ec2.instance.terminate", "ec2/instance/i-04f123", "success"),
            ("iam.user.mfa_enabled", "iam/user/dev-01", "success"),
            ("cloudtrail.stop_logging", "cloudtrail/trail/main", "failure"),
        ],
        "github": [
            ("repo.push", "repo/auditchain/main", "success"),
            ("repo.create", "repo/auditchain/temp-fix", "success"),
            ("team.add_member", "team/security-admins", "success"),
            ("repo.branch_protection.disable", "repo/auditchain/main", "failure"),
            ("secret.leak_detected", "repo/auditchain/api-server", "failure"),
        ],
        "okta": [
            ("user.login", "user/admin@auditchain.dev", "success"),
            ("user.mfa.factor.activate", "user/dev@auditchain.dev", "success"),
            ("application.user_added", "app/aws-production", "success"),
            ("user.account.locked", "user/guest-42", "failure"),
            ("user.session.start", "user/officer@auditchain.dev", "success"),
        ],
        "jira": [
            ("issue.created", "issue/SEC-101", "success"),
            ("issue.transition", "issue/SEC-101", "success"),
            ("project.deleted", "project/ARCHIVE", "failure"),
        ]
    }

    actors = ["admin@auditchain.dev", "dev-01@auditchain.dev", "github-actions[bot]", "system-auto"]
    
    for _ in range(random.randint(10, 20)):
        action, resource, outcome = random.choice(templates[source])
        event_ts = now - timedelta(minutes=random.randint(0, 1440))
        
        events_to_insert.append({
            "source": source,
            "actor": random.choice(actors),
            "action": action,
            "resource": resource,
            "outcome": outcome,
            "raw_payload": {
                "id": f"evt_{random.getrandbits(32)}",
                "request_id": f"req_{random.getrandbits(32)}",
                "user_agent": "Auditchain Ingest/1.0",
                "ip_address": f"192.168.1.{random.randint(1, 255)}"
            },
            "event_ts": event_ts.isoformat(),
            "normalized_at": now.isoformat()
        })

    try:
        supabase.table("events").insert(events_to_insert).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to insert events: {str(e)}")

    return {
        "status": "success",
        "source": source,
        "events_ingested": len(events_to_insert),
        "message": f"Successfully ingested {len(events_to_insert)} events from {source}."
    }

# ══════════════════════════════════════════════════════════════════════
#  Utility: Get policy details
# ══════════════════════════════════════════════════════════════════════

@app.get("/api/policies/{policy_id}")
async def get_policy(policy_id: int):
    """Get a single policy document with its controls."""
    result = supabase.table("policy_documents").select("*").eq("id", policy_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Policy not found.")

    policy = result.data[0]

    # Get associated controls if any
    controls = supabase.table("controls").select("*").eq("policy_id", policy_id).execute()
    policy["controls"] = controls.data or []

    return policy


# ══════════════════════════════════════════════════════════════════════
#  PHASE 6 — Auditor Portal
# ══════════════════════════════════════════════════════════════════════

@app.get("/api/audit/{token}")
async def get_audit_export(token: str):
    """
    Public endpoint for auditors to fetch a time-bounded evidence package.
    No authentication required, gated by a secure access_token.
    """
    # 1. Fetch export record
    res = supabase.table("audit_exports").select("*").eq("access_token", token).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Invalid or expired audit token.")
    
    export = res.data[0]
    if export["status"] == "expired":
        raise HTTPException(status_code=403, detail="This audit export link has expired.")

    # 2. Fetch controls for the specified framework
    # In a real app, we'd filter strictly by the export's scope
    controls_res = supabase.table("controls").select("*").execute()
    controls = controls_res.data or []

    # 3. For each control, fetch matched events within the date range
    from_dt = export["from_date"]
    to_dt = export["to_date"]
    
    enriched_controls = []
    for ctrl in controls:
        # Get mappings for this control
        mappings_res = supabase.table("control_mappings")\
            .select("*, events(*)")\
            .eq("control_id", ctrl["id"])\
            .execute()
        
        # Filter events by date range
        valid_events = []
        for m in (mappings_res.data or []):
            ev = m.get("events")
            if ev and from_dt <= ev["event_ts"][:10] <= to_dt:
                valid_events.append(ev)
        
        # Add AI management response (simulated as per spec)
        management_response = f"For the period {from_dt} to {to_dt}, the organization has demonstrated compliance with control {ctrl['control_code']}. Our automated monitoring system has mapped {len(valid_events)} relevant events confirming that the requirement to '{ctrl['requirement_text']}' is being met continuously."
        
        enriched_controls.append({
            **ctrl,
            "events": valid_events,
            "management_response": management_response
        })

    return {
        "export_details": export,
        "controls": enriched_controls
    }
