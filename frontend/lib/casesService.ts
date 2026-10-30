export interface EvidenceRecord {
  id: string;
  name: string;
  uploadDate: string;           // System Time
  size: string;
  dataType: "Video" | "Audio" | "PDF" | "Image" | "Doc" | "Text" | "Script" | "Sensor";
  accidentTime: string;         // Event Time
  is_data_extracted: number;    // 0 = Pending, 1 = Extracted
  status: "Extracted" | "Pending";
  extractedData?: {
    summary?: string;
    keyObservations?: string[];
    speedKmh?: number;
    brakePressure?: string;
    transcript?: string;
    cameraAngle?: string;
    metadata?: Record<string, unknown>;
  };
  fileUrl?: string;
  fileBlobContent?: string;
}

export interface TimelineEntry {
  id: string;
  evidenceName: string;
  accidentTime: string;         // Event Time
  uploadedTime: string;         // System Time
  title: string;
  description: string;
  dataType: string;
  classification: "OBSERVATION" | "INFERENCE";
  confidence: number;
}

export interface CaseDetail {
  id: string;                   // CASE-YYYY-XXXX
  name: string;
  caseNumber: string;
  filedBy: string;
  filedDate: string;            // DateTime
  address: string;
  latitude?: number;
  longitude?: number;
  accidentDate: string;         // Event Timeline start
  description: string;
  summary: string;              // Dynamic: Summary = f(all_evidence_files)
  isGeneratingSummary?: boolean;
  lastAnalyzedAt?: string;
  status: "Flagged Contradiction" | "Verified Consistent" | "In Review";
  confidence: number;
  evidenceList: EvidenceRecord[];
  timeline: TimelineEntry[];
}

export interface ActivityFeedItem {
  id: string;
  caseId: string;
  action: string;
  timestamp: string;
}

// 2 Realistic Indian Context Cases
export const DEFAULT_INDIAN_CASES: CaseDetail[] = [
  {
    id: "CASE-2026-1042",
    name: "Outer Ring Road Gachibowli Junction Collision",
    caseNumber: "CASE-2026-1042",
    filedBy: "Inspector R. K. Sharma",
    filedDate: "Oct 28, 2026, 04:30 PM",
    address: "ORR Junction near Gachibowli Flyover, Hyderabad, Telangana",
    latitude: 17.4401,
    longitude: 78.3489,
    accidentDate: "Oct 28, 2026, 03:15 PM",
    description: "Collision involving a commercial passenger auto-rickshaw and a private compact SUV approaching the signal intersection during evening traffic flow.",
    summary: "At approximately 03:15 PM, vehicle approaching Gachibowli ORR junction from Hitec City direction experienced lateral impact. Dashcam footage confirms traffic signal had transitioned to green for main corridor. Witness statement alleging red light violation is disproven by optical camera timeline. Vehicle telemetry confirms abrupt emergency braking 0.8 seconds before impact.",
    lastAnalyzedAt: "Oct 28, 2026, 04:45 PM",
    status: "Flagged Contradiction",
    confidence: 92,
    evidenceList: [
      {
        id: "EV-1042-01",
        name: "junction_cctv_camera_stream_04.mp4",
        uploadDate: "Oct 28, 2026, 04:35 PM",
        size: "18.4 MB",
        dataType: "Video",
        accidentTime: "03:15 PM, 28th Oct",
        is_data_extracted: 1,
        status: "Extracted",
        extractedData: {
          summary: "CCTV optical feed indicates green signal along main carriageway.",
          keyObservations: [
            "Green signal verified at 03:14:58 PM",
            "Vehicle deceleration observed 0.8 seconds prior to impact point"
          ]
        }
      },
      {
        id: "EV-1042-02",
        name: "traffic_police_field_panchnama.pdf",
        uploadDate: "Oct 28, 2026, 04:40 PM",
        size: "2.1 MB",
        dataType: "PDF",
        accidentTime: "03:15 PM, 28th Oct",
        is_data_extracted: 1,
        status: "Extracted",
        extractedData: {
          summary: "Site panchnama confirms dry bituminous road conditions and no road surface defects.",
          keyObservations: [
            "Road surface: Dry bituminous asphalt",
            "Visibility: Clear daylight"
          ]
        }
      },
      {
        id: "EV-1042-03",
        name: "auto_driver_audio_statement.wav",
        uploadDate: "Oct 28, 2026, 04:42 PM",
        size: "3.5 MB",
        dataType: "Audio",
        accidentTime: "03:15 PM, 28th Oct",
        is_data_extracted: 1,
        status: "Extracted",
        extractedData: {
          transcript: "The SUV was speeding towards the junction and ignored the red amber signal transition while crossing.",
          summary: "Driver statement disputes junction entry timing."
        }
      }
    ],
    timeline: [
      {
        id: "TL-1042-01",
        evidenceName: "junction_cctv_camera_stream_04.mp4",
        accidentTime: "03:14:58 PM",
        uploadedTime: "Oct 28, 2026, 04:35 PM",
        title: "Signal Phase Validation",
        description: "Optical frame verification confirms active green signal along main corridor.",
        dataType: "Video",
        classification: "OBSERVATION",
        confidence: 98
      },
      {
        id: "TL-1042-02",
        evidenceName: "auto_driver_audio_statement.wav",
        accidentTime: "03:15:00 PM",
        uploadedTime: "Oct 28, 2026, 04:42 PM",
        title: "Witness Statement Contradiction",
        description: "Driver verbal statement alleging signal violation contradicts CCTV ground truth.",
        dataType: "Audio",
        classification: "INFERENCE",
        confidence: 64
      },
      {
        id: "TL-1042-03",
        evidenceName: "traffic_police_field_panchnama.pdf",
        accidentTime: "03:15:04 PM",
        uploadedTime: "Oct 28, 2026, 04:40 PM",
        title: "Impact Point and Scene Inspection",
        description: "Police panchnama records vehicle resting positions in northwest lane quadrant.",
        dataType: "PDF",
        classification: "OBSERVATION",
        confidence: 96
      }
    ]
  },
  {
    id: "CASE-2026-3180",
    name: "Bengaluru Mysore Expressway Ramanagara Pileup",
    caseNumber: "CASE-2026-3180",
    filedBy: "Sub-Inspector Suresh Gowda",
    filedDate: "Oct 29, 2026, 08:45 AM",
    address: "Bengaluru-Mysuru Expressway, KM 48 Near Ramanagara, Karnataka",
    latitude: 12.7209,
    longitude: 77.2799,
    accidentDate: "Oct 29, 2026, 07:10 AM",
    description: "Chain collision involving intercity bus and two private cars in early morning reduced visibility conditions.",
    summary: "At 07:10 AM on the Bengaluru-Mysuru Expressway near Ramanagara, lead vehicle executed sudden braking due to stationary obstacle in median lane. Trailing vehicles failed to maintain 3-second safe stopping distance. OBD-II sensor log confirms severe deceleration wave (-0.78 G) and ABS actuation.",
    lastAnalyzedAt: "Oct 29, 2026, 09:15 AM",
    status: "Verified Consistent",
    confidence: 89,
    evidenceList: [
      {
        id: "EV-3180-01",
        name: "bus_telemetry_ecu_log.csv",
        uploadDate: "Oct 29, 2026, 08:50 AM",
        size: "1.4 MB",
        dataType: "Sensor",
        accidentTime: "07:10 AM, 29th Oct",
        is_data_extracted: 1,
        status: "Extracted",
        extractedData: {
          summary: "CAN bus telemetry registers abrupt brake pressure rise from 0 to 78 bar.",
          keyObservations: [
            "Speed before braking: 72 km/h",
            "Emergency deceleration: -0.78 G"
          ]
        }
      },
      {
        id: "EV-3180-02",
        name: "dashcam_car_front_facing.mp4",
        uploadDate: "Oct 29, 2026, 09:00 AM",
        size: "24.6 MB",
        dataType: "Video",
        accidentTime: "07:10 AM, 29th Oct",
        is_data_extracted: 1,
        status: "Extracted",
        extractedData: {
          summary: "Dashcam records dense morning haze and sudden brake lights illumination on forward vehicle."
        }
      }
    ],
    timeline: [
      {
        id: "TL-3180-01",
        evidenceName: "bus_telemetry_ecu_log.csv",
        accidentTime: "07:09:58 AM",
        uploadedTime: "Oct 29, 2026, 08:50 AM",
        title: "Sudden Hazard Deceleration",
        description: "Telemetry indicates brake pedal actuation in response to stationary median object.",
        dataType: "Sensor",
        classification: "OBSERVATION",
        confidence: 99
      },
      {
        id: "TL-3180-02",
        evidenceName: "dashcam_car_front_facing.mp4",
        accidentTime: "07:10:02 AM",
        uploadedTime: "Oct 29, 2026, 09:00 AM",
        title: "Rear-End Contact Registered",
        description: "Trailing passenger car impacts rear bumper in lane 2.",
        dataType: "Video",
        classification: "OBSERVATION",
        confidence: 95
      }
    ]
  }
];

const STORAGE_KEY = "rikeshi_cases_store_v3";
const ACTIVITY_KEY = "rikeshi_activity_feed_v3";

export function getStoredCases(): CaseDetail[] {
  if (typeof window === "undefined") return DEFAULT_INDIAN_CASES;
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    if (!item) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_INDIAN_CASES));
      return DEFAULT_INDIAN_CASES;
    }
    const parsed = JSON.parse(item);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_INDIAN_CASES));
      return DEFAULT_INDIAN_CASES;
    }
    return parsed;
  } catch (err) {
    console.error("Error reading cases from localStorage", err);
    return DEFAULT_INDIAN_CASES;
  }
}

export function saveStoredCases(cases: CaseDetail[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
  } catch (err) {
    console.error("Error saving cases to localStorage", err);
  }
}

export function getStoredCaseById(id: string): CaseDetail | undefined {
  const cases = getStoredCases();
  return cases.find(
    (c) => c.id.toLowerCase() === id.toLowerCase() || c.caseNumber.toLowerCase() === id.toLowerCase()
  );
}

export function generateNextCaseNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CASE-${year}-${rand}`;
}

export function getRecentActivities(): ActivityFeedItem[] {
  if (typeof window === "undefined") return [
    {
      id: "ACT-01",
      caseId: "CASE-2026-1042",
      action: "Analyzed 3 multi-source records for CASE-2026-1042",
      timestamp: "04:45 PM"
    },
    {
      id: "ACT-02",
      caseId: "CASE-2026-3180",
      action: "Synchronized dual timeline for CASE-2026-3180",
      timestamp: "09:15 AM"
    }
  ];
  try {
    const item = localStorage.getItem(ACTIVITY_KEY);
    if (!item) {
      const defaults = [
        {
          id: "ACT-01",
          caseId: "CASE-2026-1042",
          action: "Analyzed 3 multi-source records for CASE-2026-1042",
          timestamp: "04:45 PM"
        },
        {
          id: "ACT-02",
          caseId: "CASE-2026-3180",
          action: "Synchronized dual timeline for CASE-2026-3180",
          timestamp: "09:15 AM"
        }
      ];
      localStorage.setItem(ACTIVITY_KEY, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(item);
  } catch {
    return [];
  }
}

export function addActivity(action: string, caseId: string) {
  if (typeof window === "undefined") return;
  try {
    const activities = getRecentActivities();
    const newAct: ActivityFeedItem = {
      id: `ACT-${Date.now()}`,
      caseId,
      action,
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    };
    const updated = [newAct, ...activities].slice(0, 20);
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Error adding activity", err);
  }
}

export function createNewCase(data: {
  name: string;
  caseNumber: string;
  filedBy: string;
  filedDate: string;
  address: string;
  latitude?: number;
  longitude?: number;
  accidentDate: string;
  description: string;
  sources: Array<{ name: string; size: string; type: string }>;
}): CaseDetail {
  const currentCases = getStoredCases();
  const nowStr = new Date().toLocaleString("en-US", { 
    month: "short", 
    day: "numeric", 
    year: "numeric", 
    hour: "2-digit", 
    minute: "2-digit" 
  });

  const evidenceList: EvidenceRecord[] = data.sources.map((src, idx) => {
    let dataType: EvidenceRecord["dataType"] = "Doc";
    const nameLower = src.name.toLowerCase();
    if (nameLower.endsWith(".mp4") || nameLower.endsWith(".mov") || nameLower.endsWith(".avi") || src.type.includes("video")) {
      dataType = "Video";
    } else if (nameLower.endsWith(".mp3") || nameLower.endsWith(".wav") || nameLower.endsWith(".m4a") || src.type.includes("audio")) {
      dataType = "Audio";
    } else if (nameLower.endsWith(".pdf") || src.type.includes("pdf")) {
      dataType = "PDF";
    } else if (nameLower.endsWith(".csv") || nameLower.endsWith(".json") || nameLower.includes("sensor")) {
      dataType = "Sensor";
    } else if (nameLower.endsWith(".png") || nameLower.endsWith(".jpg") || nameLower.endsWith(".jpeg") || src.type.includes("image")) {
      dataType = "Image";
    } else if (nameLower.endsWith(".py") || nameLower.endsWith(".sh") || nameLower.endsWith(".js")) {
      dataType = "Script";
    } else if (nameLower.endsWith(".txt")) {
      dataType = "Text";
    }

    return {
      id: `EV-${data.caseNumber}-${idx + 1}`,
      name: src.name,
      uploadDate: nowStr,
      size: src.size || "1.5 MB",
      dataType: dataType,
      accidentTime: data.accidentDate ? new Date(data.accidentDate).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "Accident Window",
      is_data_extracted: 1,
      status: "Extracted",
      extractedData: {
        summary: `Data and digital artifacts extracted from ${src.name}.`,
        keyObservations: [
          `File format verified as ${dataType}`,
          `Timestamp correlated with incident timeline`
        ]
      }
    };
  });

  const timeline: TimelineEntry[] = evidenceList.map((ev, i) => ({
    id: `TL-${data.caseNumber}-${i + 1}`,
    evidenceName: ev.name,
    accidentTime: ev.accidentTime,
    uploadedTime: ev.uploadDate,
    title: `Evidence Ingested: ${ev.name}`,
    description: `Recorded digital evidence stream added to case file.`,
    dataType: ev.dataType,
    classification: ev.dataType === "Video" || ev.dataType === "Sensor" ? "OBSERVATION" : "INFERENCE",
    confidence: ev.dataType === "Video" ? 98 : ev.dataType === "Sensor" ? 99 : 85
  }));

  const initialSummary = evidenceList.length > 0
    ? `Case initialized with ${evidenceList.length} evidence file(s). Automated analysis evaluates initial reports regarding the incident at ${data.address}. Kinematic and temporal data indicate sequential event occurrence around ${data.accidentDate}.`
    : `Case registered without initial source files. Upload evidence files in the Records tab to automatically generate an incident reconstruction summary.`;

  const newCase: CaseDetail = {
    id: data.caseNumber,
    name: data.name,
    caseNumber: data.caseNumber,
    filedBy: data.filedBy || "Investigator",
    filedDate: data.filedDate || nowStr,
    address: data.address || "Unspecified Location",
    latitude: data.latitude,
    longitude: data.longitude,
    accidentDate: data.accidentDate || nowStr,
    description: data.description,
    summary: initialSummary,
    lastAnalyzedAt: nowStr,
    status: "In Review",
    confidence: evidenceList.length > 0 ? 88 : 0,
    evidenceList: evidenceList,
    timeline: timeline
  };

  const updatedCases = [newCase, ...currentCases];
  saveStoredCases(updatedCases);
  addActivity(`Created case ${newCase.caseNumber}`, newCase.caseNumber);

  return newCase;
}

export function autoGenerateSummary(caseItem: CaseDetail): string {
  const total = caseItem.evidenceList.length;
  if (total === 0) {
    return "No digital evidence files attached to this case. Upload files in the Records tab to automatically generate an incident reconstruction summary.";
  }

  const names = caseItem.evidenceList.map((e) => e.name).join(", ");
  const types = Array.from(new Set(caseItem.evidenceList.map((e) => e.dataType))).join(", ");

  const hasAudio = caseItem.evidenceList.some((e) => e.dataType === "Audio");
  const hasVideo = caseItem.evidenceList.some((e) => e.dataType === "Video");
  const hasSensor = caseItem.evidenceList.some((e) => e.dataType === "Sensor");

  let discrepancyNote = "";
  if (hasAudio && hasVideo) {
    discrepancyNote = " Multi-source examination identified potential variance between witness verbal description and recorded video footage regarding signal state and vehicular trajectory. Video records serve as primary physical reference.";
  } else if (hasSensor && hasVideo) {
    discrepancyNote = " Sensor deceleration metrics corroborate video optical velocity calculations.";
  }

  return `Incident reconstruction generated from ${total} evidence source(s) [${types}]: ${names}. Event timeline localized around ${caseItem.accidentDate} at ${caseItem.address}.${discrepancyNote} Analysis reflects synthesized timeline observations across all uploaded material.`;
}

export function addEvidenceToCase(
  caseId: string, 
  file: { name: string; size: string; type: string; accidentTime?: string }
): CaseDetail {
  const cases = getStoredCases();
  const caseItem = cases.find((c) => c.id.toLowerCase() === caseId.toLowerCase() || c.caseNumber.toLowerCase() === caseId.toLowerCase());
  if (!caseItem) throw new Error("Case not found");

  const nowStr = new Date().toLocaleString("en-US", { 
    month: "short", 
    day: "numeric", 
    year: "numeric", 
    hour: "2-digit", 
    minute: "2-digit" 
  });

  let dataType: EvidenceRecord["dataType"] = "Doc";
  const nameLower = file.name.toLowerCase();
  if (nameLower.endsWith(".mp4") || nameLower.endsWith(".mov") || nameLower.endsWith(".avi") || file.type.includes("video")) {
    dataType = "Video";
  } else if (nameLower.endsWith(".mp3") || nameLower.endsWith(".wav") || nameLower.endsWith(".m4a") || file.type.includes("audio")) {
    dataType = "Audio";
  } else if (nameLower.endsWith(".pdf") || file.type.includes("pdf")) {
    dataType = "PDF";
  } else if (nameLower.endsWith(".csv") || nameLower.endsWith(".json") || nameLower.includes("sensor")) {
    dataType = "Sensor";
  } else if (nameLower.endsWith(".png") || nameLower.endsWith(".jpg") || file.type.includes("image")) {
    dataType = "Image";
  } else if (nameLower.endsWith(".py") || nameLower.endsWith(".sh") || nameLower.endsWith(".js")) {
    dataType = "Script";
  } else if (nameLower.endsWith(".txt")) {
    dataType = "Text";
  }

  const newEv: EvidenceRecord = {
    id: `EV-${caseItem.caseNumber}-${caseItem.evidenceList.length + 1}`,
    name: file.name,
    uploadDate: nowStr,
    size: file.size || "1.8 MB",
    dataType: dataType,
    accidentTime: file.accidentTime || caseItem.accidentDate || "Incident Time",
    is_data_extracted: 1,
    status: "Extracted",
    extractedData: {
      summary: `Extracted digital artifacts from ${file.name}.`,
      keyObservations: [
        `File size: ${file.size}`,
        `Data classification: ${dataType}`
      ]
    }
  };

  caseItem.evidenceList.push(newEv);

  // Update timeline
  caseItem.timeline.push({
    id: `TL-${caseItem.caseNumber}-${caseItem.timeline.length + 1}`,
    evidenceName: newEv.name,
    accidentTime: newEv.accidentTime,
    uploadedTime: newEv.uploadDate,
    title: `Evidence Added: ${newEv.name}`,
    description: `Synchronized ${newEv.dataType} file into chronological evidence timeline.`,
    dataType: newEv.dataType,
    classification: newEv.dataType === "Video" || newEv.dataType === "Sensor" ? "OBSERVATION" : "INFERENCE",
    confidence: newEv.dataType === "Video" ? 98 : newEv.dataType === "Sensor" ? 99 : 85
  });

  // Automatically update dynamic summary = f(all_evidence_files)
  caseItem.summary = autoGenerateSummary(caseItem);
  caseItem.lastAnalyzedAt = nowStr;
  caseItem.confidence = Math.min(96, 75 + caseItem.evidenceList.length * 4);

  saveStoredCases(cases);
  addActivity(`Uploaded ${newEv.name} to ${caseItem.caseNumber}`, caseItem.caseNumber);

  return caseItem;
}

export function deleteEvidenceFromCase(caseId: string, evidenceId: string): CaseDetail {
  const cases = getStoredCases();
  const caseItem = cases.find((c) => c.id.toLowerCase() === caseId.toLowerCase() || c.caseNumber.toLowerCase() === caseId.toLowerCase());
  if (!caseItem) throw new Error("Case not found");

  const removed = caseItem.evidenceList.find((e) => e.id === evidenceId);
  caseItem.evidenceList = caseItem.evidenceList.filter((e) => e.id !== evidenceId);
  caseItem.timeline = caseItem.timeline.filter((t) => t.evidenceName !== removed?.name);

  // Auto-regenerate summary
  caseItem.summary = autoGenerateSummary(caseItem);
  caseItem.lastAnalyzedAt = new Date().toLocaleString("en-US", { 
    month: "short", 
    day: "numeric", 
    year: "numeric", 
    hour: "2-digit", 
    minute: "2-digit" 
  });
  caseItem.confidence = caseItem.evidenceList.length > 0 ? Math.min(96, 75 + caseItem.evidenceList.length * 4) : 0;

  saveStoredCases(cases);
  if (removed) {
    addActivity(`Removed ${removed.name} from ${caseItem.caseNumber}`, caseItem.caseNumber);
  }

  return caseItem;
}
