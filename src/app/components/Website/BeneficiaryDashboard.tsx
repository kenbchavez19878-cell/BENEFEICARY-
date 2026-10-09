import { useState } from "react";
import { toast } from "sonner";
import {
  Shield,
  LogOut,
  LayoutDashboard,
  FileText,
  FolderOpen,
  Settings,
  Bell,
  ChevronDown,
  UserCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Eye,
  Download,
  Upload,
  Heart,
  Users,
  Briefcase,
  AlertTriangle,
  Send,
  CheckCircle,
  X,
  Menu,
  FileCheck,
  Search,
  Building,
  User,
  Phone,
  Mail,
  Lock,
} from "lucide-react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { LogoutConfirmDialog } from "../LogoutConfirmDialog";
import { NotificationDropdown } from "../NotificationDropdown";
import { getBeneficiaryById, BENEFICIARY_ACCOUNTS, type BeneficiaryAccount } from "../../data/beneficiaryAccounts";

interface BeneficiaryDashboardProps {
  userRole?: string;
  accountId?: string;
  onLogout: () => void;
  onNavigateToRegister?: () => void;
  accountStatus?: "approved" | "pending" | "denied";
}

type TabType = "dashboard" | "services" | "transactions" | "documents" | "settings";

interface ServiceApplication {
  id: string;
  appNo: string;
  serviceName: string;
  category: string;
  dateSubmitted: string;
  status: "Pending" | "Under Review" | "Approved" | "Rejected" | "Completed";
  notes?: string;
  amount?: string;
}

const MOCK_TRANSACTIONS: ServiceApplication[] = [
  {
    id: "app-101",
    appNo: "APP-2026-0891",
    serviceName: "AICS — Medical Assistance",
    category: "Emergency & Crisis",
    dateSubmitted: "2026-09-28",
    status: "Approved",
    amount: "₱5,000.00",
    notes: "Approved by MSWD Head. Ready for payout pick-up at Municipal Treasury.",
  },
  {
    id: "app-102",
    appNo: "APP-2026-0742",
    serviceName: "Solo Parent Identification & Benefit Card",
    category: "Sectoral Services",
    dateSubmitted: "2026-09-15",
    status: "Under Review",
    notes: "Documents undergoing verification by Barangay Secretary.",
  },
  {
    id: "app-103",
    appNo: "APP-2026-0510",
    serviceName: "Disaster Emergency Relief Pack",
    category: "Emergency & Crisis",
    dateSubmitted: "2026-08-10",
    status: "Completed",
    notes: "Relief goods claim claimed at Brgy. San Juan Multi-Purpose Hall.",
  },
];

interface UserDocument {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  status: "Verified" | "Pending Review" | "Rejected";
  size: string;
}

const INITIAL_DOCUMENTS: UserDocument[] = [
  {
    id: "doc-1",
    name: "Barangay_Certificate_Residency.pdf",
    type: "Barangay Certificate of Residency",
    uploadDate: "2026-09-01",
    status: "Verified",
    size: "1.2 MB",
  },
  {
    id: "doc-2",
    name: "Valid_Government_ID_PhilSys.pdf",
    type: "Government Issued ID",
    uploadDate: "2026-09-01",
    status: "Verified",
    size: "2.4 MB",
  },
  {
    id: "doc-3",
    name: "Certificate_of_Indigency.pdf",
    type: "Certificate of Indigency",
    uploadDate: "2026-09-15",
    status: "Verified",
    size: "890 KB",
  },
];

export function BeneficiaryDashboard({
  userRole = "Beneficiary",
  accountId = "ben-001",
  onLogout,
  onNavigateToRegister,
  accountStatus = "approved",
}: BeneficiaryDashboardProps) {
  // Account fetch
  const beneficiaryAccount: BeneficiaryAccount =
    getBeneficiaryById(accountId) || BENEFICIARY_ACCOUNTS[0];

  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [transactions, setTransactions] = useState<ServiceApplication[]>(MOCK_TRANSACTIONS);
  const [documents, setDocuments] = useState<UserDocument[]>(INITIAL_DOCUMENTS);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);

  // Application Modal state
  const [applyingService, setApplyingService] = useState<{
    name: string;
    category: string;
    requirements: string[];
  } | null>(null);
  const [applicationForm, setApplicationForm] = useState({
    purpose: "",
    contactNo: beneficiaryAccount.mobile,
    remarks: "",
  });
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);

  // Document Upload modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadDocType, setUploadDocType] = useState("Supporting Document");
  const [uploadFileName, setUploadFileName] = useState("");

  // Profile Settings form
  const [profileData, setProfileData] = useState({
    fullName: beneficiaryAccount.name,
    mobile: beneficiaryAccount.mobile,
    email: beneficiaryAccount.email,
    barangay: beneficiaryAccount.barangay,
  });

  // Verify Role: If role is not Beneficiary or account denied/pending
  const isBeneficiaryRole =
    !userRole ||
    userRole.toLowerCase().includes("beneficiary") ||
    userRole === "Resident";

  if (!isBeneficiaryRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-6 bg-white shadow-xl rounded-2xl border border-red-100">
          <div className="size-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="size-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 text-sm mb-6">
            This dashboard is strictly reserved for verified beneficiaries and residents.
          </p>
          <Button onClick={onLogout} className="w-full bg-blue-900 hover:bg-blue-800 text-white">
            Return to Login
          </Button>
        </Card>
      </div>
    );
  }

  if (accountStatus === "pending") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full p-8 bg-white shadow-xl rounded-2xl border border-blue-100 text-center">
          <div className="size-20 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
            <Clock className="size-10 text-amber-600 animate-pulse" />
          </div>
          <Badge className="bg-amber-100 text-amber-800 border-amber-300 mb-3 px-3 py-1">
            Verification Pending
          </Badge>
          <h2 className="text-2xl font-extrabold text-blue-900 mb-2">Account Review Underway</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-6">
            Your registration is currently under review by MSWD Calabanga. Please wait for official
            approval from our municipal officers before accessing portal services.
          </p>
          <div className="bg-gray-50 rounded-xl p-4 text-left border border-gray-200 text-xs text-gray-700 space-y-2 mb-6">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-500">Applicant Name:</span>
              <span className="font-medium text-gray-900">{beneficiaryAccount.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-500">Reference ID:</span>
              <span className="font-mono text-blue-700">{beneficiaryAccount.beneficiaryId}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-500">Barangay:</span>
              <span>{beneficiaryAccount.barangay}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-500">Documents Status:</span>
              <span className="text-amber-600 font-semibold">Under Inspection</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onLogout} className="flex-1">
              Logout
            </Button>
            {onNavigateToRegister && (
              <Button onClick={onNavigateToRegister} className="flex-1 bg-blue-900 hover:bg-blue-800">
                Check Registration
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingService) return;
    setIsSubmittingApp(true);

    setTimeout(() => {
      const newApp: ServiceApplication = {
        id: `app-${Date.now()}`,
        appNo: `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        serviceName: applyingService.name,
        category: applyingService.category,
        dateSubmitted: new Date().toISOString().split("T")[0],
        status: "Pending",
        notes: "Application received and submitted to MSWD Calabanga intake unit.",
      };
      setTransactions([newApp, ...transactions]);
      setIsSubmittingApp(false);
      setApplyingService(null);
      setApplicationForm({ purpose: "", contactNo: beneficiaryAccount.mobile, remarks: "" });
      toast.success("Application Submitted Successfully!", {
        description: `Your tracking code is ${newApp.appNo}. You can monitor progress under My Transactions.`,
      });
      setActiveTab("transactions");
    }, 1200);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFileName.trim()) {
      toast.error("Please provide a file name");
      return;
    }
    const newDoc: UserDocument = {
      id: `doc-${Date.now()}`,
      name: uploadFileName.endsWith(".pdf") ? uploadFileName : `${uploadFileName}.pdf`,
      type: uploadDocType,
      uploadDate: new Date().toISOString().split("T")[0],
      status: "Pending Review",
      size: "1.5 MB",
    };
    setDocuments([newDoc, ...documents]);
    setShowUploadModal(false);
    setUploadFileName("");
    toast.success("Document Uploaded!", {
      description: "File uploaded successfully and submitted for validation.",
    });
  };

  const SERVICE_CATEGORIES = [
    {
      id: "sectoral",
      title: "Sectoral Social Welfare",
      icon: Users,
      color: "bg-blue-50 text-blue-700 border-blue-200",
      description: "Specialized assistance programs for solo parents, PWDs, seniors, and youth.",
      services: [
        {
          name: "Differently Abled Persons (PWD) Services & Benefit Card",
          category: "Sectoral Services",
          requirements: ["Government ID / Birth Cert", "Medical Certificate / Disability Proof", "Barangay Indigency"],
        },
        {
          name: "Women & Solo Parent Identification & Program Intake",
          category: "Sectoral Services",
          requirements: ["Barangay Solo Parent Certificate", "Birth Certificate of Children", "Proof of Income"],
        },
        {
          name: "Senior Citizen Welfare & Assistance",
          category: "Sectoral Services",
          requirements: ["60+ Proof of Age", "Barangay Residency Certificate", "2x2 ID Photo"],
        },
        {
          name: "Child & Youth CICL / DayCare Intake",
          category: "Sectoral Services",
          requirements: ["Child Birth Certificate", "Barangay Clearance", "Parent/Guardian ID"],
        },
      ],
    },
    {
      id: "emergency",
      title: "Emergency & Crisis Assistance",
      icon: Heart,
      color: "bg-red-50 text-red-700 border-red-200",
      description: "Immediate relief, medical, burial, and disaster emergency support.",
      services: [
        {
          name: "AICS — Medical Assistance",
          category: "Emergency & Crisis",
          requirements: ["Clinical Abstract / Medical Certificate", "Hospital Bill / Quotation", "Barangay Indigency"],
        },
        {
          name: "AICS — Funeral & Burial Assistance",
          category: "Emergency & Crisis",
          requirements: ["Death Certificate", "Funeral Contract", "Barangay Indigency"],
        },
        {
          name: "AICS — Emergency Financial / Transportation Support",
          category: "Emergency & Crisis",
          requirements: ["Barangay Certificate", "Incident Report / Travel Purpose", "Valid ID"],
        },
        {
          name: "Disaster Emergency Relief & Shelter Repair Assistance",
          category: "Emergency & Crisis",
          requirements: ["Barangay Disaster Incident Report", "Photos of Damaged House", "Valid ID"],
        },
      ],
    },
    {
      id: "livelihood",
      title: "Employment & Livelihood",
      icon: Briefcase,
      color: "bg-amber-50 text-amber-700 border-amber-200",
      description: "TUPAD, DOLE Livelihood Grants, Job Fair Registration, and skill training.",
      services: [
        {
          name: "DOLE Livelihood Grant Application",
          category: "Employment & Livelihood",
          requirements: ["Business / Project Proposal", "Barangay Indigency", "Valid ID"],
        },
        {
          name: "TUPAD Community Emergency Employment Intake",
          category: "Employment & Livelihood",
          requirements: ["Barangay Residency", "PhilSys / Valid ID", "Undertaking Form"],
        },
        {
          name: "Municipal Job Fair & Local Placement",
          category: "Employment & Livelihood",
          requirements: ["Updated Resume / Bio-Data", "Barangay Clearance"],
        },
      ],
    },
    {
      id: "ofw",
      title: "OFW & OWWA Support",
      icon: Building,
      color: "bg-teal-50 text-teal-700 border-teal-200",
      description: "Reintegration programs, repatriation assistance, and OFW family support.",
      services: [
        {
          name: "OFW Profiling & Dependent Assistance",
          category: "OFW & OWWA Support",
          requirements: ["OFW Passport copy", "OEC / Overseas Employment Contract", "Proof of Relationship"],
        },
        {
          name: "OWWA Reintegration Grant Intake",
          category: "OFW & OWWA Support",
          requirements: ["OWWA Membership Record", "Proof of Repatriation / Return", "Business Plan"],
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* ── Government Header Top Bar ── */}
      <header className="sticky top-0 z-50 bg-blue-900 text-white shadow-md">
        <div className="bg-blue-950 text-blue-200 px-4 py-1.5 text-xs flex justify-between items-center border-b border-blue-800">
          <div className="flex items-center gap-2">
            <Shield className="size-3.5 text-blue-400" />
            <span>Republic of the Philippines — Municipality of Calabanga, Camarines Sur</span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-blue-300">
            <span>MSWD Official Client Portal</span>
            <span>Helpline: (054) 871-1234</span>
          </div>
        </div>

        {/* Main Navbar */}
        <div className="w-full px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo Brand */}
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-blue-700 border border-blue-500 flex items-center justify-center shadow-inner">
                <Shield className="size-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-extrabold tracking-tight text-white leading-none">
                  MSWD Calabanga
                </h1>
                <span className="text-xs text-blue-300 leading-none">Client & Resident Portal</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  activeTab === "dashboard"
                    ? "bg-blue-800 text-white shadow"
                    : "text-blue-100 hover:bg-blue-800/60"
                }`}
              >
                <LayoutDashboard className="size-4" />
                My Dashboard
              </button>

              {/* Mega Dropdown for Apply for Service */}
              <div className="relative">
                <button
                  onClick={() => setServicesDropdownOpen(!servicesDropdownOpen)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    activeTab === "services"
                      ? "bg-blue-800 text-white shadow"
                      : "text-blue-100 hover:bg-blue-800/60"
                  }`}
                >
                  <PlusCircle className="size-4 text-emerald-400" />
                  Apply for Service
                  <ChevronDown className="size-3.5 text-blue-300" />
                </button>

                {servicesDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setServicesDropdownOpen(false)}
                    />
                    <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
                      <div className="px-3 py-1.5 border-b border-gray-100">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          MSWD Assistance Programs
                        </p>
                      </div>
                      {SERVICE_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setSelectedCategory(cat.id);
                            setActiveTab("services");
                            setServicesDropdownOpen(false);
                          }}
                          className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-blue-50 transition-colors text-left"
                        >
                          <cat.icon className="size-4 text-blue-700 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-gray-900">{cat.title}</p>
                            <p className="text-[11px] text-gray-500 line-clamp-1">{cat.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setActiveTab("transactions")}
                className={`flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  activeTab === "transactions"
                    ? "bg-blue-800 text-white shadow"
                    : "text-blue-100 hover:bg-blue-800/60"
                }`}
              >
                <FileText className="size-4" />
                My Transactions
                {transactions.length > 0 && (
                  <Badge className="bg-emerald-500 text-white text-[10px] h-4 px-1.5">
                    {transactions.length}
                  </Badge>
                )}
              </button>

              <button
                onClick={() => setActiveTab("documents")}
                className={`flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  activeTab === "documents"
                    ? "bg-blue-800 text-white shadow"
                    : "text-blue-100 hover:bg-blue-800/60"
                }`}
              >
                <FolderOpen className="size-4" />
                Digital Documents
              </button>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              <NotificationDropdown dark />

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-blue-800/60 transition-colors"
                >
                  <Avatar className="size-8 border border-blue-400">
                    <AvatarFallback className="bg-emerald-600 text-white text-xs font-bold">
                      {beneficiaryAccount.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold text-white leading-tight">
                      {beneficiaryAccount.name}
                    </p>
                    <p className="text-[10px] text-blue-300 leading-tight">
                      {beneficiaryAccount.barangay}
                    </p>
                  </div>
                  <ChevronDown className="size-3.5 text-blue-300" />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 py-1.5 z-50">
                      <div className="px-4 py-2.5 border-b border-gray-100">
                        <p className="text-xs font-bold text-gray-900 truncate">
                          {beneficiaryAccount.name}
                        </p>
                        <p className="text-[10px] text-emerald-600 font-medium">
                          ✓ Verified Resident Beneficiary
                        </p>
                        <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                          {beneficiaryAccount.beneficiaryId}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab("settings");
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <Settings className="size-3.5 text-gray-500" />
                        Account Settings
                      </button>
                      <div className="border-t border-gray-100 my-1" />
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          setShowLogoutDialog(true);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="size-3.5" />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
                className="lg:hidden p-2 text-white hover:bg-blue-800 rounded-lg"
              >
                {mobileNavOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav Menu */}
        {mobileNavOpen && (
          <div className="lg:hidden bg-blue-950 px-4 py-3 border-t border-blue-800 space-y-1">
            <button
              onClick={() => {
                setActiveTab("dashboard");
                setMobileNavOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-white rounded-lg hover:bg-blue-900"
            >
              <LayoutDashboard className="size-4" />
              My Dashboard
            </button>
            <button
              onClick={() => {
                setActiveTab("services");
                setMobileNavOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-white rounded-lg hover:bg-blue-900"
            >
              <PlusCircle className="size-4 text-emerald-400" />
              Apply for Service
            </button>
            <button
              onClick={() => {
                setActiveTab("transactions");
                setMobileNavOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-white rounded-lg hover:bg-blue-900"
            >
              <FileText className="size-4" />
              My Transactions
            </button>
            <button
              onClick={() => {
                setActiveTab("documents");
                setMobileNavOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-white rounded-lg hover:bg-blue-900"
            >
              <FolderOpen className="size-4" />
              Digital Documents
            </button>
            <button
              onClick={() => {
                setActiveTab("settings");
                setMobileNavOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-white rounded-lg hover:bg-blue-900"
            >
              <Settings className="size-4" />
              Account Settings
            </button>
          </div>
        )}
      </header>

      {/* ── MAIN CONTENT TAB VIEWS ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* VIEW 1: MY DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Welcome Banner Card */}
            <Card className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white rounded-2xl shadow-lg border-0 overflow-hidden relative">
              <div className="p-6 sm:p-8 relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-semibold">
                      <UserCheck className="size-3.5" /> Verified Calabanga Resident
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                      Mabalos na Pag-abot, {beneficiaryAccount.firstName}!
                    </h2>
                    <p className="text-blue-200 text-sm max-w-2xl leading-relaxed">
                      Welcome to your official MSWD Calabanga Portal. Access community assistance,
                      track your applications in real-time, and manage your documents securely.
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 min-w-[220px] text-xs space-y-1.5">
                    <div className="flex justify-between text-blue-200">
                      <span>Beneficiary ID:</span>
                      <span className="font-mono text-white font-bold">{beneficiaryAccount.beneficiaryId}</span>
                    </div>
                    <div className="flex justify-between text-blue-200">
                      <span>Barangay:</span>
                      <span className="text-white font-semibold">{beneficiaryAccount.barangay}</span>
                    </div>
                    <div className="flex justify-between text-blue-200">
                      <span>Family Registry:</span>
                      <span className="text-white font-mono">{beneficiaryAccount.familyRegistryId}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card
                className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.01]"
                onClick={() => setActiveTab("transactions")}
              >
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase">Active Applications</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {transactions.filter((t) => t.status === "Pending" || t.status === "Under Review").length}
                    </p>
                    <p className="text-[11px] text-amber-600 font-medium mt-0.5">Currently processing</p>
                  </div>
                  <div className="size-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                    <Clock className="size-6" />
                  </div>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.01]"
                onClick={() => setActiveTab("transactions")}
              >
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase">Approved Services</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {transactions.filter((t) => t.status === "Approved" || t.status === "Completed").length}
                    </p>
                    <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Ready or completed</p>
                  </div>
                  <div className="size-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="size-6" />
                  </div>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.01]"
                onClick={() => setActiveTab("documents")}
              >
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase">Verified Documents</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {documents.filter((d) => d.status === "Verified").length}
                    </p>
                    <p className="text-[11px] text-blue-600 font-medium mt-0.5">Document wallet ready</p>
                  </div>
                  <div className="size-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                    <FileCheck className="size-6" />
                  </div>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.01]"
                onClick={() => setActiveTab("services")}
              >
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase">Available Services</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">13+</p>
                    <p className="text-[11px] text-purple-600 font-medium mt-0.5">Click to view & apply</p>
                  </div>
                  <div className="size-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                    <PlusCircle className="size-6" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Service Categories Quick Selector */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Apply for MSWD Services</h3>
                <Button
                  variant="ghost"
                  onClick={() => setActiveTab("services")}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-900"
                >
                  View All Services →
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {SERVICE_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <Card
                      key={cat.id}
                      className="hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200 group"
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setActiveTab("services");
                      }}
                    >
                      <CardContent className="p-5 space-y-3">
                        <div className={`size-10 rounded-lg flex items-center justify-center border ${cat.color}`}>
                          <Icon className="size-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                            {cat.title}
                          </h4>
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1">{cat.description}</p>
                        </div>
                        <div className="pt-2 text-xs font-bold text-blue-700 flex items-center gap-1">
                          Browse Programs →
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Recent Transactions & Announcements */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Transactions List */}
              <Card className="lg:col-span-2 border border-gray-200 shadow-sm">
                <CardHeader className="pb-3 border-b border-gray-100 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-gray-900">Recent Applications</CardTitle>
                    <CardDescription className="text-xs text-gray-500">Track current status of your requests</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("transactions")}
                    className="text-xs"
                  >
                    View All
                  </Button>
                </CardHeader>
                <CardContent className="p-0 divide-y divide-gray-100">
                  {transactions.slice(0, 4).map((app) => (
                    <div key={app.id} className="p-4 hover:bg-gray-50/80 transition-colors flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-900">{app.appNo}</span>
                          <Badge
                            className={
                              app.status === "Approved"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : app.status === "Under Review"
                                ? "bg-amber-100 text-amber-800 border-amber-300"
                                : app.status === "Completed"
                                ? "bg-blue-100 text-blue-800 border-blue-300"
                                : "bg-gray-100 text-gray-700"
                            }
                          >
                            {app.status}
                          </Badge>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{app.serviceName}</p>
                        <p className="text-xs text-gray-500">{app.notes}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-400">{app.dateSubmitted}</p>
                        {app.amount && <p className="text-xs font-bold text-emerald-700 mt-1">{app.amount}</p>}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Announcements Sidebar */}
              <Card className="border border-gray-200 shadow-sm bg-gradient-to-b from-blue-50/40 to-white">
                <CardHeader className="pb-3 border-b border-gray-100">
                  <CardTitle className="text-base font-bold text-blue-950 flex items-center gap-2">
                    <Bell className="size-4 text-blue-700" /> MSWD Announcements
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4 text-xs">
                  <div className="p-3 bg-blue-100/60 rounded-xl border border-blue-200 space-y-1">
                    <Badge className="bg-blue-700 text-white text-[10px]">AICS Payout</Badge>
                    <p className="font-bold text-blue-950">Q3 Medical Assistance Payout Schedule</p>
                    <p className="text-blue-800">
                      Payout for approved medical requests will take place at Calabanga Municipal Hall on Friday, 9:00 AM.
                    </p>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
                    <Badge className="bg-amber-700 text-white text-[10px]">Solo Parent</Badge>
                    <p className="font-bold text-amber-950">Annual ID Renewal Notice</p>
                    <p className="text-amber-900">
                      Solo parent cardholders may submit Barangay Residency renewals directly through this portal.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* VIEW 2: APPLY FOR SERVICE */}
        {activeTab === "services" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div>
                <h2 className="text-xl font-extrabold text-blue-950">MSWD Service Application Portal</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Select a municipal welfare category and program to start your online application.
                </p>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  size="sm"
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  onClick={() => setSelectedCategory("all")}
                  className={selectedCategory === "all" ? "bg-blue-900" : ""}
                >
                  All Categories
                </Button>
                {SERVICE_CATEGORIES.map((cat) => (
                  <Button
                    key={cat.id}
                    size="sm"
                    variant={selectedCategory === cat.id ? "default" : "outline"}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={selectedCategory === cat.id ? "bg-blue-900" : ""}
                  >
                    {cat.title.split(" ")[0]}
                  </Button>
                ))}
              </div>
            </div>

            {/* Program Cards Grid */}
            <div className="space-y-8">
              {SERVICE_CATEGORIES.filter(
                (cat) => selectedCategory === "all" || selectedCategory === cat.id
              ).map((category) => (
                <div key={category.id} className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                    <category.icon className="size-5 text-blue-800" />
                    <h3 className="text-lg font-bold text-gray-900">{category.title}</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {category.services.map((srv, idx) => (
                      <Card key={idx} className="hover:shadow-md transition-shadow border border-gray-200 flex flex-col justify-between">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base font-bold text-blue-950">
                            {srv.name}
                          </CardTitle>
                          <CardDescription className="text-xs text-gray-500">
                            Category: {srv.category}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-0">
                          <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1 border border-gray-100">
                            <p className="font-semibold text-gray-700">Required Documents:</p>
                            <ul className="list-disc list-inside text-gray-600 space-y-0.5">
                              {srv.requirements.map((req, rIdx) => (
                                <li key={rIdx}>{req}</li>
                              ))}
                            </ul>
                          </div>

                          <Button
                            onClick={() =>
                              setApplyingService({
                                name: srv.name,
                                category: srv.category,
                                requirements: srv.requirements,
                              })
                            }
                            className="w-full bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold"
                          >
                            <Send className="size-3.5 mr-1.5" /> Start Application
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 3: MY TRANSACTIONS */}
        {activeTab === "transactions" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-blue-950">My Application Transactions</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Track the complete status and history of all your submitted MSWD service applications.
                </p>
              </div>
              <Button
                onClick={() => setActiveTab("services")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                <PlusCircle className="size-4 mr-1.5" /> Apply New Service
              </Button>
            </div>

            <Card className="border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-blue-900 text-white font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="p-4">App Reference</th>
                      <th className="p-4">Service Program</th>
                      <th className="p-4">Date Submitted</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Remarks / Notes</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-mono font-bold text-blue-900">{t.appNo}</td>
                        <td className="p-4 font-semibold text-gray-900">{t.serviceName}</td>
                        <td className="p-4 text-gray-500">{t.dateSubmitted}</td>
                        <td className="p-4">
                          <Badge
                            className={
                              t.status === "Approved"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : t.status === "Under Review"
                                ? "bg-amber-100 text-amber-800 border-amber-300"
                                : t.status === "Completed"
                                ? "bg-blue-100 text-blue-800 border-blue-300"
                                : "bg-gray-100 text-gray-700"
                            }
                          >
                            {t.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-gray-600 max-w-xs truncate">{t.notes || "—"}</td>
                        <td className="p-4 text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              toast.info(`Tracking Code: ${t.appNo}`, {
                                description: `Status: ${t.status} — ${t.notes}`,
                              })
                            }
                            className="text-xs text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="size-3.5 mr-1" /> View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* VIEW 4: MY DOCUMENTS */}
        {activeTab === "documents" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-blue-950">Digital Document Wallet</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Manage your uploaded IDs and certificates for automated verification across MSWD programs.
                </p>
              </div>
              <Button
                onClick={() => setShowUploadModal(true)}
                className="bg-blue-900 hover:bg-blue-800 text-white text-xs"
              >
                <Upload className="size-4 mr-1.5" /> Upload Document
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <Card key={doc.id} className="border border-gray-200 shadow-sm relative hover:shadow-md transition-shadow">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="size-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                        <FileCheck className="size-5" />
                      </div>
                      <Badge
                        className={
                          doc.status === "Verified"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }
                      >
                        {doc.status}
                      </Badge>
                    </div>

                    <div>
                      <h4 className="font-bold text-gray-900 text-sm truncate">{doc.type}</h4>
                      <p className="text-xs text-gray-500 font-mono mt-0.5 truncate">{doc.name}</p>
                    </div>

                    <div className="pt-2 text-xs text-gray-400 flex items-center justify-between border-t border-gray-100">
                      <span>{doc.uploadDate}</span>
                      <span>{doc.size}</span>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.success(`Opening preview for ${doc.name}`)}
                        className="flex-1 text-xs"
                      >
                        <Eye className="size-3.5 mr-1" /> Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.info(`Downloading ${doc.name}`)}
                        className="text-xs"
                      >
                        <Download className="size-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 5: ACCOUNT SETTINGS */}
        {activeTab === "settings" && (
          <div className="max-w-3xl space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h2 className="text-xl font-extrabold text-blue-950">Beneficiary Profile & Settings</h2>
              <p className="text-xs text-gray-500 mt-1">
                Update your contact details and portal credentials.
              </p>
            </div>

            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-base font-bold text-gray-900">Personal & Resident Profile</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Full Resident Name</label>
                    <input
                      type="text"
                      value={profileData.fullName}
                      onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Mobile Number</label>
                    <input
                      type="text"
                      value={profileData.mobile}
                      onChange={(e) => setProfileData({ ...profileData, mobile: e.target.value })}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Barangay</label>
                    <input
                      type="text"
                      disabled
                      value={profileData.barangay}
                      className="w-full h-10 px-3 border border-gray-200 bg-gray-50 text-gray-500 rounded-lg"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    onClick={() => toast.success("Profile details updated!")}
                    className="bg-blue-900 hover:bg-blue-800 text-white text-xs"
                  >
                    Save Profile Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* ── APPLY SERVICE MODAL ── */}
      {applyingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold">{applyingService.name}</h3>
                <p className="text-xs text-blue-200">MSWD Calabanga Program Application</p>
              </div>
              <button
                onClick={() => setApplyingService(null)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="p-6 space-y-4 text-xs">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-blue-900 space-y-1">
                <p className="font-bold">Required Documents Reminder:</p>
                <ul className="list-disc list-inside text-[11px] space-y-0.5 text-blue-800">
                  {applyingService.requirements.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  Purpose / Details of Request <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={applicationForm.purpose}
                  onChange={(e) =>
                    setApplicationForm({ ...applicationForm, purpose: e.target.value })
                  }
                  placeholder="State the reason for assistance or program intake request..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  Contact Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={applicationForm.contactNo}
                  onChange={(e) =>
                    setApplicationForm({ ...applicationForm, contactNo: e.target.value })
                  }
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  Additional Remarks / Notes
                </label>
                <input
                  type="text"
                  value={applicationForm.remarks}
                  onChange={(e) =>
                    setApplicationForm({ ...applicationForm, remarks: e.target.value })
                  }
                  placeholder="Optional details or urgent notice..."
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setApplyingService(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingApp}
                  className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-bold"
                >
                  {isSubmittingApp ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── UPLOAD DOCUMENT MODAL ── */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="text-base font-bold">Upload Digital Document</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-white/80 hover:text-white">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Document Type</label>
                <select
                  value={uploadDocType}
                  onChange={(e) => setUploadDocType(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-400"
                >
                  <option value="Barangay Certificate of Residency">Barangay Certificate of Residency</option>
                  <option value="Government Issued ID">Government Issued ID (PhilSys/Voter/Passport)</option>
                  <option value="Certificate of Indigency">Certificate of Indigency</option>
                  <option value="Medical Certificate / Abstract">Medical Certificate / Abstract</option>
                  <option value="Supporting Document">Other Supporting Document</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Document File Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. My_Medical_Certificate_2026.pdf"
                  value={uploadFileName}
                  onChange={(e) => setUploadFileName(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center bg-gray-50 hover:bg-blue-50/50 transition-colors cursor-pointer">
                <Upload className="size-8 text-blue-600 mx-auto mb-2" />
                <p className="font-bold text-gray-800">Click or drag file to upload</p>
                <p className="text-[10px] text-gray-400 mt-1">Supports PDF, JPG, PNG up to 10MB</p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowUploadModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-bold">
                  Upload Now
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── LOGOUT DIALOG ── */}
      <LogoutConfirmDialog
        isOpen={showLogoutDialog}
        onConfirm={() => {
          setShowLogoutDialog(false);
          onLogout();
        }}
        onCancel={() => setShowLogoutDialog(false)}
      />
    </div>
  );
}
