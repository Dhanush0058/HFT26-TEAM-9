"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  MapPin, 
  Upload, 
  FileText, 
  Video, 
  Mic, 
  FileSpreadsheet, 
  Image as ImageIcon, 
  Code, 
  X, 
  Sparkles, 
  CheckCircle2,
  Calendar,
  FolderPlus
} from "lucide-react";
import TopHeader from "@/components/TopHeader";
import { generateNextCaseNumber, createNewCase } from "@/lib/casesService";

interface UploadedFilePreview {
  name: string;
  size: string;
  type: string;
  fileUrl?: string;
}

export default function CreateNewCasePage() {
  const router = useRouter();

  // Form state
  const [caseName, setCaseName] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [filedBy, setFiledBy] = useState("Det. Marcus Vance");
  const [filedDate, setFiledDate] = useState("");
  const [address, setAddress] = useState("");
  const [accidentDate, setAccidentDate] = useState("");
  const [description, setDescription] = useState("");
  const [sources, setSources] = useState<UploadedFilePreview[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Initialize auto-generated case number & default dates
  useEffect(() => {
    setCaseNumber(generateNextCaseNumber());
    
    // Set default ISO dates for datetime-local
    const now = new Date();
    const nowIso = now.toISOString().slice(0, 16);
    setFiledDate(nowIso);
    
    // Default accident date: 2 hours prior to filed time
    const accidentTime = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    setAccidentDate(accidentTime.toISOString().slice(0, 16));
  }, []);

  const [uploadedRealFiles, setUploadedRealFiles] = useState<File[]>([]);

  const handleFilesAdded = (files: FileList | null) => {
    if (!files) return;
    const newFiles: UploadedFilePreview[] = [];
    const addedReal: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const sizeMb = (f.size / (1024 * 1024)).toFixed(1);
      let blobUrl: string | undefined = undefined;
      if (f.type.includes("video") || /\.(mp4|mov|avi|webm)$/i.test(f.name)) {
        blobUrl = URL.createObjectURL(f);
      }
      newFiles.push({
        name: f.name,
        size: `${sizeMb} MB`,
        type: f.type || "application/octet-stream",
        fileUrl: blobUrl
      });
      addedReal.push(f);
    }
    setUploadedRealFiles((prev) => [...prev, ...addedReal]);
    setSources((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveSource = (index: number) => {
    setSources((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFillDemo = () => {
    setCaseName("Grand Ave & 7th St Multi-Vehicle Collision");
    setFiledBy("Inspector Elena Rostova");
    setAddress("Intersection of Grand Ave & 7th St, West District");
    setDescription("High-velocity T-bone impact during evening peak hours. Cross-referencing traffic cam stream with passenger vehicle airbag deployment telemetry and pedestrian 911 statements.");
    setSources([
      { name: "traffic_signal_cctv_cam04.mp4", size: "28.4 MB", type: "video/mp4" },
      { name: "911_caller_pedestrian_statement.wav", size: "3.6 MB", type: "audio/wav" },
      { name: "airbag_control_module_telemetry.csv", size: "1.2 MB", type: "text/csv" },
      { name: "officer_field_sketch_scene.pdf", size: "4.1 MB", type: "application/pdf" }
    ]);
  };

  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseName.trim()) return;

    setIsSubmitting(true);

    try {
      const created = createNewCase({
        name: caseName.trim(),
        caseNumber: caseNumber,
        filedBy: filedBy.trim(),
        filedDate: filedDate,
        address: address.trim() || "Unspecified City Sector",
        accidentDate: accidentDate,
        description: description.trim(),
        sources: sources
      });

      // Upload actual video file to backend YOLO service immediately
      const vidFile = uploadedRealFiles.find(f => f.type.includes("video") || /\.(mp4|mov|avi|webm)$/i.test(f.name));
      if (vidFile) {
        const formData = new FormData();
        formData.append("file", vidFile);
        fetch(`http://localhost:8000/api/cases/${caseNumber}/upload-video`, {
          method: "POST",
          body: formData
        }).catch(() => {});
      }

      // Redirect immediately to the newly created case details page
      router.push(`/cases/${caseNumber}`);
    } catch (err) {
      console.error("Error creating case", err);
      setIsSubmitting(false);
    }
  };

  const getSourceIcon = (fileName: string) => {
    const fn = fileName.toLowerCase();
    if (fn.endsWith(".mp4") || fn.endsWith(".mov") || fn.endsWith(".avi")) return <Video className="w-4 h-4 text-blue-600" />;
    if (fn.endsWith(".mp3") || fn.endsWith(".wav") || fn.endsWith(".m4a")) return <Mic className="w-4 h-4 text-sky-600" />;
    if (fn.endsWith(".pdf")) return <FileText className="w-4 h-4 text-rose-600" />;
    if (fn.endsWith(".csv") || fn.endsWith(".json")) return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
    if (fn.endsWith(".png") || fn.endsWith(".jpg") || fn.endsWith(".jpeg")) return <ImageIcon className="w-4 h-4 text-indigo-600" />;
    if (fn.endsWith(".py") || fn.endsWith(".sh") || fn.endsWith(".js")) return <Code className="w-4 h-4 text-amber-600" />;
    return <FileText className="w-4 h-4 text-slate-500" />;
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex flex-col font-sans">
      
      {/* Top Header */}
      <TopHeader title="Create New Incident Dossier" showSearchAndFilter={false} />

      <main className="flex-1 w-full px-6 sm:px-8 py-6 max-w-4xl mx-auto space-y-6">
        
        {/* Top-Left Back Button Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/cases"
            className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Cases
          </Link>

          <button
            type="button"
            onClick={handleFillDemo}
            className="text-xs font-semibold px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" /> Load Sample Scenario
          </button>
        </div>

        {/* Case Intake Form Container */}
        <form onSubmit={handleCreateCase} className="space-y-6">
          
          {/* Block 1: Incident Identification & Officer Info */}
          <div className="bg-white p-6 rounded-lg border border-slate-200/90 shadow-2xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-blue-600" /> Incident Identification & Metadata
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Primary registration parameters and investigating official assignment.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Case Name (Required) */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Case Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Grand Ave & 7th St Side-Impact"
                  value={caseName}
                  onChange={(e) => setCaseName(e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              {/* Case Number (Auto-generated, Non-editable) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Case Number <span className="text-slate-400 font-normal">(Auto-generated)</span>
                </label>
                <input
                  type="text"
                  readOnly
                  value={caseNumber}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-mono font-bold text-blue-800 select-all cursor-not-allowed"
                />
              </div>

              {/* Filed By */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Filed By (Investigator / Officer)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Det. Marcus Vance"
                  value={filedBy}
                  onChange={(e) => setFiledBy(e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {/* Filed Date & Time */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Filed Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={filedDate}
                  onChange={(e) => setFiledDate(e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {/* Accident Date & Time (Event Timeline) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1 text-blue-900">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" /> Accident Date & Time (Event Timeline)
                </label>
                <input
                  type="datetime-local"
                  value={accidentDate}
                  onChange={(e) => setAccidentDate(e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-blue-200 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {/* Assigned Address / Location with Map Pin */}
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                  <span>Assigned Address / Location</span>
                  <span className="text-[10px] text-blue-600 font-normal flex items-center gap-0.5">
                    <MapPin className="w-3 h-3" /> Map Coordinates Enabled
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="w-4 h-4 text-blue-600" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter street intersection, highway mile marker, or GPS coordinates"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 bg-white border border-slate-200 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Initial Description */}
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Initial Incident Description & Summary of Occurrence
                </label>
                <textarea
                  rows={3}
                  placeholder="Summarize initial dispatch notes, vehicle classes, environmental conditions, or primary conflict hypotheses..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

            </div>
          </div>

          {/* Block 2: Upload Sources (Any format: Audio, Video, Text, Script, PDF, Image, Doc) */}
          <div className="bg-white p-6 rounded-lg border border-slate-200/90 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-600" /> Upload Sources
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Accepts any digital format: Audio, Video, Text, Script, PDF, Image, or Telemetry Doc.
                </p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                {sources.length} attached
              </span>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFilesAdded(e.dataTransfer.files);
              }}
              className={`p-6 border-2 border-dashed rounded-lg text-center transition cursor-pointer ${
                isDragging
                  ? "border-blue-600 bg-blue-50/60"
                  : "border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50"
              }`}
              onClick={() => {
                const el = document.getElementById("file-upload-input");
                if (el) el.click();
              }}
            >
              <input
                id="file-upload-input"
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFilesAdded(e.target.files)}
              />
              <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-xs font-bold text-slate-800">
                Drag and drop multiple forensic evidence files here, or <span className="text-blue-600 underline">browse</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Audio (.wav, .mp3), Video (.mp4, .mov), Documents (.pdf, .txt), Telemetry (.csv, .json), Images, Scripts
              </p>
            </div>

            {/* Attached Sources List */}
            {sources.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  Staged Evidence Files ({sources.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sources.map((src, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-md border border-slate-200 bg-white shadow-2xs text-xs"
                    >
                      <div className="flex items-center gap-2 overflow-hidden pr-2">
                        {getSourceIcon(src.name)}
                        <div className="truncate">
                          <div className="font-semibold text-slate-800 truncate">{src.name}</div>
                          <span className="text-[10px] text-slate-400">{src.size}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSource(idx)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-2">
            <Link
              href="/cases"
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-md transition"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting || !caseName.trim()}
              className={`h-10 px-6 text-xs font-bold rounded-md transition flex items-center gap-2 shadow-xs ${
                isSubmitting || !caseName.trim()
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Registering Case Dossier...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Create Case & Save</span>
                </>
              )}
            </button>
          </div>

        </form>

      </main>

    </div>
  );
}
