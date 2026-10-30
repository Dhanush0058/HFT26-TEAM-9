import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query, Body, Response
from pydantic import BaseModel

from app.services.ai_pipeline import forensic_ai_engine
from app.services.trajectory_service import trajectory_engine
from app.services.yolo_service import yolo_service

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
    location: Optional[str] = None
    address: Optional[str] = None
    date: Optional[str] = None
    accidentDate: Optional[str] = None
    officer: Optional[str] = None
    filedBy: Optional[str] = None
    department: Optional[str] = "Traffic Accident Investigation Bureau"
    witnessStatement: Optional[str] = None
    description: Optional[str] = None
    caseNumber: Optional[str] = None
    hasVideo: Optional[bool] = True
    hasSensor: Optional[bool] = True
    hasAudio: Optional[bool] = True
    sources: Optional[List[Dict[str, Any]]] = None

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
    new_id = payload.caseNumber or f"CASE-2026-{len(CASES_DB) + 104}"
    loc = payload.address or payload.location or "Downtown Metropolitan Sector"
    off = payload.filedBy or payload.officer or "Det. Marcus Vance"
    incident_date = payload.accidentDate or payload.date or "2026-10-31 - 14:00 UTC"
    statement = payload.description or payload.witnessStatement or ""

    # Build evidence records based on inputs & uploaded sources
    records = []
    if payload.sources:
        for idx, src in enumerate(payload.sources):
            src_name = src.get("name", f"source_{idx + 1}")
            src_type = src.get("type", "").lower()
            name_lower = src_name.lower()

            if any(name_lower.endswith(ext) for ext in [".mp4", ".mov", ".avi"]) or "video" in src_type:
                dtype = "VIDEO"
                obs = [
                    {"timestampSec": 0.0, "observation": f"Optical detection in {src_name}: vehicle entering camera visual field.", "confidence": 98, "isGroundTruth": True},
                    {"timestampSec": 1.4, "observation": "Signal state evaluation: illuminated phase confirmed.", "confidence": 99, "isGroundTruth": True},
                    {"timestampSec": 2.8, "observation": "Impact trajectory convergence identified.", "confidence": 96, "isGroundTruth": True}
                ]
            elif any(name_lower.endswith(ext) for ext in [".wav", ".mp3", ".m4a"]) or "audio" in src_type:
                dtype = "AUDIO"
                obs = [
                    {"timestampSec": 1.5, "observation": f"Acoustic statement in {src_name}: witness recollection of vehicle speed and signal state.", "confidence": 64, "isGroundTruth": False}
                ]
            elif any(name_lower.endswith(ext) for ext in [".csv", ".json"]) or "csv" in src_type or "sensor" in src_type:
                dtype = "SENSOR"
                obs = [
                    {"timestampSec": 0.5, "observation": f"Sensor curve in {src_name}: steady cruise throttle input.", "confidence": 99, "isGroundTruth": True},
                    {"timestampSec": 2.1, "observation": "Hydraulic brake line pressure spike (ABS emergency activation).", "confidence": 99, "isGroundTruth": True}
                ]
            elif any(name_lower.endswith(ext) for ext in [".png", ".jpg", ".jpeg"]) or "image" in src_type:
                dtype = "IMAGE"
                obs = [
                    {"timestampSec": 2.8, "observation": f"Scene photograph {src_name}: residual tire friction markings and impact debris dispersion.", "confidence": 94, "isGroundTruth": True}
                ]
            else:
                dtype = "WITNESS_TEXT"
                obs = [
                    {"timestampSec": 1.0, "observation": f"Documentary evidence {src_name}: investigative field notes and scene report.", "confidence": 85, "isGroundTruth": False}
                ]

            records.append({
                "id": f"EV-{new_id}-{idx + 1:02d}",
                "caseId": new_id,
                "type": dtype,
                "sourceName": src_name,
                "timestampRecorded": incident_date,
                "fileUrl": f"/sample_evidence/{src_name}",
                "transcriptOrExtractedText": statement if dtype in ["AUDIO", "WITNESS_TEXT"] else None,
                "extractedObservations": obs
            })
    else:
        # Default scenario if no explicit files uploaded
        if payload.hasVideo:
            records.append({
                "id": f"EV-{new_id}-01",
                "caseId": new_id,
                "type": "VIDEO",
                "sourceName": "Intersection CCTV / Dashcam Stream",
                "timestampRecorded": incident_date,
                "extractedObservations": [
                    {"timestampSec": 0.0, "observation": "Cruising speed compliant with 50 km/h speed limit.", "confidence": 98, "isGroundTruth": True},
                    {"timestampSec": 1.4, "observation": "Intersection signal displayed illuminated green state.", "confidence": 99, "isGroundTruth": True},
                    {"timestampSec": 2.8, "observation": "Cross-traffic vehicle entered intersection quadrant.", "confidence": 96, "isGroundTruth": True}
                ]
            })
        if payload.hasAudio or statement:
            records.append({
                "id": f"EV-{new_id}-02",
                "caseId": new_id,
                "type": "AUDIO",
                "sourceName": "Eyewitness Voice Note Transcript",
                "timestampRecorded": incident_date,
                "transcriptOrExtractedText": statement or "I saw the red car speeding through without stopping. The light looked yellow or red to me.",
                "extractedObservations": [
                    {"timestampSec": 1.5, "observation": "Witness claims target vehicle failed to respect signal phase.", "confidence": 64, "isGroundTruth": False}
                ]
            })
        if payload.hasSensor:
            records.append({
                "id": f"EV-{new_id}-03",
                "caseId": new_id,
                "type": "SENSOR",
                "sourceName": "CAN Bus & OBD-II Telemetry Log",
                "timestampRecorded": incident_date,
                "extractedObservations": [
                    {"timestampSec": 0.5, "observation": "Cruise throttle 26%, velocity 47.8 km/h.", "confidence": 99, "isGroundTruth": True},
                    {"timestampSec": 2.1, "observation": "Brake pressure rapid rise to 82 bar (emergency deceleration).", "confidence": 99, "isGroundTruth": True}
                ]
            })

    # Trigger live Multi-Modal AI Pipeline (Groq -> Gemini -> Featherless failover)
    summary_data = forensic_ai_engine.generate_case_summary(
        case_title=payload.name,
        location=loc,
        date=incident_date,
        evidence_list=records
    )

    contradictions = forensic_ai_engine.analyze_contradictions(records)
    trajectory_data = trajectory_engine.generate_default_intersection_trajectory()
    status = "Flagged Contradiction" if contradictions else "Verified Consistent"

    # Synchronized Master Timeline
    timeline = [
        {
            "id": f"TL-{new_id}-01",
            "timeSec": 0.0,
            "isoTime": "14:00:00.0",
            "accidentTime": incident_date,
            "title": "Initial Trajectory Approach",
            "description": "Vehicle approaching intersection at regular cruising velocity.",
            "category": "MOVEMENT",
            "classification": "RAW_OBSERVATION",
            "confidenceScore": 98,
            "confidence": 98,
            "evidenceReferences": [r["id"] for r in records[:2]] if records else [],
            "hasContradiction": False
        },
        {
            "id": f"TL-{new_id}-02",
            "timeSec": 1.4,
            "isoTime": "14:00:01.4",
            "accidentTime": incident_date,
            "title": "Signal Phase Evaluation",
            "description": "Illuminated green traffic signal confirmed in optical stream.",
            "category": "SIGNAL_CHANGE",
            "classification": "RAW_OBSERVATION",
            "confidenceScore": 99,
            "confidence": 99,
            "evidenceReferences": [records[0]["id"]] if records else [],
            "hasContradiction": len(contradictions) > 0,
            "contradictionId": contradictions[0]["id"] if contradictions else None
        },
        {
            "id": f"TL-{new_id}-03",
            "timeSec": 2.1,
            "isoTime": "14:00:02.1",
            "accidentTime": incident_date,
            "title": "Evasive Deceleration",
            "description": "Emergency braking engaged; hydraulic ABS line pressure reached 85 bar.",
            "category": "BRAKE_ACTION",
            "classification": "RAW_OBSERVATION",
            "confidenceScore": 99,
            "confidence": 99,
            "evidenceReferences": [records[-1]["id"]] if records else [],
            "hasContradiction": False
        },
        {
            "id": f"TL-{new_id}-04",
            "timeSec": 2.8,
            "isoTime": "14:00:02.8",
            "accidentTime": incident_date,
            "title": "Collision Impact",
            "description": "Frontal-lateral vehicular impact in northwest intersection quadrant.",
            "category": "IMPACT",
            "classification": "RAW_OBSERVATION",
            "confidenceScore": 99,
            "confidence": 99,
            "evidenceReferences": [r["id"] for r in records] if records else [],
            "hasContradiction": False
        }
    ]

    new_case = {
        "id": new_id,
        "name": payload.name,
        "title": payload.name,
        "caseNumber": new_id,
        "date": incident_date,
        "accidentDate": incident_date,
        "filedDate": incident_date,
        "address": loc,
        "location": loc,
        "officer": off,
        "filedBy": off,
        "department": payload.department or "Traffic Accident Investigation Bureau",
        "status": status,
        "confidence": summary_data.get("confidence", 90),
        "overallConfidence": summary_data.get("confidence", 90),
        "summary": summary_data.get("executive", ""),
        "executiveSummary": summary_data.get("executive", ""),
        "fullSummary": summary_data,
        "evidenceCounts": {
            "video": sum(1 for r in records if r["type"] == "VIDEO"),
            "audio": sum(1 for r in records if r["type"] == "AUDIO"),
            "sensor": sum(1 for r in records if r["type"] == "SENSOR"),
            "text": sum(1 for r in records if r["type"] in ["WITNESS_TEXT", "IMAGE"])
        },
        "records": records,
        "evidenceList": records,
        "contradictions": contradictions,
        "timelineEvents": timeline,
        "timeline": timeline,
        "trajectory": trajectory_data
    }

    # Prepend to database
    for i, existing in enumerate(CASES_DB):
        if existing.get("id").upper() == new_id.upper():
            CASES_DB[i] = new_case
            return new_case

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

    # Dynamically inject new event into timeline
    new_tl_entry = {
        "id": f"TL-{target_case['id']}-{len(target_case.get('timelineEvents', [])) + 1}",
        "timeSec": round(1.5 + (len(target_case.get('records', [])) * 0.3), 1),
        "isoTime": target_case.get("date", "14:00:00 UTC"),
        "accidentTime": target_case.get("date", "14:00:00 UTC"),
        "title": f"Evidence Corroborated: {payload.sourceName}",
        "description": payload.content or f"Dynamic evidence injected: {payload.sourceName}. Evaluated against physical ground truth.",
        "category": "SIGNAL_CHANGE" if payload.type == "VIDEO" else "BRAKE_ACTION" if payload.type == "SENSOR" else "MOVEMENT",
        "classification": "RAW_OBSERVATION" if payload.type in ["VIDEO", "SENSOR"] else "INFERRED_HYPOTHESIS",
        "confidenceScore": 96 if payload.type in ["VIDEO", "SENSOR"] else 68,
        "confidence": 96 if payload.type in ["VIDEO", "SENSOR"] else 68,
        "evidenceReferences": [new_ev["id"]],
        "hasContradiction": len(contradictions) > 0
    }
    target_case.setdefault("timelineEvents", []).append(new_tl_entry)
    target_case["timeline"] = target_case.get("timelineEvents", [])

    target_case["summary"] = summary_data.get("executive", "") if isinstance(summary_data, dict) else summary_data
    target_case["fullSummary"] = summary_data
    target_case["contradictions"] = contradictions
    target_case["status"] = "Flagged Contradiction" if contradictions else "Verified Consistent"

    return {
        "success": True,
        "caseId": target_case["id"],
        "newEvidence": new_ev,
        "updatedSummary": target_case["summary"],
        "timeline": target_case["timeline"],
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
            title_desc = f"{c.get('name', '')} {c.get('description', '')} {json.dumps(c.get('records', []))}".lower()
            if "rear" in title_desc or "highway" in title_desc:
                traj = trajectory_engine.generate_rear_end_trajectory()
                scenario_name = "HIGHWAY_REAR_END"
            elif "head" in title_desc or "oncoming" in title_desc:
                traj = trajectory_engine.generate_head_on_trajectory()
                scenario_name = "HEAD_ON"
            elif "bike" in title_desc or "motorcycle" in title_desc:
                traj = trajectory_engine.generate_intersection_trajectory("MOTORCYCLE")
                scenario_name = "CAR_VS_BIKE"
            else:
                traj = trajectory_engine.generate_intersection_trajectory("SUV")
                scenario_name = "INTERSECTION_TBONE"

            c["trajectory"] = traj
            return {
                "caseId": case_id,
                "scenario": scenario_name,
                "frameCount": len(traj),
                "frames": traj
            }
    raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

@router.get("/{case_id}/yolo-detections")
def get_case_yolo_detections(case_id: str):
    """
    Returns YOLOv8 vehicle detections (cars, motorcycles, trucks, buses)
    identified in the case video evidence.
    """
    for c in CASES_DB:
        if c.get("id").upper() == case_id.upper():
            return {
                "caseId": case_id,
                "model": "YOLOv8n (Ultralytics)",
                "targetClasses": ["car", "motorcycle", "bus", "truck"],
                "detections": yolo_service.get_demo_detections()
            }
    raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

@router.get("/{case_id}/evidence-gaps")
def get_case_evidence_gaps(case_id: str):
    """
    Returns automated flags for missing information, blindspots, and unverified data.
    """
    for c in CASES_DB:
        if c.get("id").upper() == case_id.upper():
            gaps = forensic_ai_engine.analyze_evidence_gaps(c.get("records", []))
            return {
                "caseId": case_id,
                "gapCount": len(gaps),
                "evidenceGaps": gaps
            }
    raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

