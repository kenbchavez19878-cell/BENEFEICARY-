import { toast } from "sonner";
import { logoutAccount } from "./services/authService";
import { lazy, Suspense, useState, useEffect } from "react";
import { LoginForm } from "./components/Website/LoginFormEnhanced";
const MSWDDashboardLayout = lazy(() => import("./components/MSWD Staff/MSWDStaffDashboardLayout").then(module => ({ default: module.DashboardLayout })));
const BarangayRegistrarDashboardLayout = lazy(() => import("./components/Barangay Secretary/BarangaySecretaryDashboardLayout").then(module => ({ default: module.DashboardLayout })));
const MSWDHeadDashboardLayout = lazy(() => import("./components/MSWD Head/MSWDHeadDashboardLayout").then(module => ({ default: module.DashboardLayout })));
const AdministratorDashboardLayout = lazy(() => import("./components/Administrator/AdministratorDashboardLayout").then(module => ({ default: module.AdministratorDashboardLayout })));
const BeneficiaryDashboard = lazy(() => import("./components/Website/BeneficiaryDashboard").then(module => ({ default: module.BeneficiaryDashboard })));
import { PublicWebsite } from "./components/Website/PublicWebsite";
const RegistrationPage = lazy(() => import("./components/Website/RegistrationPage").then(module => ({ default: module.RegistrationPage })));
import { Toaster } from "./components/ui/sonner";

type AppView =
  | "website"
  | "login"
  | "register"
  | "beneficiary-dashboard"
  | "dashboard"
  | "barangay-dashboard"
  | "registrar-dashboard"
  | "admin-dashboard"
  | "head-dashboard"; 

export default function App() {
  const [view, setView] = useState<AppView>("website");
  const [userRole, setUserRole] = useState("");
  const [accountId, setAccountId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const expired = () => {
      sessionStorage.removeItem('benefitrack_active_role');
      sessionStorage.removeItem('benefitrack_account_id');
      setUserRole('');
      setAccountId(undefined);
      setView('login');
      toast.info('Your session has expired. Please sign in again.');
    };
    window.addEventListener('benefitrack:session-expired', expired);
    return () => window.removeEventListener('benefitrack:session-expired', expired);
  }, []);

  const handleLogin = (role: string, id?: string) => {
    setUserRole(role);
    setAccountId(id);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("benefitrack_active_role", role);
      if (id) sessionStorage.setItem("benefitrack_account_id", id);
    }

    if (role === "Beneficiary") {
      setView("beneficiary-dashboard");
    } 
    else if (role === "Administrator" || role === "System Administrator") {
      setView("admin-dashboard");
    }
    else if (role === "BarangaySecretary" || role === "Barangay Secretary") {
      // Route to unified dashboard layout with RBAC capabilities
      setView("dashboard");
    }
    // ADDED "RegisterAccountDashboard" just in case the login form passes it that way
    else if (role === "BarangayRegistrar" || role === "Barangay Registrar" || role === "RegisterAccountDashboard") {
      setView("registrar-dashboard");
    }
    else if (role === "HeadAccount" || role === "MSWD Head" || role === "Head") {
      setView("head-dashboard");
    }
    else {
      // Default fallback (usually MSWD Staff)
      setView("dashboard");
    }
  };

  const handleLogout = async () => {
    try { await logoutAccount(); }
    catch { toast.error("Logout failed. Please try again."); return; }
    setView("website");
    setUserRole("");
    setAccountId(undefined);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("benefitrack_active_role");
      sessionStorage.removeItem("benefitrack_account_id");
    }
  };

  return (
    <Suspense fallback={null}>
      {view === "website" && (
        <PublicWebsite
          onNavigateToLogin={() => setView("login")}
          onNavigateToRegister={() => setView("register")}
        />
      )}

      {view === "login" && (
        <LoginForm
          onLogin={handleLogin}
          onBack={() => setView("website")}
          onNavigateToRegister={() => setView("register")}
        />
      )}

      {view === "register" && (
        <RegistrationPage
          onBack={() => setView("website")}
          onLogin={() => setView("login")}
        />
      )}

      {view === "beneficiary-dashboard" && (
        <BeneficiaryDashboard
          accountId={accountId}
          userRole={userRole}
          onLogout={handleLogout}
          onNavigateToRegister={() => setView("register")}
          accountStatus="approved"
        />
      )}

      {view === "dashboard" && (
        <MSWDDashboardLayout
          userRole={userRole}
          accountId={accountId}
          onLogout={handleLogout}
        />
      )}

      {view === "barangay-dashboard" && (
        <MSWDDashboardLayout
          userRole={userRole || "BarangaySecretary"}
          accountId={accountId}
          onLogout={handleLogout}
        />
      )}

      {/* FIXED: Now rendering the properly aliased component and passing required props */}
      {view === "registrar-dashboard" && (
        <BarangayRegistrarDashboardLayout
          userRole={userRole}
          accountId={accountId}
          onLogout={handleLogout}
        />
      )}

      {view === "admin-dashboard" && (
        <AdministratorDashboardLayout
          userRole={userRole}
          accountId={accountId}
          onLogout={handleLogout}
        />
      )}

      {view === "head-dashboard" && (
        <MSWDHeadDashboardLayout
          userRole={userRole}
          accountId={accountId}
          onLogout={handleLogout}
        />
      )}

      <Toaster />
    </Suspense>
  );
}
