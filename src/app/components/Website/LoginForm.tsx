import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  X,
  Mail,
  Phone,
  MessageCircle,
  Shield,
  User,
  Users,
  Lock,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Clock,
  Globe,
  Menu,
  ChevronDown,
} from "lucide-react";

interface LoginFormProps {
  onLogin: (role: string, accountId?: string) => void;
  onBack?: () => void;
  onNavigateToRegister?: () => void;
}

type RoleId =
  | "Beneficiary"
  | "BarangaySecretary"
  | "Staff"
  | "Head"
  | "Administrator"
  | "";

const ROLES: {
  id: RoleId;
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
}[] = [
  {
    id: "Beneficiary",
    label: "BENEFICIARY",
    desc: "Access your applications & services",
    icon: <User className="size-5" />,
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  {
    id: "BarangaySecretary",
    label: "BARANGAY SECRETARY",
    desc: "Endorse & validate barangay applications",
    icon: <Globe className="size-5" />,
    color: "text-teal-700",
    bg: "bg-teal-50",
    border: "border-teal-200",
  },
  {
    id: "Staff",
    label: "MSWD STAFF",
    desc: "Process cases & manage records",
    icon: <Users className="size-5" />,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  {
    id: "Head",
    label: "MSWD HEAD",
    desc: "Management, reports & system oversight",
    icon: <Lock className="size-5" />,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  {
    id: "Administrator",
    label: "ADMINISTRATOR",
    desc: "Full system administration",
    icon: <Shield className="size-5" />,
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
  },
];

export function LoginForm({
  onLogin,
  onBack,
  onNavigateToRegister,
}: LoginFormProps) {
  const [role, setRole] = useState<RoleId>("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
    role?: string;
  }>({});

  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showGetHelpModal, setShowGetHelpModal] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  
  // Custom Dropdown State
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowRoleDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function validateForm() {
    const e: {
      username?: string;
      password?: string;
      role?: string;
    } = {};
    if (!role) e.role = "Please select a role.";
    if (!username.trim()) e.username = "Username or email is required.";
    if (!password) e.password = "Password is required.";
    else if (password.length < 6)
      e.password = "Password must be at least 6 characters.";

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await new Promise((r) => setTimeout(r, 1500));
      toast.success("Login successful!", {
        description: `Welcome back! Logged in as ${role}`,
      });
      onLogin(role, "simulated-id-123");
    } catch (error) {
      toast.error("Login failed", {
        description: "Please check your credentials and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetEmail.trim()) {
      toast.error("Email is required");
      return;
    }
    setIsResetting(true);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      toast.success("Password reset email sent!", {
        description: "Check your email for reset instructions.",
      });
      setShowForgotPasswordModal(false);
      setResetEmail("");
    } catch {
      toast.error("Failed to send reset email", {
        description: "Please try again later.",
      });
    }
    setIsResetting(false);
  }

  // Get the selected role object to display in the custom dropdown
  const selectedRole = ROLES.find((r) => r.id === role);

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{
        fontFamily: "'Source Sans 3', system-ui, sans-serif",
      }}
    >
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
       {/* Navbar - FULL WIDTH */}
      <header className="sticky top-0 z-50 bg-white shadow-sm w-full">
        <div className="bg-blue-900 text-white">
          {/* Replaced max-w-7xl mx-auto with w-full */}
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

        {/* Replaced max-w-7xl mx-auto with w-full */}
        <nav className="w-full px-4 border-b border-gray-100">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={onBack}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="size-10 rounded-full bg-blue-900 flex items-center justify-center flex-shrink-0">
                <Shield className="size-5 text-white" />
              </div>
              <div className="text-left">
                <div
                  className="text-sm font-bold text-blue-900 leading-tight"
                  style={{
                    fontFamily: "'Libre Franklin', sans-serif",
                  }}
                >
                  MSWD Calabanga
                </div>
                <div className="text-xs text-gray-500 leading-tight hidden sm:block">
                  Municipal Social Welfare &amp; Development
                </div>
              </div>
            </button>

            <div className="hidden md:flex items-center gap-1">
              <button
                onClick={onBack}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                Home
              </button>
              <button
                onClick={onBack}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                About Us
              </button>
              <button
                onClick={onBack}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                Services <ChevronDown className="size-4" />
              </button>
              <button
                onClick={onNavigateToRegister}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                Register
              </button>
              <button className="ml-1 px-5 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg cursor-default">
                Login
              </button>
            </div>

            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              aria-label="Toggle menu"
            >
              {mobileNavOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </button>
          </div>

          {mobileNavOpen && (
            <div className="md:hidden border-t border-gray-100 py-3 space-y-1 pb-4">
              <button
                onClick={onBack}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                Home
              </button>
              <button
                onClick={onBack}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                About Us
              </button>
              <button
                onClick={onBack}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                Services
              </button>
              <div className="pt-2 px-1 flex flex-col gap-2">
                <button
                  onClick={onNavigateToRegister}
                  className="w-full py-2.5 text-sm font-semibold text-gray-700 hover:text-blue-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Register
                </button>
                <button className="w-full py-2.5 text-sm font-semibold text-white bg-blue-700 rounded-lg cursor-default">
                  Login to Portal
                </button>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Banner - FULL WIDTH */}
<div className="bg-blue-900 text-white py-8 w-full">
  {/* Added flex, flex-col, items-center, and text-center for centering */}
  <div className="w-full px-4 flex flex-col items-center text-center">
    <h1
      className="text-2xl font-extrabold mb-1"
      style={{
        fontFamily: "'Libre Franklin', sans-serif",
      }}
    >
      MSWD Calabanga — Program Management System
    </h1>
    
    {/* Replaced max-w-2xl with truncate (forces 1 line with ellipsis on small screens) */}
    <p className="text-blue-200 text-sm truncate w-full max-w-4xl">
      Access social welfare services, applications, and program management
      through the official MSWD Calabanga Portal.
    </p>
  </div>
</div>
        <nav className="max-w-7xl mx-auto px-4 border-b border-gray-100">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={onBack}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="size-10 rounded-full bg-blue-900 flex items-center justify-center flex-shrink-0">
                <Shield className="size-5 text-white" />
              </div>
              <div className="text-left">
                <div
                  className="text-sm font-bold text-blue-900 leading-tight"
                  style={{ fontFamily: "'Libre Franklin', sans-serif" }}
                >
                  MSWD Calabanga
                </div>
                <div className="text-xs text-gray-500 leading-tight hidden sm:block">
                  Municipal Social Welfare &amp; Development
                </div>
              </div>
            </button>

            <div className="hidden md:flex items-center gap-1">
              <button
                onClick={onBack}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                Home
              </button>
              <button
                onClick={onBack}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                About Us
              </button>
              <button
                onClick={onBack}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                Services
                <ChevronDown className="size-4" />
              </button>
              <button
                onClick={onNavigateToRegister}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                Register
              </button>
              <button className="ml-1 px-5 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg cursor-default">
                Login
              </button>
            </div>

            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              aria-label="Toggle menu"
            >
              {mobileNavOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>

          {mobileNavOpen && (
            <div className="md:hidden border-t border-gray-100 py-3 space-y-1 pb-4">
              <button
                onClick={onBack}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                Home
              </button>
              <button
                onClick={onBack}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                About Us
              </button>
              <button
                onClick={onBack}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                Services
              </button>
              <div className="pt-2 px-1 flex flex-col gap-2">
                <button
                  onClick={onNavigateToRegister}
                  className="w-full py-2.5 text-sm font-semibold text-gray-700 hover:text-blue-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Register
                </button>
                <button className="w-full py-2.5 text-sm font-semibold text-white bg-blue-700 rounded-lg cursor-default">
                  Login to Portal
                </button>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Banner */}
      <div className="bg-blue-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1
            className="text-2xl font-extrabold mb-1"
            style={{ fontFamily: "'Libre Franklin', sans-serif" }}
          >
            MSWD Calabanga — Program Management System
          </h1>
          <p className="text-blue-200 text-sm max-w-2xl">
            Access social welfare services, applications, and program management
            through the official MSWD Calabanga Portal.
          </p>
        </div>
      </div>

      {/* Main content - NARROWED TO max-w-md */}
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-blue-900 px-6 py-5">
              <h2
                className="text-lg font-bold text-white"
                style={{ fontFamily: "'Libre Franklin', sans-serif" }}
              >
                Welcome Back
              </h2>
              <p className="text-blue-200 text-sm mt-0.5">
                Sign in to access your MSWD Calabanga account.
              </p>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                
                {/* BEAUTIFUL CUSTOM ROLE DROPDOWN */}
                <div ref={dropdownRef}>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">
                    Sign in as <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                      className={`w-full flex items-center justify-between h-12 px-3 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white ${
                        errors.role
                          ? "border-red-400 bg-red-50"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      {selectedRole ? (
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-md ${selectedRole.bg} ${selectedRole.color}`}>
                            {selectedRole.icon}
                          </div>
                          <span className="font-semibold text-gray-900">
                            {selectedRole.label}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500 ml-1">— Select your role —</span>
                      )}
                      <ChevronDown
                        className={`size-4 text-gray-400 transition-transform duration-200 ${
                          showRoleDropdown ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Custom Dropdown Menu */}
                    {showRoleDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden z-50">
                        <div className="max-h-72 overflow-y-auto">
                          {ROLES.map((r) => (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => {
                                setRole(r.id);
                                setShowRoleDropdown(false);
                                if (errors.role) setErrors({ ...errors, role: undefined });
                              }}
                              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                            >
                              <div className={`p-2 rounded-lg flex-shrink-0 ${r.bg} ${r.color}`}>
                                {r.icon}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-gray-900">
                                  {r.label}
                                </div>
                                <div className="text-xs text-gray-500 line-clamp-1">
                                  {r.desc}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.role && (
                    <p className="text-xs text-red-600 flex items-center gap-1.5 mt-1.5">
                      <AlertCircle className="size-3.5 flex-shrink-0" />
                      {errors.role}
                    </p>
                  )}
                </div>

                {/* Username */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="username" className="text-sm font-semibold text-gray-700">
                    Username or Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (errors.username) setErrors({ ...errors, username: undefined });
                      }}
                      placeholder="Enter your username or email"
                      className={`h-11 w-full pl-10 pr-3 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white ${
                        errors.username ? "border-red-400 bg-red-50" : "border-gray-300 hover:border-gray-400"
                      }`}
                    />
                  </div>
                  {errors.username && (
                    <p className="text-xs text-red-600 flex items-center gap-1.5 mt-0.5">
                      <AlertCircle className="size-3.5 flex-shrink-0" />
                      {errors.username}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="password" className="text-sm font-semibold text-gray-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors({ ...errors, password: undefined });
                      }}
                      placeholder="Enter your password"
                      className={`h-11 w-full pl-10 pr-10 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white ${
                        errors.password ? "border-red-400 bg-red-50" : "border-gray-300 hover:border-gray-400"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-600 flex items-center gap-1.5 mt-0.5">
                      <AlertCircle className="size-3.5 flex-shrink-0" />
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Remember me + Forgot password */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div
                      onClick={() => setRememberMe(!rememberMe)}
                      className={`size-4 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                        rememberMe
                          ? "bg-blue-700 border-blue-700"
                          : "bg-white border-gray-300 group-hover:border-blue-400"
                      }`}
                    >
                      {rememberMe && (
                        <svg className="size-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-gray-600">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(true)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Login button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 mt-2 rounded-lg text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 ${
                    isLoading
                      ? "bg-blue-400 text-white cursor-not-allowed"
                      : "bg-blue-700 hover:bg-blue-800 text-white shadow-md hover:shadow-lg active:scale-[0.99]"
                  }`}
                  style={{ fontFamily: "'Libre Franklin', sans-serif" }}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin size-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Logging in...
                    </>
                  ) : (
                    <>
                      LOGIN <ArrowRight className="size-4" />
                    </>
                  )}
                </button>

          {/* Register text - Subdued size and weight */}
<p className="text-center text-sm text-gray-500 pt-2">
  Don't have an account yet?{" "}
  <button
    type="button"
    onClick={onNavigateToRegister}
    className="text-sm text-blue-600 font-medium hover:underline ml-1"
  >
    Register here
  </button>
</p>
                
                <div className="flex justify-center border-t border-gray-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowGetHelpModal(true)}
                    className="text-sm text-gray-500 hover:text-blue-600 hover:underline flex items-center gap-1.5 transition-colors"
                  >
                    <MessageCircle className="size-4" /> Get Help Logging In
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <CheckCircle className="size-4 text-green-500" />
            Secure Government System — Protected by SSL Encryption
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-blue-900 px-6 py-4 flex justify-between items-center">
              <h3
                className="text-base font-bold text-white"
                style={{ fontFamily: "'Libre Franklin', sans-serif" }}
              >
                Reset Password
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowForgotPasswordModal(false);
                  setResetEmail("");
                }}
                className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <AlertCircle className="size-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  Enter your email address and we'll send you instructions to reset your password.
                </p>
              </div>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="resetEmail" className="text-sm font-semibold text-gray-700">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <input
                      id="resetEmail"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="h-10 w-full pl-9 pr-3 rounded-lg border border-gray-300 text-sm hover:border-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPasswordModal(false);
                      setResetEmail("");
                    }}
                    className="flex-1 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isResetting}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      isResetting
                        ? "bg-blue-400 text-white cursor-not-allowed"
                        : "bg-blue-700 hover:bg-blue-800 text-white"
                    }`}
                  >
                    {isResetting ? (
                      <>
                        <svg className="animate-spin size-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Get Help Modal */}
      {showGetHelpModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowGetHelpModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-blue-900 px-6 py-4 flex justify-between items-center">
              <h3
                className="text-base font-bold text-white"
                style={{ fontFamily: "'Libre Franklin', sans-serif" }}
              >
                Need Help?
              </h3>
              <button
                type="button"
                onClick={() => setShowGetHelpModal(false)}
                className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                If you're having trouble logging in, contact the MSWD Calabanga
                support team through any of the following:
              </p>
              <div className="space-y-3">
                {[
                  {
                    icon: <Mail className="size-4 text-blue-600" />,
                    bg: "bg-blue-50 border-blue-100",
                    title: "Email Support",
                    detail: "mswd.calabanga@gmail.com",
                    sub: "Response within 24 hours",
                  },
                  {
                    icon: <Phone className="size-4 text-green-600" />,
                    bg: "bg-green-50 border-green-100",
                    title: "Phone Support",
                    detail: "(054) 871-1234",
                    sub: "Mon–Fri, 8:00 AM – 5:00 PM",
                  },
                  {
                    icon: <MessageCircle className="size-4 text-purple-600" />,
                    bg: "bg-purple-50 border-purple-100",
                    title: "IT Help Desk",
                    detail: "Local 2050 / 2051",
                    sub: "For technical issues",
                  },
                ].map((item) => (
                  <div key={item.title} className={`flex items-start gap-3 p-4 ${item.bg} border rounded-xl`}>
                    <div className="mt-0.5">{item.icon}</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-700 mt-0.5">{item.detail}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="size-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>Note:</strong> Please have your employee ID or registered
                  email ready when contacting support. For password resets, identity
                  verification is required.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}