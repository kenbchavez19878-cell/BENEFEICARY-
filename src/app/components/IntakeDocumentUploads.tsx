import React, { useRef } from "react";
import { toast } from "sonner";
import type { IntakeDocument } from "../services/caseService";

export interface IntakeRequirement {
  id: string;
  name: string;
}

export const SOLO_PARENT_REQUIREMENTS: IntakeRequirement[] = [
  { id: "sp-1", name: "PSA Child Birth Certificate" },
  { id: "sp-2", name: "Proof of Solo Parent Status" },
  { id: "sp-3", name: "Barangay Indigency/Low Income" },
  { id: "sp-4", name: "Proof of Income" },
];

export const WOMEN_REQUIREMENTS: IntakeRequirement[] = [
  { id: "w-1", name: "Valid ID" },
  { id: "w-2", name: "BPO/Police Blotter" },
  { id: "w-3", name: "Medico-Legal Report" },
  { id: "w-4", name: "Barangay Indigency" },
];

export function aicsRequirements(type: string): IntakeRequirement[] {
  const common = [
    { id: "a-1", name: "Valid ID" },
    { id: "a-2", name: "Barangay Certificate of Indigency" },
  ];
  if (type === "MEDICAL") return [...common,
    { id: "a-3", name: "Hospital SOA/Bills" },
    { id: "a-4", name: "Medical/Hospital Abstract or Prescription" },
  ];
  if (type === "BURIAL") return [...common,
    { id: "a-5", name: "Death Certificate" },
    { id: "a-7", name: "Funeral Bills/Contract" },
  ];
  if (type === "TRANSPORTATION" || type === "BALIK_PROBINSYA") {
    return [...common, { id: "a-6", name: "Transit Request" }];
  }
  return [...common, { id: "a-8", name: "Proof of Income/Crisis" }];
}

export function IntakeDocumentUploads({ requirements, documents, onChange, disabled }: {
  requirements: IntakeRequirement[];
  documents: IntakeDocument[];
  onChange: (documents: IntakeDocument[]) => void;
  disabled: boolean;
}) {
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  function selectFile(requirement: IntakeRequirement, file?: File) {
    if (!file || disabled) return;
    if (!/\.(pdf|png|jpe?g|webp)$/i.test(file.name)) {
      toast.error("Select a PDF, JPEG, PNG or WebP file.");
      return;
    }
    if (file.size === 0 || file.size > 10 * 1024 * 1024) {
      toast.error("Select a non-empty file up to 10 MB.");
      return;
    }
    onChange([...documents.filter((doc) => doc.id !== requirement.id), { ...requirement, file }]);
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold text-blue-900 uppercase tracking-widest border-b border-gray-200 pb-2">
        Verification Documents
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {requirements.map((requirement) => {
          const selected = documents.find((doc) => doc.id === requirement.id);
          return (
            <div key={requirement.id}>
              <label className="text-xs font-semibold text-gray-700 block mb-1" htmlFor={`upload-${requirement.id}`}>
                {requirement.name}
              </label>
              <input
                ref={(element) => { inputs.current[requirement.id] = element; }}
                id={`upload-${requirement.id}`}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                hidden
                disabled={disabled}
                onChange={(event) => {
                  selectFile(requirement, event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
              <button
                type="button"
                disabled={disabled}
                onClick={() => inputs.current[requirement.id]?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  selectFile(requirement, event.dataTransfer.files[0]);
                }}
                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                aria-label={`${requirement.name}: ${selected?.file.name || "Select document"}`}
                title={selected?.file.name || "PDF or image, up to 10 MB"}
              >
                <span className="block truncate">{selected?.file.name || "Select or drop PDF / image (max 10 MB)"}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
