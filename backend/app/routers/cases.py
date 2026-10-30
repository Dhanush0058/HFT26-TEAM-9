import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query, Body, Response
from pydantic import BaseModel

from app.services.ai_pipeline import forensic_ai_engine
from app.services.trajectory_service import trajectory_engine

router = APIRouter(prefix="/api/cases", tags=["Cases & Forensics"])

# Load persistent sample cases
DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "sample_cases.json"
CASES_DB: List[Dict[str, Any]] = []

def load_initial_cases():
    global CASES_DB
    if DATA_PATH.exists():
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            CASES_DB = json.load(f)
    else:
        CASES_DB = []

load_initial_cases()

class CreateCaseRequest(BaseModel):
    name: str
    location: str
    date: Optional[str] = "2026-10-30 - 14:00 UTC"
    officer: Optional[str] = "Forensic Investigator"
    department: Optional[str] = "Traffic Accident Investigation Bureau"
    witnessStatement: Optional[str] = None
    hasVideo: Optional[bool] = True
    hasSensor: Optional[bool] = True
    hasAudio: Optional[bool] = True

class AddEvidenceRequest(BaseModel):
    type: str # "VIDEO" | "AUDIO" | "SENSOR" | "WITNESS_TEXT"
    sourceName: str
    content: Optional[str] = None
    fileUrl: Optional[str] = None

@router.get("", response_model=List[Dict[str, Any]])
def list_cases(status: Optional[str] = None):
    """
    List all forensic incident cases.
    """
    if status and status != "ALL":
        return [c for c in CASES_DB if c.get("status") == status]
    return CASES_DB

@router.get("/{case_id}")
def get_case_by_id(case_id: str):
    """
    Get full case details including evidence records, timeline, contradictions, and trajectory.
    """
    for c in CASES_DB:
        if c.get("id").upper() == case_id.upper():
            return c
    raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

@router.post("", status_code=201)
def create_case(payload: CreateCaseRequest):
    """
    Create a new incident case and trigger the Multi-Modal AI pipeline to generate:
    - Executive Forensic Summary
    - Observations vs Inferences
    - Contradiction Analysis
    - 3D Physics Trajectory
    """
    next_index = len(CASES_DB) + 101
    new_id = f"CASE-{next_index}"

    # Build evidence records based on inputs
    records = []
    if payload.hasVideo:
        records.append({
            "id": f"EV-{new_id}-01",
            "caseId": new_id,
            "type": "VIDEO",
            "sourceName": "Intersection CCTV / Dashcam Stream",
            "timestampRecorded": payload.date,
            "extractedObservations": [
                {"timestampSec": 0.0, "observation": "Cruising speed compliant with 50 km/h speed limit.", "confidence": 98, "isGroundTruth": true},
                {"timestampSec": 1.4, "observation": "Intersection signal displayed illuminated green state.", "confidence": 99, "isGroundTruth": true},
                {"timestampSec": 2.8, "observation": "Cross-traffic vehicle entered intersection quadrant.", "confidence": 96, "isGroundTruth": true}
            ]
        })
    if payload.hasAudio or payload.witnessStatement:
        text_content = payload.witnessStatement or "I saw the red car speeding through without stopping. The light looked yellow or red to me."
        records.append({
            "id": f"EV-{new_id}-02",
            "caseId": new_id,
            "type": "AUDIO",
            "sourceName": "Eyewitness Voice Note Transcript",
            "timestampRecorded": payload.date,
            "transcriptOrExtractedText": text_content,
            "extractedObservations": [
                {"timestampSec": 1.5, "observation": "Witness claims target vehicle failed to respect signal phase.", "confidence": 64, "isGroundTruth": false}
            ]
        })
    if payload.hasSensor:
        records.append({
            "id": f"EV-{new_id}-03",
            "caseId": new_id,
            "type": "SENSOR",
            "sourceName": "CAN Bus & OBD-II Telemetry Log",
            "timestampRecorded": payload.date,
            "extractedObservations": [
                {"timestampSec": 0.5, "observation": "Cruise throttle 26%, velocity 47.8 km/h.", "confidence": 99, "isGroundTruth": true},
                {"timestampSec": 2.1, "observation": "Brake pressure rapid rise to 82 bar (emergency deceleration).", "confidence": 99, "isGroundTruth": true}
            ]
        })

    # AI Pipeline Synthesis
    summary_data = forensic_ai_engine.generate_case_summary(
        case_title=payload.name,
        location=payload.location,
        date=payload.date,
        evidence_list=records
    )

    contradictions = forensic_ai_engine.analyze_contradictions(records)
    trajectory_data = trajectory_engine.generate_default_intersection_trajectory()

    status = "Flagged Contradiction" if contradictions else "Verified Consistent"

    new_case = {
        "id": new_id,
        "name": payload.name,
        "title": payload.name,
        "date": payload.date,
        "address": payload.location,
        "location": payload.location,
        "officer": payload.officer,
        "department": payload.department,
        "status": status,
        "confidence": summary_data.get("confidence", 90),
        "overallConfidence": summary_data.get("confidence", 90),
        "summary": summary_data,
        "evidenceCounts": {
            "video": 1 if payload.hasVideo else 0,
            "audio": 1 if (payload.hasAudio or payload.witnessStatement) else 0,
            "sensor": 1 if payload.hasSensor else 0,
            "text": 1 if payload.witnessStatement else 0
        },
        "records": records,
        "contradictions": contradictions,
        "timelineEvents": [
            {
                "id": "TL-001",
                "timeSec": 0.0,
                "isoTime": "14:00:00.0",
                "title": "Initial Trajectory Approach",
                "description": "Vehicle approaching intersection at regular cruising velocity.",
                "category": "MOVEMENT",
                "classification": "RAW_OBSERVATION",
                "confidenceScore": 98,
                "evidenceReferences": [r["id"] for r in records[:2]],
                "hasContradiction": False
            },
            {
                "id": "TL-002",
                "timeSec": 1.4,
                "isoTime": "14:00:01.4",
                "title": "Signal Phase Evaluation",
                "description": "Green traffic signal observed in dashcam stream.",
                "category": "SIGNAL_CHANGE",
                "classification": "RAW_OBSERVATION",
                "confidenceScore": 99,
                "evidenceReferences": [records[0]["id"]] if records else [],
                "hasContradiction": len(contradictions) > 0,
                "contradictionId": contradictions[0]["id"] if contradictions else None
            },
            {
                "id": "TL-003",
                "timeSec": 2.1,
                "isoTime": "14:00:02.1",
                "title": "Evasive Deceleration",
                "description": "Braking threshold exceeded; emergency ABS engaged.",
                "category": "BRAKE_ACTION",
                "classification": "RAW_OBSERVATION",
                "confidenceScore": 99,
                "evidenceReferences": [records[-1]["id"]] if records else [],
                "hasContradiction": False
            },
            {
                "id": "TL-004",
                "timeSec": 2.8,
                "isoTime": "14:00:02.8",
                "title": "Collision Impact",
                "description": "Frontal-lateral vehicular impact in northwest intersection quadrant.",
                "category": "IMPACT",
                "classification": "RAW_OBSERVATION",
                "confidenceScore": 99,
                "evidenceReferences": [r["id"] for r in records],
                "hasContradiction": False
            }
        ],
        "trajectory": trajectory_data
    }

    CASES_DB.insert(0, new_case)
    return new_case

@router.get("/{case_id}/report")
def get_case_report(case_id: str, format: Optional[str] = "json"):
    """
    Generate and return the full Markdown forensic report for Docs or print view.
    """
    target_case = None
    for c in CASES_DB:
        if c.get("id").upper() == case_id.upper():
            target_case = c
            break

    if not target_case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    report_markdown = forensic_ai_engine.generate_forensic_report(target_case)

    if format == "raw":
        return Response(content=report_markdown, media_type="text/markdown")

    return {
        "caseId": target_case["id"],
        "caseTitle": target_case.get("name", target_case.get("title")),
        "officer": target_case.get("officer"),
        "confidence": target_case.get("confidence", 90),
        "reportMarkdown": report_markdown
    }

@router.post("/{case_id}/generate-summary")
def regenerate_case_summary(case_id: str):
    """
    Explicitly trigger the AI engine to regenerate the forensic summary for a case.
    """
    target_case = None
    for c in CASES_DB:
        if c.get("id").upper() == case_id.upper():
            target_case = c
            break

    if not target_case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    summary_data = forensic_ai_engine.generate_case_summary(
        case_title=target_case.get("name", target_case.get("title")),
        location=target_case.get("location", target_case.get("address")),
        date=target_case.get("date"),
        evidence_list=target_case.get("records", [])
    )

    target_case["summary"] = summary_data
    target_case["confidence"] = summary_data.get("confidence", target_case.get("confidence", 90))

    return {
        "caseId": case_id,
        "summary": summary_data,
        "providerUsed": summary_data.get("providerUsed")
    }

@router.post("/{case_id}/evidence")
def add_case_evidence(case_id: str, payload: AddEvidenceRequest):
    """
    Dynamic Evidence Injection ('Add Evidence'):
    - Ingests new evidence record
    - Re-evaluates contradiction matrix and AI summary in real time!
    """
    target_case = None
    for c in CASES_DB:
        if c.get("id").upper() == case_id.upper():
            target_case = c
            break

    if not target_case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    ev_count = len(target_case.get("records", [])) + 1
    new_ev = {
        "id": f"EV-{target_case['id']}-0{ev_count}",
        "caseId": target_case["id"],
        "type": payload.type,
        "sourceName": payload.sourceName,
        "timestampRecorded": target_case.get("date"),
        "transcriptOrExtractedText": payload.content,
        "fileUrl": payload.fileUrl or "/sample_evidence/generic_record.dat",
        "extractedObservations": [
            {
                "timestampSec": 1.8,
                "observation": payload.content or "Supplemental evidence injected into case record.",
                "confidence": 88,
                "isGroundTruth": payload.type in ["VIDEO", "SENSOR"]
            }
        ]
    }

    target_case.setdefault("records", []).append(new_ev)

    # Recalculate evidence counts
    t_key = payload.type.lower()
    if t_key in ["video", "audio", "sensor"]:
        target_case["evidenceCounts"][t_key] = target_case["evidenceCounts"].get(t_key, 0) + 1
    else:
        target_case["evidenceCounts"]["text"] = target_case["evidenceCounts"].get("text", 0) + 1

    # Re-run AI analysis
    summary_data = forensic_ai_engine.generate_case_summary(
        case_title=target_case.get("name", target_case.get("title")),
        location=target_case.get("location", target_case.get("address")),
        date=target_case.get("date"),
        evidence_list=target_case.get("records", [])
    )
    contradictions = forensic_ai_engine.analyze_contradictions(target_case.get("records", []))

    target_case["summary"] = summary_data
    target_case["contradictions"] = contradictions
    target_case["status"] = "Flagged Contradiction" if contradictions else "Verified Consistent"

    return {
        "success": True,
        "caseId": target_case["id"],
        "newEvidence": new_ev,
        "updatedSummary": summary_data,
        "contradictions": contradictions,
        "status": target_case["status"]
    }

@router.get("/{case_id}/trajectory")
def get_case_trajectory(case_id: str):
    """
    Returns the 3D trajectory data frames for Three.js WebGL visualization.
    """
    for c in CASES_DB:
        if c.get("id").upper() == case_id.upper():
            traj = c.get("trajectory")
            if not traj:
                traj = trajectory_engine.generate_default_intersection_trajectory()
                c["trajectory"] = traj
            return {
                "caseId": case_id,
                "frameCount": len(traj),
                "frames": traj
            }
    raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

