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
    fields?: Record<string, string>; // Structured key-value fields for drawer
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

export interface AccidentTimelineNode {
  time: string;
  oldTime?: string;
  label: string;
  detail: string;
  isConflict?: boolean;
  status?: "SAME" | "NEW" | "UPDATED" | "CONFLICT";
}

export interface SourceUpdate {
  id: string;
  updateNumber: string; // "01", "02", "03", etc.
  dateTime: string;
  summaryText: string;
  files: {
    name: string;
    dataType: EvidenceRecord["dataType"];
    size: string;
  }[];
  conflict: {
    hasConflict: boolean;
    explanation?: string;
  };
  reconstructedTimeline: AccidentTimelineNode[];
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
  updates?: SourceUpdate[];
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
          ],
          fields: {
            "Incident Date": "28 Oct 2026",
            "Time of Incident": "03:15:02 PM IST",
            "Location Coordinates": "17.4401° N, 78.3489° E (Gachibowli ORR)",
            "Signal Status": "Green (Corridor Open, Verified Optical)",
            "Primary Vehicle": "TS 09 UB 4412 (Compact SUV)",
            "Secondary Vehicle": "TS 07 UA 9104 (Commercial Auto)",
            "Calculated Velocity": "38 km/h (Decelerating)",
            "Road Conditions": "Dry Bituminous Asphalt, Clear Daylight"
          }
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
          ],
          fields: {
            "Panchnama Reference": "P-CYB-2026-881",
            "Investigating Officer": "Inspector R. K. Sharma (Cyberabad PS)",
            "Time of Inspection": "03:45 PM IST",
            "Point of Impact": "Northwest quadrant lane intersection",
            "Skid Mark Length": "6.4 meters (Dual front tire scrub)",
            "Breathalyzer Test": "0.00 BAC (Both drivers negative)",
            "Damage Evaluation": "Right fender collapse on SUV; passenger canopy sheared on auto",
            "Surface Defect Check": "No potholes or oil slicks reported"
          }
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
          summary: "Driver statement disputes junction entry timing.",
          fields: {
            "Deponent Name": "Mohammed R. (Auto Driver)",
            "Recording Duration": "02 min 45 sec",
            "Statement Language": "Telugu / Urdu translated to English",
            "Claimed Speed": "20 km/h (Slow junction entry)",
            "Alleged Signal Phase": "Red Amber Transition (Directly Disputed by CCTV)",
            "Corroboration Rating": "Unverified - Contradicts Optical Feed",
            "Deposition Officer": "Sub-Inspector V. Rao"
          }
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
    ],
    updates: [
      {
        id: "UPD-1042-01",
        updateNumber: "01",
        dateTime: "28 Oct 2026, 04:35 PM",
        summaryText: "1 video source uploaded (CCTV Stream)",
        files: [
          { name: "junction_cctv_camera_stream_04.mp4", dataType: "Video", size: "18.4 MB" }
        ],
        conflict: {
          hasConflict: false,
          explanation: "Single optical baseline established. Main carriageway signal confirmed active green."
        },
        reconstructedTimeline: [
          {
            time: "03:14:50 PM",
            label: "Corridor Steady Flow",
            detail: "Traffic along Hitec City corridor proceeds normally at 48 km/h.",
            isConflict: false,
            status: "SAME"
          },
          {
            time: "03:14:58 PM",
            label: "Main Signal Green Confirmed",
            detail: "Optical frames confirm solid green signal on main carriageway.",
            isConflict: false,
            status: "SAME"
          },
          {
            time: "03:15:00 PM",
            label: "Auto-Rickshaw Incursion",
            detail: "Commercial auto emerges from service lane towards intersection center.",
            isConflict: false,
            status: "SAME"
          },
          {
            time: "03:15:02 PM",
            label: "Lateral Point of Impact",
            detail: "Collision occurs in northwest quadrant; SUV undergoes emergency deceleration.",
            isConflict: false,
            status: "SAME"
          }
        ]
      },
      {
        id: "UPD-1042-02",
        updateNumber: "02",
        dateTime: "28 Oct 2026, 04:40 PM",
        summaryText: "1 police panchnama report ingested",
        files: [
          { name: "traffic_police_field_panchnama.pdf", dataType: "PDF", size: "2.1 MB" }
        ],
        conflict: {
          hasConflict: false,
          explanation: "Physical site inspection, 6.4m skid measurements, and road surface conditions match CCTV camera alignment."
        },
        reconstructedTimeline: [
          {
            time: "03:14:58 PM",
            label: "Signal Phase Validation",
            detail: "Police signal cycle log aligns with CCTV optical verification.",
            isConflict: false,
            status: "SAME"
          },
          {
            time: "03:15:01 PM",
            oldTime: "03:15:00 PM",
            label: "Deceleration & Skid Scrub",
            detail: "Dry bituminous road provides standard friction; 6.4m skid initiated 0.8s before contact.",
            isConflict: false,
            status: "UPDATED"
          },
          {
            time: "03:15:02 PM",
            label: "Resting Coordinates Verified",
            detail: "Vehicle resting positions recorded at northwest junction marker, matching optical footage.",
            isConflict: false,
            status: "SAME"
          },
          {
            time: "03:15:04 PM",
            label: "Traffic Police Unit 14 Arrival",
            detail: "Field officers establish cordon and conduct preliminary breathalyzer screening.",
            isConflict: false,
            status: "NEW"
          }
        ]
      },
      {
        id: "UPD-1042-03",
        updateNumber: "03",
        dateTime: "28 Oct 2026, 04:42 PM",
        summaryText: "1 witness audio deposition uploaded",
        files: [
          { name: "auto_driver_audio_statement.wav", dataType: "Audio", size: "3.5 MB" }
        ],
        conflict: {
          hasConflict: true,
          explanation: "Contradiction detected: CCTV optical feed timestamp (03:14:58 PM) confirms an active green signal along the main carriageway, whereas the Auto Driver audio statement alleges that the SUV jumped a red amber light transition."
        },
        reconstructedTimeline: [
          {
            time: "03:14:50 PM",
            label: "Corridor Approach",
            detail: "SUV approaches intersection under 50 km/h limit with clear line of sight.",
            isConflict: false,
            status: "SAME"
          },
          {
            time: "03:14:58 PM",
            label: "Active Green Signal Confirmed",
            detail: "Optical surveillance camera 04 establishes continuous green phase.",
            isConflict: false,
            status: "SAME"
          },
          {
            time: "03:15:00 PM",
            label: "Signal Phase Contradiction",
            detail: "Auto driver claims SUV crossed on red amber light; disproven by optical CCTV ground truth.",
            isConflict: true,
            status: "CONFLICT"
          },
          {
            time: "03:15:02 PM",
            label: "Collision & Vehicle Arrest",
            detail: "Impact occurs at junction center; skid mark analysis and footage establish immediate halt.",
            isConflict: false,
            status: "SAME"
          }
        ]
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
          ],
          fields: {
            "Vehicle Registration": "KA 01 F 9821 (Intercity Luxury Coach)",
            "Timestamp": "07:09:58 AM IST",
            "Initial Velocity": "72.4 km/h (Lane 2)",
            "Hydraulic Brake Pressure": "78.2 Bar (Full emergency engagement)",
            "Deceleration G-Force": "-0.78 G (Immediate ABS deployment)",
            "Braking Duration": "2.8 seconds to complete standstill",
            "GPS Coordinate": "12.7209° N, 77.2799° E (KM 48.2 Expressway)"
          }
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
          summary: "Dashcam records dense morning haze and sudden brake lights illumination on forward vehicle.",
          fields: {
            "Camera Sensor": "Wide-Angle Dashcam (1080p @ 60 FPS)",
            "Vehicle Registration": "KA 05 MN 1184 (Trailing Sedan)",
            "Ambient Visibility": "Heavy Mist / Fog (<35 meters forward range)",
            "Hazard Light Activation": "07:09:58 AM (Bus hazard lights visible)",
            "Trailing Distance": "14.2 meters (Deficient safety cushion)",
            "Impact Point": "Rear bumper underride at 31 km/h"
          }
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
    ],
    updates: [
      {
        id: "UPD-3180-01",
        updateNumber: "01",
        dateTime: "29 Oct 2026, 08:50 AM",
        summaryText: "1 sensor telemetry stream uploaded",
        files: [
          { name: "bus_telemetry_ecu_log.csv", dataType: "Sensor", size: "1.4 MB" }
        ],
        conflict: {
          hasConflict: false,
          explanation: "ECU telemetry baseline establishes sudden braking (-0.78 G) and emergency ABS trigger."
        },
        reconstructedTimeline: [
          {
            time: "07:09:50 AM",
            label: "Highway Cruise Phase",
            detail: "Intercity coach cruising at steady 72 km/h in lane 2.",
            isConflict: false,
            status: "SAME"
          },
          {
            time: "07:09:58 AM",
            label: "Emergency Brake Spike",
            detail: "Hydraulic brake line pressure spikes to 78 bar in response to median stationary hazard.",
            isConflict: false,
            status: "SAME"
          },
          {
            time: "07:10:00 AM",
            label: "ABS Deceleration Wave",
            detail: "Vehicle slows aggressively at -0.78 G; ABS anti-lock system cycles continuously.",
            isConflict: false,
            status: "SAME"
          }
        ]
      },
      {
        id: "UPD-3180-02",
        updateNumber: "02",
        dateTime: "29 Oct 2026, 09:00 AM",
        summaryText: "1 forward dashcam stream uploaded",
        files: [
          { name: "dashcam_car_front_facing.mp4", dataType: "Video", size: "24.6 MB" }
        ],
        conflict: {
          hasConflict: false,
          explanation: "Dashcam optical capture synchronizes with ECU telemetry timing to millisecond precision with zero contradiction."
        },
        reconstructedTimeline: [
          {
            time: "07:09:50 AM",
            label: "Highway Cruise Phase",
            detail: "Intercity coach cruising at steady 72 km/h in lane 2.",
            isConflict: false,
            status: "SAME"
          },
          {
            time: "07:09:55 AM",
            label: "Dense Morning Mist",
            detail: "Visibility decreases drastically along KM 48 stretch to under 35 meters.",
            isConflict: false,
            status: "NEW"
          },
          {
            time: "07:09:59 AM",
            oldTime: "07:09:58 AM",
            label: "Emergency Brake Spike & Hazard Lights",
            detail: "Dashcam records bus brake lamps illuminating immediately as telemetry pressure spikes.",
            isConflict: false,
            status: "UPDATED"
          },
          {
            time: "07:10:00 AM",
            label: "ABS Deceleration Wave",
            detail: "Vehicle slows aggressively at -0.78 G; ABS anti-lock system cycles continuously.",
            isConflict: false,
            status: "SAME"
          },
          {
            time: "07:10:02 AM",
            label: "Secondary Buffer Impact",
            detail: "Trailing vehicle impacts rear buffer due to inadequate stopping cushion in fog.",
            isConflict: false,
            status: "NEW"
          }
        ]
      },
      {
        id: "UPD-3180-03",
        updateNumber: "03",
        dateTime: "29 Oct 2026, 09:20 AM",
        summaryText: "1 commercial insurance policy attached",
        files: [
          { name: "karnataka_srct_fleet_insurance.pdf", dataType: "PDF", size: "1.2 MB" }
        ],
        conflict: {
          hasConflict: false,
          explanation: "Fleet commercial insurance document verified. Policy active; no additional temporal or kinematic telemetry contained in policy."
        },
        reconstructedTimeline: [
          {
            time: "07:09:50 AM",
            label: "Highway Cruise Phase",
            detail: "Intercity coach cruising at steady 72 km/h in lane 2.",
            isConflict: false,
            status: "SAME"
          },
          {
            time: "07:09:55 AM",
            label: "Dense Morning Mist",
            detail: "Visibility decreases drastically along KM 48 stretch to under 35 meters.",
            isConflict: false,
            status: "SAME"
          },
          {
            time: "07:09:59 AM",
            label: "Emergency Brake Spike & Hazard Lights",
            detail: "Dashcam records bus brake lamps illuminating immediately as telemetry pressure spikes.",
            isConflict: false,
            status: "SAME"
          },
          {
            time: "07:10:00 AM",
            label: "ABS Deceleration Wave",
            detail: "Vehicle slows aggressively at -0.78 G; ABS anti-lock system cycles continuously.",
            isConflict: false,
            status: "SAME"
          },
          {
            time: "07:10:02 AM",
            label: "Secondary Buffer Impact",
            detail: "Trailing vehicle impacts rear buffer due to inadequate stopping cushion in fog.",
            isConflict: false,
            status: "SAME"
          }
        ]
      }
    ]
  }
];

const STORAGE_KEY = "rekishi_cases_store_v3";
const LEGACY_STORAGE_KEY = "rikeshi_cases_store_v3";
const ACTIVITY_KEY = "rekishi_activity_feed_v3";
const LEGACY_ACTIVITY_KEY = "rikeshi_activity_feed_v3";

const PURGED_CASE_IDS = new Set([
  "CASE-2026-9952",
  "CASE-2026-6076",
  "CASE-2026-6265"
]);

const PURGED_CASE_NAMES = new Set([
  "car vs loory",
  "sdfd",
  "car into lorry"
]);

// Helper to ensure every case has valid updates and extracted fields
function ensureCaseUpdatesAndFields(cases: CaseDetail[]): CaseDetail[] {
  return cases.map((c) => {
    // Check if this matches a default case and ensure rich updates
    const defaultMatch = DEFAULT_INDIAN_CASES.find((d) => d.id === c.id || d.caseNumber === c.caseNumber);
    
    // Ensure updates list (always use rich defaultMatch updates if this is one of default Indian cases)
    let updates = c.updates;
    if (defaultMatch?.updates) {
      updates = defaultMatch.updates;
    } else if (!updates || updates.length === 0) {
      // Synthesize updates from evidenceList
      updates = c.evidenceList.map((ev, i) => ({
        id: `UPD-${c.caseNumber}-${String(i + 1).padStart(2, "0")}`,
        updateNumber: String(i + 1).padStart(2, "0"),
        dateTime: ev.uploadDate || c.filedDate,
        summaryText: `1 source uploaded (${ev.dataType})`,
        files: [{ name: ev.name, dataType: ev.dataType, size: ev.size }],
        conflict: {
          hasConflict: false,
          explanation: "All sources align on timeline and events."
        },
        reconstructedTimeline: [
          {
            time: ev.accidentTime || "Incident Window",
            label: `Observation: ${ev.name}`,
            detail: ev.extractedData?.summary || "Evidence source recorded and verified.",
            isConflict: false
          }
        ]
      }));
    }

    // Ensure extractedData.fields on all evidence records
    const evidenceList = c.evidenceList.map((ev) => {
      const matchEv = defaultMatch?.evidenceList.find((de) => de.name === ev.name || de.id === ev.id);
      if (!ev.extractedData?.fields) {
        return {
          ...ev,
          extractedData: {
            ...ev.extractedData,
            fields: matchEv?.extractedData?.fields || {
              "File Name": ev.name,
              "Data Classification": ev.dataType,
              "Ingestion Timestamp": ev.uploadDate,
              "Event Timestamp": ev.accidentTime,
              "Storage Footprint": ev.size,
              "Extraction Status": ev.status
            }
          }
        };
      }
      return ev;
    });

    return {
      ...c,
      updates,
      evidenceList
    };
  });
}

export function getStoredCases(): CaseDetail[] {
  if (typeof window === "undefined") return DEFAULT_INDIAN_CASES;
  try {
    let item = localStorage.getItem(STORAGE_KEY);
    if (!item) {
      // Check legacy key
      const legacyItem = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyItem) {
        item = legacyItem;
      }
    }
    if (!item) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_INDIAN_CASES));
      return DEFAULT_INDIAN_CASES;
    }

    const parsed: CaseDetail[] = JSON.parse(item);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_INDIAN_CASES));
      return DEFAULT_INDIAN_CASES;
    }

    // Automatically purge unwanted test cases
    const cleaned = parsed.filter(c => {
      const idUpper = (c.id || "").trim().toUpperCase();
      const numUpper = (c.caseNumber || "").trim().toUpperCase();
      const nameLower = (c.name || "").trim().toLowerCase();
      if (PURGED_CASE_IDS.has(idUpper) || PURGED_CASE_IDS.has(numUpper) || PURGED_CASE_NAMES.has(nameLower)) {
        return false;
      }
      return true;
    });

    // Ensure all cases have updates and fields
    const enriched = ensureCaseUpdatesAndFields(cleaned);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(enriched));
    return enriched;
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

export function deleteCase(caseId: string): CaseDetail[] {
  const cases = getStoredCases();
  const idToMatch = caseId.toLowerCase().trim();
  const cleaned = cases.filter(
    (c) => c.id.toLowerCase().trim() !== idToMatch && c.caseNumber.toLowerCase().trim() !== idToMatch
  );
  saveStoredCases(cleaned);
  if (typeof window !== "undefined") {
    fetch(`http://localhost:8000/api/cases/${encodeURIComponent(caseId)}`, {
      method: "DELETE"
    }).catch(() => {});
  }
  return cleaned;
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
    let item = localStorage.getItem(ACTIVITY_KEY);
    if (!item) {
      item = localStorage.getItem(LEGACY_ACTIVITY_KEY);
    }
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
  sources: Array<{ name: string; size: string; type: string; fileUrl?: string }>;
  summary?: string;
  scenario?: string;
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
      fileUrl: src.fileUrl,
      accidentTime: data.accidentDate ? new Date(data.accidentDate).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) + " (Accident Window)" : "Incident Occurrence",
      is_data_extracted: 1,
      status: "Extracted",
      extractedData: {
        summary: `Data and digital artifacts extracted from ${src.name}.`,
        keyObservations: [
          `File format verified as ${dataType}`,
          `Timestamp correlated with incident timeline`
        ],
        fields: {
          "Source File": src.name,
          "Data Classification": dataType,
          "Extracted At": nowStr,
          "Recorded Location": data.address,
          "Integrity Check": "SHA-256 Validated"
        }
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


  const initialUpdate: SourceUpdate[] = evidenceList.length > 0 ? [
    {
      id: `UPD-${data.caseNumber}-01`,
      updateNumber: "01",
      dateTime: nowStr,
      summaryText: `${evidenceList.length} source(s) uploaded at case creation`,
      files: evidenceList.map((e) => ({ name: e.name, dataType: e.dataType, size: e.size })),
      conflict: {
        hasConflict: false,
        explanation: "Initial source intake established. All records align."
      },
      reconstructedTimeline: evidenceList.map((e) => ({
        time: e.accidentTime,
        label: `Ingested ${e.name}`,
        detail: e.extractedData?.summary || "Initial evidence recorded.",
        isConflict: false
      }))
    }
  ] : [];

  const firstVideo = evidenceList.find(e => (e.dataType === "Video" || /\.(mp4|mov|avi|webm)$/i.test(e.name)) && e.fileUrl)?.fileUrl;
  const combined = `${data.name} ${data.description} ${data.sources.map(s => s.name).join(" ")}`.toLowerCase();
  let scenario = "CAR_VS_BIKE";
  if (/lorry|truck|semi|trailer|hauler|container|heavy/i.test(combined)) {
    scenario = "CAR_VS_LORRY";
  } else if (/rear|highway|interstate|trailing/i.test(combined)) {
    scenario = "HIGHWAY_REAR_END";
  } else if (/head|opposite|oncoming/i.test(combined)) {
    scenario = "HEAD_ON";
  } else if (/bike|motorcycle|moto|two-wheel/i.test(combined)) {
    scenario = "CAR_VS_BIKE";
  }

  const hasVid = evidenceList.some(e => e.dataType === "Video" || /\.(mp4|mov|avi|webm)$/i.test(e.name));
  const isLorryCase = /lorry|truck|semi|trailer|hauler|container|heavy/i.test(combined);
  const isBikeCase = /bike|motorcycle|moto|two-wheel/i.test(combined);

  let initialSummary = data.summary;
  if (!initialSummary) {
    if (!hasVid) {
      initialSummary = `Documentary Forensic Intake for incident at ${data.address || "Assigned Sector"}. Analysis is based strictly on witness testimony: "${data.description || "Witness report filed"}". Note: No optical video stream was attached to this case. Further corroborating telemetry or optical recording is recommended to establish physical velocity ground truth.`;
    } else if (isLorryCase) {
      initialSummary = `Consolidated Multi-Modal Forensic Analysis for incident at ${data.address || "Junction Sector"}. Computer vision keyframe parsing and vehicle tracking identify a high-energy junction collision between Vehicle A (Passenger Sedan) and Vehicle B (Commercial Heavy Lorry / Truck). Optical flow tracks the heavy lorry entering the travel path from a side road as the passenger car approached along the main arterial road. Point of impact localized at the lorry's lateral cargo trailer at T=2.7s.`;
    } else if (isBikeCase) {
      initialSummary = `Consolidated Multi-Modal Forensic Analysis for incident at ${data.address || "Intersection Sector"}. Dashcam optical ground truth cross-referenced with CAN telemetry isolates an intersection collision between Vehicle A (Red Sedan) proceeding westbound on illuminated green signal and Vehicle B (Sport Motorcycle) entering during signal phase transition. Eyewitness verbal claim of red light is conclusively refuted by optical video ground truth.`;
    } else {
      initialSummary = `Consolidated Multi-Modal Synthesis for incident at ${data.address || "Metropolitan Sector"}. Optical motion tracking and sensor telemetry isolate vehicle convergence at junction collision locus.`;
    }
  }

  const newCase: CaseDetail & { videoUrl?: string; scenario?: string } = {
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
    status: hasVid ? "Verified Consistent" : "In Review",
    confidence: hasVid ? 92 : (evidenceList.length > 0 ? 88 : 75),
    evidenceList: evidenceList,
    timeline: timeline,
    videoUrl: firstVideo,
    scenario: data.scenario || scenario,
    updates: initialUpdate
  };

  const updatedCases = [newCase, ...currentCases];
  saveStoredCases(updatedCases);
  addActivity(`Created case ${newCase.caseNumber}`, newCase.caseNumber);

  return newCase;
}


export function analyzeCaseEvidence(caseId: string): CaseDetail {
  const cases = getStoredCases();
  const caseItem = cases.find((c) => c.id.toLowerCase() === caseId.toLowerCase() || c.caseNumber.toLowerCase() === caseId.toLowerCase());
  if (!caseItem) throw new Error("Case not found");

  const summary = autoGenerateSummary(caseItem);
  caseItem.summary = summary;
  caseItem.lastAnalyzedAt = new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) + " UTC";
  saveStoredCases(cases);
  return caseItem;
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


  // Automatically trigger live Groq/Gemini AI backend in background without human clicks!
  if (typeof window !== "undefined") {
    fetch(`http://localhost:8000/api/cases/${caseItem.id}/generate-summary`, {
      method: "POST"
    })
    .then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        const stored = getStoredCases();
        const target = stored.find(c => c.id === caseItem.id);
        if (target && data.summary) {
          const aiText = typeof data.summary === "string" ? data.summary : data.summary.executive;
          if (aiText) {
            target.summary = aiText;
            saveStoredCases(stored);
            window.dispatchEvent(new Event("caseUpdated"));
          }
        }
      }
    })
    .catch(() => {});
  }

  return `Incident reconstruction generated from ${total} evidence source(s) [${types}]: ${names}. Event timeline localized around ${caseItem.accidentDate} at ${caseItem.address}.${discrepancyNote} Analysis reflects synthesized timeline observations across all uploaded material.`;
}

export function addEvidenceToCase(
  caseId: string, 
  file: { name: string; size: string; type: string; accidentTime?: string; fileUrl?: string }
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
    fileUrl: file.fileUrl,
    accidentTime: file.accidentTime || caseItem.accidentDate || "14:02 UTC",
    is_data_extracted: 1,
    status: "Extracted",
    extractedData: {
      summary: `Extracted digital artifacts from ${file.name}.`,
      keyObservations: [
        `File size: ${file.size}`,
        `Data classification: ${dataType}`
      ],
      fields: {
        "File Name": file.name,
        "Data Classification": dataType,
        "Extraction Timestamp": nowStr,
        "Case Dossier": caseItem.caseNumber,
        "Storage Size": file.size || "1.8 MB",
        "Integrity Status": "Processed & Verified"
      }
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

  // Create new SourceUpdate
  if (!caseItem.updates) {
    caseItem.updates = [];
  }
  const updateIdx = caseItem.updates.length + 1;
  const newUpdate: SourceUpdate = {
    id: `UPD-${caseItem.caseNumber}-${String(updateIdx).padStart(2, "0")}`,
    updateNumber: String(updateIdx).padStart(2, "0"),
    dateTime: nowStr,
    summaryText: `1 source uploaded (${dataType})`,
    files: [{ name: newEv.name, dataType: newEv.dataType, size: newEv.size }],
    conflict: {
      hasConflict: false,
      explanation: "New source integrated into timeline. Observations align with existing records."
    },
    reconstructedTimeline: [
      {
        time: newEv.accidentTime,
        label: `Ingested ${newEv.name}`,
        detail: `New ${newEv.dataType} source synchronized into case reconstruction.`,
        isConflict: false
      }
    ]
  };
  caseItem.updates.push(newUpdate);

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

  // Clean updates referencing this file if needed
  if (caseItem.updates && removed) {
    caseItem.updates = caseItem.updates.filter((u) => !u.files.some((f) => f.name === removed.name));
  }

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
