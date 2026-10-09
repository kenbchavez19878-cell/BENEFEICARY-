import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Eye, EyeOff, Shield, ChevronDown, X, Upload, Check,
  Phone, Mail, User, MapPin, FileText, AlertCircle,
  CheckCircle, Lock, ChevronLeft, ChevronRight, Globe, Clock, Menu,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────

const BARANGAYS = [
  "Balatasan", "Balombon", "Balongay", "Belen", "Bigaas", "Binaliw",
  "Binanuaanan Grande", "Binanuaanan Pequeño", "Bonot-Santa Rosa", "Cagsao",
  "Calabanga (Poblacion)", "Camuning", "Del Carmen", "Dominorog", "Fabrica",
  "Grijalvo", "Harobay", "La Purisima", "Lugsad", "Magsaysay", "Malacañang",
  "Manguiring", "Montserrat", "Pagatpat (San Jose)", "Paolbo", "Pinada",
  "Punta Tarawal", "Quipayo", "Sabang", "Salvacion", "San Antonio",
  "San Bernardino", "San Francisco", "San Isidro", "San Jose", "San Juan",
  "San Lucas", "San Miguel (Poblacion)", "San Pablo (Poblacion)", "San Roque",
  "San Vicente (Poblacion)", "Santa Cruz (Poblacion)", "Santa Fe", "Salingogon",
  "Sibobo", "Tanauan", "Tomagodtod", "Union",
];

const STEPS = [
  { num: 1, label: "Account Credentials" },
  { num: 2, label: "Personal Profile" },
  { num: 3, label: "Residency Verification" },
  { num: 4, label: "Data Privacy Consent" },
];

// ─── Password Strength ───────────────────────────────────────

function getPasswordStrength(pwd: string) {
  if (!pwd) return { score: 0, label: "", color: "bg-gray-200", textColor: "text-gray-400" };
  let s = 0;
  if (pwd.length >= 8) s++;
  if (pwd.length >= 12) s++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  if (s <= 1) return { score: 1, label: "Weak", color: "bg-red-500", textColor: "text-red-600" };
  if (s === 2) return { score: 2, label: "Fair", color: "bg-amber-500", textColor: "text-amber-600" };
  if (s === 3) return { score: 3, label: "Good", color: "bg-yellow-500", textColor: "text-yellow-600" };
  if (s === 4) return { score: 4, label: "Strong", color: "bg-green-500", textColor: "text-green-700" };
  return { score: 5, label: "Very Strong", color: "bg-emerald-600", textColor: "text-emerald-700" };
}

// ─── Step Indicator ──────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-4 left-0 right-0 h-px bg-gray-200 z-0" />
        <div
          className="absolute top-4 left-0 h-px bg-blue-700 z-0 transition-all duration-500"
          style={{ width: `${((current - 1) / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map(step => {
          const done = current > step.num;
          const active = current === step.num;
          return (
            <div key={step.num} className="flex flex-col items-center z-10 gap-2">
              <div
                className={`size-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                  done
                    ? "bg-blue-700 border-blue-700 text-white"
                    : active
                    ? "bg-white border-blue-700 text-blue-700"
                    : "bg-white border-gray-300 text-gray-400"
                }`}
              >
                {done ? <Check className="size-4" /> : step.num}
              </div>
              <span
                className={`text-xs font-medium text-center leading-tight max-w-[72px] hidden sm:block ${
                  active ? "text-blue-700" : done ? "text-blue-600" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Field Wrapper ───────────────────────────────────────────

function Field({ label, required, error, hint, children }: {
  label: string; required?: boolean; error?: string; hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-black">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-gray-500 leading-relaxed">{hint}</p>}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1.5">
          <AlertCircle className="size-3.5 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Barangay Dropdown ───────────────────────────────────────

function BarangaySelect({ value, onChange, error }: {
  value: string; onChange: (v: string) => void; error?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = BARANGAYS.filter(b => b.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function select(b: string) { onChange(b); setSearch(""); setOpen(false); }
  function clear() { onChange(""); setSearch(""); }

  return (
    <div className="relative" ref={ref}>
      <div
        className={`flex items-center h-10 rounded-lg border text-sm cursor-pointer transition-colors ${
          error ? "border-red-400 bg-red-50" : "border-gray-300 bg-white hover:border-gray-400"
        } ${open ? "ring-2 ring-blue-400 border-blue-400" : ""}`}
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            onClick={e => e.stopPropagation()}
            placeholder="Type to search barangay..."
            className="flex-1 px-3 bg-transparent outline-none text-sm text-black"
          />
        ) : (
          <span className={`flex-1 px-3 truncate ${value ? "text-black" : "text-gray-400"}`}>
            {value || "Select your barangay"}
          </span>
        )}
        <div className="flex items-center gap-1 pr-2">
          {value && !open && (
            <button type="button" onClick={e => { e.stopPropagation(); clear(); }} className="p-0.5 hover:bg-gray-100 rounded">
              <X className="size-3.5 text-gray-400" />
            </button>
          )}
          {/* Rotates when open, but dropdown box always opens below (top-full) */}
          <ChevronDown className={`size-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </div>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-30 overflow-hidden">
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-sm text-gray-400 text-center">No barangay found</div>
            ) : (
              filtered.map(b => (
                <button key={b} type="button" onClick={() => select(b)}
                  className={`w-full text-left px-3 py-2.5 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center justify-between ${
                    value === b ? "bg-blue-50 text-blue-700 font-medium" : "text-black"
                  }`}>
                  {b}
                  {value === b && <Check className="size-3.5" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Upload Card ─────────────────────────────────────────────

function UploadCard({ label, hint, file, onFileChange, error }: {
  label: string; hint: string; file: File | null;
  onFileChange: (f: File | null) => void; error?: string;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File | null) {
    if (!f) return;
    if (!["image/jpeg", "image/png"].includes(f.type)) return;
    onFileChange(f);
    if (f.type.startsWith("image/")) setPreview(URL.createObjectURL(f));
    else setPreview(null);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0]; if (f) handleFile(f);
  }, []);

  function remove() { onFileChange(null); setPreview(null); if (inputRef.current) inputRef.current.value = ""; }

  return (
    <div className="flex flex-col gap-1.5 h-full">
      <label className="text-sm font-semibold text-black">
        {label} <span className="text-red-500">*</span>
      </label>
      {!file ? (
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors h-full flex flex-col justify-center ${
            isDragging ? "border-blue-400 bg-blue-50"
            : error ? "border-red-300 bg-red-50 hover:border-red-400"
            : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50"
          }`}
        >
          <Upload className={`size-7 mx-auto mb-1.5 ${isDragging ? "text-blue-500" : "text-gray-400"}`} />
          <p className="text-sm font-medium text-black">Drag &amp; drop or <span className="text-blue-600 underline">browse</span></p>
          <p className="text-xs text-gray-400 mt-0.5">JPG, PNG only</p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl p-3 bg-green-50 flex items-center gap-3 h-full">
          {preview ? (
            <img src={preview} alt="Preview" className="size-12 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
          ) : (
            <div className="size-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <FileText className="size-5 text-blue-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-green-900 truncate">{file.name}</p>
            <p className="text-xs text-gray-600 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
            <div className="flex items-center gap-1 mt-0.5 text-xs text-green-800"><Check className="size-3" /> Attached</div>
          </div>
          <button type="button" onClick={remove} className="p-1.5 hover:bg-red-100 rounded-lg flex-shrink-0">
            <X className="size-4 text-red-500" />
          </button>
        </div>
      )}
      <p className="text-xs text-gray-500 leading-relaxed mt-1">{hint}</p>
      {error && <p className="text-xs text-red-600 flex items-center gap-1.5 mt-1"><AlertCircle className="size-3.5 flex-shrink-0" />{error}</p>}
      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png" className="hidden"
        onChange={e => handleFile(e.target.files?.[0] ?? null)} />
    </div>
  );
}

// ─── Success Modal ───────────────────────────────────────────

function SuccessModal({ onBack, barangay }: { onBack: () => void; barangay: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-green-600 px-6 py-5 text-center">
          <div className="size-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="size-9 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Libre Franklin', sans-serif" }}>
            Registration Submitted Successfully
          </h2>
        </div>
        <div className="p-6 text-center space-y-4">
          <p className="text-sm text-black leading-relaxed">
            Your account registration has been submitted for verification by <strong>Barangay {barangay || "personnel"}</strong>.
          </p>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-left space-y-2">
            <p className="text-xs text-blue-900 font-semibold">What happens next?</p>
            <ul className="space-y-1.5 text-xs text-blue-900">
              {[
                "Barangay personnel will review your submitted documents.",
                "Your residency in Calabanga will be verified.",
                "You will receive updates via your registered mobile number and email address.",
                "Once approved, you can log in and access MSWD programs and services.",
              ].map(t => (
                <li key={t} className="flex items-start gap-2">
                  <Check className="size-3.5 mt-0.5 flex-shrink-0 text-blue-600" />{t}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-gray-500">Processing time is typically 3–5 working days.</p>
          <button onClick={onBack} className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-xl transition-colors">
            Return to Website
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Registration Page ──────────────────────────────────

export function RegistrationPage({ onBack, onLogin }: {
  onBack: () => void;
  onLogin: () => void;
}) {
  const [step, setStep] = useState(1);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  // Step 1: Pre-filled dummy data
  const [email, setEmail] = useState("maria.santos.reyes@gmail.com");
  const [password, setPassword] = useState("SecureP@ssw0rd!");
  const [confirmPassword, setConfirmPassword] = useState("SecureP@ssw0rd!");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Step 2: Pre-filled dummy data
  const [firstName, setFirstName] = useState("Maria");
  const [middleName, setMiddleName] = useState("Santos");
  const [lastName, setLastName] = useState("Reyes");
  const [extensionName, setExtensionName] = useState("");
  const [birthdate, setBirthdate] = useState("1988-10-14");
  const [gender, setGender] = useState("Female");
  const [mobile, setMobile] = useState("09171234567");
  const [profileEmail, setProfileEmail] = useState("maria.santos.reyes@gmail.com");

  // Step 3: Pre-filled dummy data
  const [barangay, setBarangay] = useState("San Juan");
  const [address, setAddress] = useState("123 Mabini St., Zone 3");
  
  const [govIdType, setGovIdType] = useState("National ID"); 
  const [residencyType, setResidencyType] = useState("Barangay Certificate of Residency");
  
  const [govIdFile, setGovIdFile] = useState<File | null>(null);
  const [barangayCertFile, setBarangayCertFile] = useState<File | null>(null);

  // Step 4: Pre-filled dummy data
  const [privacyConsent, setPrivacyConsent] = useState(true);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const strength = getPasswordStrength(password);

  function scrollToTop() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function validateStep(s: number): Record<string, string> {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!email.trim()) e.email = "Email or username is required.";
      else if (email.includes("@") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        e.email = "Enter a valid email address.";
      if (!password) e.password = "Password is required.";
      else if (password.length < 8) e.password = "Password must be at least 8 characters.";
      if (!confirmPassword) e.confirmPassword = "Please confirm your password.";
      else if (password !== confirmPassword) e.confirmPassword = "Passwords do not match.";
    }
    if (s === 2) {
      if (!firstName.trim()) e.firstName = "First name is required.";
      if (!lastName.trim()) e.lastName = "Last name is required.";
      if (!birthdate) e.birthdate = "Birthdate is required.";
      if (!gender) e.gender = "Please select your gender.";
      if (!mobile.trim()) e.mobile = "Mobile number is required.";
      else if (!/^09\d{9}$/.test(mobile.trim())) e.mobile = "Enter a valid Philippine mobile number (09XXXXXXXXX).";
      
      if (!profileEmail.trim()) e.profileEmail = "Email address is required.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileEmail)) e.profileEmail = "Enter a valid email address.";
    }
    if (s === 3) {
      if (!barangay) e.barangay = "Please select your barangay.";
      if (!address.trim()) e.address = "Zone / Sitio / Street address is required.";
      
      if (!govIdType) e.govIdType = "Please select a valid government ID.";
      else if (!govIdFile) e.govId = "Please upload your selected government ID.";
      
      if (!residencyType) e.residencyType = "Please select a proof of residency document.";
      else if (!barangayCertFile) e.barangayCert = "Please upload your selected proof of residency.";
    }
    return e;
  }

  function handleNext() {
    const errs = validateStep(step);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setStep(s => s + 1);
    scrollToTop();
  }

  function handleBack() {
    setErrors({});
    setStep(s => s - 1);
    scrollToTop();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!privacyConsent) return;
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1600));
    setIsSubmitting(false);
    setShowSuccess(true);
  }

  function clearError(key: string) {
    if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  }

  const inputCls = (err?: boolean) =>
    `h-10 w-full px-3 rounded-lg border text-sm text-black transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${
      err ? "border-red-400 bg-red-50" : "border-gray-300 hover:border-gray-400 bg-white"
    }`;

  const hasErrors = Object.keys(errors).length > 0;

  return (
  <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Source Sans 3', system-ui, sans-serif" }}>
    {/* Navbar */}
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="bg-blue-900 text-white">
        <div className="w-full px-4 py-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs text-blue-200">
            <Globe className="size-3" />
            Republic of the Philippines — Municipality of Calabanga, Camarines Sur
          </span>
          <span className="hidden sm:flex items-center gap-4 text-xs text-blue-300">
            <span className="flex items-center gap-1.5">
              <Clock className="size-3" />
              Mon–Fri 8:00 AM–5:00 PM
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="size-3" />
              (054) 871-1234
            </span>
          </span>
        </div>
      </div>

      <nav className="w-full px-4 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between h-16">
          <button onClick={onBack} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="size-10 rounded-full bg-blue-900 flex items-center justify-center flex-shrink-0">
              <Shield className="size-5 text-white" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-blue-900 leading-tight" style={{ fontFamily: "'Libre Franklin', sans-serif" }}>
                MSWD Calabanga
              </div>
              <div className="text-xs text-gray-500 leading-tight hidden sm:block">
                Municipal Social Welfare &amp; Development
              </div>
            </div>
          </button>

          <div className="hidden md:flex items-center gap-1">
            <button onClick={onBack} className="px-4 py-2 text-sm font-medium text-black hover:text-blue-700 hover:bg-gray-50 rounded-md transition-colors">Home</button>
            <button onClick={onBack} className="px-4 py-2 text-sm font-medium text-black hover:text-blue-700 hover:bg-gray-50 rounded-md transition-colors">About Us</button>
            <button onClick={onBack} className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-black hover:text-blue-700 hover:bg-gray-50 rounded-md transition-colors">
              Services <ChevronDown className="size-4" />
            </button>
            <button className="ml-1 px-5 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg cursor-default">Register</button>
            <button onClick={onLogin} className="px-4 py-2 text-sm font-medium text-black hover:text-blue-700 hover:bg-gray-50 rounded-md transition-colors">Login</button>
          </div>

          <button onClick={() => setMobileNavOpen(!mobileNavOpen)} className="md:hidden p-2 text-black hover:bg-gray-100 rounded-lg">
            {mobileNavOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {mobileNavOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1 pb-4">
            <button onClick={onBack} className="w-full text-left px-4 py-2.5 text-sm font-medium text-black hover:bg-gray-50 rounded-lg">Home</button>
            <button onClick={onBack} className="w-full text-left px-4 py-2.5 text-sm font-medium text-black hover:bg-gray-50 rounded-lg">About Us</button>
            <button onClick={onBack} className="w-full text-left px-4 py-2.5 text-sm font-medium text-black hover:bg-gray-50 rounded-lg">Services</button>
            <div className="pt-2 px-1 flex flex-col gap-2">
              <button className="w-full py-2.5 text-sm font-semibold text-white bg-blue-700 rounded-lg cursor-default">Register</button>
              <button onClick={onLogin} className="w-full py-2.5 text-sm font-semibold text-black hover:text-blue-700 hover:bg-gray-50 rounded-lg transition-colors">Login to Portal</button>
            </div>
          </div>
        )}
      </nav>
    </header>

    <div className="bg-blue-900 text-white py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-2xl font-extrabold mb-1" style={{ fontFamily: "'Libre Franklin', sans-serif" }}>
          Beneficiary Registration &amp; Residency Verification
        </h1>
        <p className="text-blue-200 text-sm">
          Complete all steps to create your account. Barangay personnel will review and approve your registration.
        </p>
      </div>
    </div>

    <div className="bg-white border-b border-gray-200 py-5 px-4 sticky top-0 z-20 shadow-sm">
      <div className="max-w-3xl mx-auto">
        <StepIndicator current={step} />
      </div>
    </div>

    <form onSubmit={handleSubmit} noValidate>
      <div className="max-w-3xl mx-auto px-4 py-8" ref={formRef}>

        {hasErrors && (
          <div className="mb-5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
            <AlertCircle className="size-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">Please fix the following errors to continue:</p>
              <ul className="mt-1 space-y-0.5">
                {Object.values(errors).map((msg, i) => (
                  <li key={i} className="text-xs text-red-600">• {msg}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── Step 1: Account Credentials ── */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
            <div className="pb-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-blue-900" style={{ fontFamily: "'Libre Franklin', sans-serif" }}>
                Account Credentials
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Create your login credentials for future portal access.</p>
            </div>

            <Field label="Email Address or Username" required error={errors.email}>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <input type="text" value={email}
                  onChange={e => { setEmail(e.target.value); clearError("email"); }}
                  placeholder="your.email@example.com or username"
                  className={`h-10 w-full pl-9 pr-3 rounded-lg border text-sm text-black transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.email ? "border-red-400 bg-red-50" : "border-gray-300 hover:border-gray-400 bg-white"}`}
                />
              </div>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Password" required error={errors.password}>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <input type={showPassword ? "text" : "password"} value={password}
                    onChange={e => { setPassword(e.target.value); clearError("password"); }}
                    placeholder="Min. 8 characters"
                    className={`h-10 w-full pl-9 pr-10 rounded-lg border text-sm text-black transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.password ? "border-red-400 bg-red-50" : "border-gray-300 hover:border-gray-400 bg-white"}`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black">
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strength.score ? strength.color : "bg-gray-200"}`} />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${strength.textColor}`}>{strength.label}</p>
                  </div>
                )}
              </Field>

              <Field label="Confirm Password" required error={errors.confirmPassword}>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <input type={showConfirm ? "text" : "password"} value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); clearError("confirmPassword"); }}
                    placeholder="Re-enter password"
                    className={`h-10 w-full pl-9 pr-10 rounded-lg border text-sm text-black transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.confirmPassword ? "border-red-400 bg-red-50" : "border-gray-300 hover:border-gray-400 bg-white"}`}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black">
                    {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {confirmPassword && password === confirmPassword && !errors.confirmPassword && (
                  <p className="text-xs text-green-600 flex items-center gap-1.5 mt-1">
                    <Check className="size-3.5" /> Passwords match
                  </p>
                )}
              </Field>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-800">
              <strong>Tip:</strong> Use at least 8 characters with uppercase letters, numbers, and special characters for a stronger password.
            </div>
          </div>
        )}

        {/* ── Step 2: Personal Profile ── */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
            <div className="pb-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-blue-900" style={{ fontFamily: "'Libre Franklin', sans-serif" }}>Personal Profile</h2>
              <p className="text-xs text-gray-500 mt-0.5">Provide your personal information as it appears on your government ID.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="First Name" required error={errors.firstName}>
                <input type="text" value={firstName}
                  onChange={e => { setFirstName(e.target.value); clearError("firstName"); }}
                  placeholder="Juan" className={inputCls(!!errors.firstName)} />
              </Field>
              <Field label="Middle Name" hint="Optional">
                <input type="text" value={middleName} onChange={e => setMiddleName(e.target.value)}
                  placeholder="Santos" className={inputCls()} />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Last Name" required error={errors.lastName}>
                <input type="text" value={lastName}
                  onChange={e => { setLastName(e.target.value); clearError("lastName"); }}
                  placeholder="Dela Cruz" className={inputCls(!!errors.lastName)} />
              </Field>
              <Field label="Extension Name" hint="e.g., Jr., Sr., III — optional">
                <input type="text" value={extensionName} onChange={e => setExtensionName(e.target.value)}
                  placeholder="Jr." className={inputCls()} />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Birthdate" required error={errors.birthdate}>
                <input type="date" value={birthdate}
                  onChange={e => { setBirthdate(e.target.value); clearError("birthdate"); }}
                  className={inputCls(!!errors.birthdate)} />
              </Field>
              <Field label="Gender" required error={errors.gender}>
                <select
                  value={gender}
                  onChange={e => { setGender(e.target.value); clearError("gender"); }}
                  className={`h-10 w-full px-3 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none bg-white ${
                    errors.gender ? "border-red-400 bg-red-50" : "border-gray-300 hover:border-gray-400"
                  } ${!gender ? "text-gray-400" : "text-black"}`}
                >
                  <option value="" disabled className="text-gray-400">Select gender</option>
                  <option value="Male" className="text-black">Male</option>
                  <option value="Female" className="text-black">Female</option>
                  <option value="Prefer not to say" className="text-black">Prefer not to say</option>
                </select>
              </Field>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Mobile Number" required error={errors.mobile}
                hint="This will be used for SMS notifications and application status alerts.">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <input type="tel" value={mobile}
                    onChange={e => { setMobile(e.target.value); clearError("mobile"); }}
                    placeholder="09XXXXXXXXX" maxLength={11}
                    className={`h-10 w-full pl-9 pr-3 rounded-lg border text-sm text-black transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.mobile ? "border-red-400 bg-red-50" : "border-gray-300 hover:border-gray-400 bg-white"}`}
                  />
                </div>
              </Field>
              
              <Field label="Email Address" required error={errors.profileEmail}
                hint="Used for formal correspondence and account recovery.">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <input type="email" value={profileEmail}
                    onChange={e => { setProfileEmail(e.target.value); clearError("profileEmail"); }}
                    placeholder="your.email@example.com"
                    className={`h-10 w-full pl-9 pr-3 rounded-lg border text-sm text-black transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.profileEmail ? "border-red-400 bg-red-50" : "border-gray-300 hover:border-gray-400 bg-white"}`}
                  />
                </div>
              </Field>
            </div>
          </div>
        )}

        {/* ── Step 3: Residency Verification ── */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
            <div className="pb-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-blue-900" style={{ fontFamily: "'Libre Franklin', sans-serif" }}>Residency Verification</h2>
              <p className="text-xs text-gray-500 mt-0.5">Verify that you are a legitimate resident of Calabanga, Camarines Sur.</p>
            </div>

            <Field label="Barangay" required error={errors.barangay}>
              <BarangaySelect value={barangay} onChange={v => { setBarangay(v); clearError("barangay"); }} error={!!errors.barangay} />
            </Field>

            <Field label="Zone / Sitio / Street Address" required error={errors.address}>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <input type="text" value={address}
                  onChange={e => { setAddress(e.target.value); clearError("address"); }}
                  placeholder="e.g., Zone 2, Sitio Pag-asa, 123 Rizal Street"
                  className={`h-10 w-full pl-9 pr-3 rounded-lg border text-sm text-black transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.address ? "border-red-400 bg-red-50" : "border-gray-300 hover:border-gray-400 bg-white"}`}
                />
              </div>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 border-t border-gray-100 pt-5 mt-2">
              <Field label="Valid Government ID" required error={errors.govIdType}>
                 <select
                   value={govIdType}
                   onChange={e => { setGovIdType(e.target.value); clearError("govIdType"); }}
                   className={`h-10 w-full px-3 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none bg-white ${
                     errors.govIdType ? "border-red-400 bg-red-50" : "border-gray-300 hover:border-gray-400"
                   } ${!govIdType ? "text-gray-400" : "text-black"}`}
                 >
                   <option value="" disabled className="text-gray-400">Select Government ID Type</option>
                   <option value="National ID" className="text-black">National ID</option>
                   <option value="Driver's License" className="text-black">Driver's License</option>
                   <option value="Passport" className="text-black">Passport</option>
                   <option value="UMID/SSS ID" className="text-black">UMID/SSS ID</option>
                   <option value="Postal ID" className="text-black">Postal ID</option>
                   <option value="PhilHealth ID" className="text-black">PhilHealth ID</option>
                   <option value="Senior Citizen ID" className="text-black">Senior Citizen ID</option>
                   <option value="PWD ID" className="text-black">PWD ID</option>
                   <option value="Solo Parent ID" className="text-black">Solo Parent ID</option>
                   <option value="Other Government-Issued IDs" className="text-black">Other Government-Issued IDs</option>
                 </select>
              </Field>

              <Field label="Proof of Residency" required error={errors.residencyType}>
                 <select
                   value={residencyType}
                   onChange={e => { setResidencyType(e.target.value); clearError("residencyType"); }}
                   className={`h-10 w-full px-3 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none bg-white ${
                     errors.residencyType ? "border-red-400 bg-red-50" : "border-gray-300 hover:border-gray-400"
                   } ${!residencyType ? "text-gray-400" : "text-black"}`}
                 >
                   <option value="" disabled className="text-gray-400">Select Residency Document</option>
                   <option value="Barangay Certificate of Residency" className="text-black">Barangay Certificate of Residency</option>
                   <option value="Barangay Clearance" className="text-black">Barangay Clearance</option>
                   <option value="Barangay ID" className="text-black">Barangay ID</option>
                   <option value="Voter's Certification" className="text-black">Voter's Certification</option>
                   <option value="Utility Bill with Calabanga Address" className="text-black">Utility Bill with Calabanga Address</option>
                 </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {govIdType ? (
                <UploadCard
                  label={`Upload ${govIdType}`}
                  hint="Clear photo of your selected valid government ID."
                  file={govIdFile}
                  onFileChange={f => { setGovIdFile(f); clearError("govId"); }}
                  error={errors.govId}
                />
              ) : (
                <div className="hidden sm:block"></div>
              )}
              
              {residencyType ? (
                <UploadCard
                  label={`Upload ${residencyType}`}
                  hint="Clear photo of your selected proof of residency."
                  file={barangayCertFile}
                  onFileChange={f => { setBarangayCertFile(f); clearError("barangayCert"); }}
                  error={errors.barangayCert}
                />
              ) : (
                <div className="hidden sm:block"></div>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="size-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 leading-relaxed">
                <strong>Important:</strong> Documents will be reviewed by Barangay personnel. Ensure they are clear and legible. Submission of falsified documents is punishable by law.
              </p>
            </div>
          </div>
        )}

        {/* ── Step 4: Data Privacy Consent ── */}
        {step === 4 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
            <div className="pb-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-blue-900" style={{ fontFamily: "'Libre Franklin', sans-serif" }}>Data Privacy Consent</h2>
              <p className="text-xs text-gray-500 mt-0.5">Read and accept the MSWD data privacy notice before submitting.</p>
            </div>

            <div className="bg-blue-950 rounded-xl p-5 text-white">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                <Shield className="size-4 text-blue-300" /> Data Privacy Notice
              </h3>
              <div className="text-xs text-blue-200 leading-relaxed space-y-2">
                <p>In compliance with <strong className="text-white">Republic Act No. 10173 (Data Privacy Act of 2012)</strong>, the MSWD of Calabanga is committed to protecting your personal information.</p>
                <p>The personal data you provide — including your name, address, contact details, government ID, and supporting documents — will be collected, processed, and stored solely for verifying your identity, residency, and eligibility for MSWD programs and services.</p>
                <p>Your information will be treated with strict confidentiality and will only be accessible to authorized MSWD personnel. It will not be shared with third parties without your consent, except as required by law.</p>
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer group">
              <div
                onClick={() => setPrivacyConsent(!privacyConsent)}
                className={`mt-0.5 size-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                  privacyConsent ? "bg-blue-700 border-blue-700" : "bg-white border-gray-400 group-hover:border-blue-400"
                }`}
              >
                {privacyConsent && <Check className="size-3 text-white" />}
              </div>
              <span className="text-sm text-black leading-relaxed">
                I agree that MSWD Calabanga may collect, process, store, and verify my submitted information and supporting documents in accordance with the Data Privacy Act of 2012 and applicable government regulations.
              </span>
            </label>

            {!privacyConsent && (
              <p className="text-xs text-gray-500 text-center">You must accept the privacy notice before submitting.</p>
            )}
          </div>
        )}

        {/* ── Navigation Buttons ── */}
        <div className="mt-6 flex justify-end gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-black bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="size-4" /> Previous
            </button>
          )}
          {step < 4 && (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors shadow-sm"
            >
              Next <ChevronRight className="size-4" />
            </button>
          )}
          {step === 4 && (
            <button
              type="submit"
              disabled={!privacyConsent || isSubmitting}
              className={`flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                !privacyConsent
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : isSubmitting
                  ? "bg-blue-400 text-white cursor-not-allowed"
                  : "bg-blue-700 hover:bg-blue-800 text-white shadow-sm"
              }`}
              style={{ fontFamily: "'Libre Franklin', sans-serif" }}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin size-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </>
              ) : (
                <>Submit Registration <Check className="size-4" /></>
              )}
            </button>
          )}
        </div>

      </div>
    </form>

    {showSuccess && <SuccessModal onBack={onBack} barangay={barangay} />}
  </div>
  );
}