import { useState } from "react";
import { LoginForm } from "./components/Website/LoginFormEnhanced";
import { DashboardLayout as MSWDDashboardLayout } from "./components/MSWD Staff/MSWDStaffDashboardLayout";
import { DashboardLayout as BarangaySecretaryDashboardLayout } from "./components/Barangay Secretary/BarangaySecretaryDashboardLayout";
import { DashboardLayout as BarangayRegistrarDashboardLayout } from "./components/Barangay Secretary/BarangaySecretaryDashboardLayout";
import { DashboardLayout as MSWDHeadDashboardLayout } from "./components/MSWD Head/MSWDHeadDashboardLayout";
import { AdministratorDashboardLayout } from "./components/Administrator/AdministratorDashboardLayout";
import { BeneficiaryDashboard } from "./components/Website/BeneficiaryDashboard";
import { PublicWebsite } from "./components/Website/PublicWebsite";
import { RegistrationPage } from "./components/Website/RegistrationPage";
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

  const handleLogin = (role: string, id?: string) => {
    setUserRole(role);
    setAccountId(id);

    if (role === "Beneficiary") {
      setView("beneficiary-dashboard");
    } 
    else if (role === "Administrator" || role === "System Administrator") {
      setView("admin-dashboard");
    }
    else if (role === "BarangaySecretary" || role === "Barangay Secretary") {
      setView("barangay-dashboard");
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

  const handleLogout = () => {
    setView("website");
    setUserRole("");
    setAccountId(undefined);
  };

  return (
    <>
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
        <BarangaySecretaryDashboardLayout
          userRole={userRole}
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
    </>
  );
}