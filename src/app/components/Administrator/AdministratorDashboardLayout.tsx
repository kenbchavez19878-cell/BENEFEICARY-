import { useState } from "react";
import { 
  Shield, LogOut, LayoutDashboard, 
  Menu, X, Settings, ChevronDown, UserCog, ClipboardList
} from "lucide-react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";

// Imports
import { MainDashboard } from "../MSWD Staff/MainDashboard";

// Admin specific imports
import { UserManagement } from "../Administrator/UserManagement";
import { AuditLogs } from "../Administrator/AuditLogs";

import { SettingsEnhanced as SettingsComponent } from "../SettingsEnhanced";
import { NotificationDropdown } from "../NotificationDropdown";
import { LogoutConfirmDialog } from "../LogoutConfirmDialog";
import { getStaffById, type StaffAccount } from "../../data/staffAccounts";
import { getSystemAccountById, type SystemAccount } from "../../data/systemAccounts";

interface DashboardLayoutProps {
  userRole: string;
  accountId?: string;
  onLogout: () => void;
}

export function AdministratorDashboardLayout({ userRole, accountId, onLogout }: DashboardLayoutProps) {
  const staffAccount: StaffAccount | null =
    userRole === "Staff" && accountId ? getStaffById(accountId) : null;
  const systemAccount: SystemAccount | null =
    (userRole === "HeadAccount" || userRole === "Administrator") && accountId
      ? getSystemAccountById(accountId)
      : null;

  const displayName = staffAccount?.name ?? systemAccount?.name ?? userRole;
  const displayPosition = staffAccount?.position ?? systemAccount?.position ?? userRole;

  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // ALL IDs MUST MATCH EXACTLY WITH THE RENDER CONDITIONS AT THE BOTTOM
  const ALL_MENU_ITEMS = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "user-management", label: "User Management", icon: UserCog },
    { id: "audit-logs", label: "Audit Logs", icon: ClipboardList },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const ROLE_PERMISSIONS: Record<string, string[]> = {
    "Staff": [
      "dashboard"
    ],
    "HeadAccount": [
      "dashboard", "settings"
    ],
    "Administrator": [
      "dashboard", "user-management", "audit-logs", "settings"
    ]
  };

  const allowedMenuIds = ROLE_PERMISSIONS[userRole] || ["dashboard"];
  const menuItems = ALL_MENU_ITEMS.filter((item) => allowedMenuIds.includes(item.id));

  const handleMenuClick = (menuId: string) => {
    setActiveMenu(menuId);
    setSidebarOpen(false);
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutDialog(false);
    onLogout();
  };

  const handleLogoutCancel = () => {
    setShowLogoutDialog(false);
  };

  return (
    <div className="relative bg-gray-50 h-screen w-full overflow-hidden">
      {/* Header */}
      <div className="absolute bg-blue-900 h-[56px] left-0 shadow-[0px_4px_6px_0px_rgba(0,0,0,0.3)] top-0 right-0 z-20">
        <div className="px-4 sm:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-white hover:bg-white/10"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="size-5" />
            </Button>
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-full bg-blue-700 flex items-center justify-center flex-shrink-0">
                <Shield className="size-4 text-white" />
              </div>
              <span className="text-white font-bold text-sm hidden sm:block" style={{ fontFamily: "'Libre Franklin', sans-serif" }}>MSWD Calabanga</span>
              <span className="text-blue-300 text-xs hidden md:block">| Program Management System</span>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <NotificationDropdown dark />

            <div className="relative flex items-center gap-2 sm:gap-3 border-l border-white/20 pl-2 sm:pl-4">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 hover:bg-white/10 rounded-lg p-1 transition-colors"
              >
                <Avatar className="size-7">
                  <AvatarFallback className="bg-blue-700 text-white text-xs">
                    {displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="size-3.5 text-white/70 hidden sm:block" />
              </button>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1.5 z-50">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-xs font-medium text-gray-900">{displayName}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{displayPosition}</p>
                    </div>

                    {allowedMenuIds.includes("settings") && (
                      <>
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            setActiveMenu("settings");
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                        >
                          <Settings className="size-3.5 text-gray-600" />
                          <span className="text-xs text-gray-700">Settings</span>
                        </button>
                        <div className="border-t border-gray-100 my-1" />
                      </>
                    )}

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogoutClick();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-red-50 transition-colors text-left text-red-600"
                    >
                      <LogOut className="size-3.5" />
                      <span className="text-xs">Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:absolute left-0 top-[56px] bottom-0 bg-white border-r border-gray-200 shadow-sm z-30
        transition-all duration-300 ease-in-out flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${sidebarCollapsed ? 'w-[70px]' : 'w-[280px]'}
      `}>
        <div className="p-4 flex-shrink-0">
          <div className="hidden lg:flex justify-start mb-3">
            <Button variant="ghost" size="sm" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hover:bg-gray-100">
              <Menu className="size-5" />
            </Button>
          </div>
          <div className="flex justify-end lg:hidden mb-3">
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
              <X className="size-5" />
            </Button>
          </div>
        </div>

        <nav className="space-y-1 px-4 flex-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                  isActive ? "bg-blue-900 text-white shadow-sm" : "text-gray-700 hover:bg-blue-50 hover:text-blue-900"
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className="size-5 flex-shrink-0" />
                {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-gray-200 p-4 space-y-2.5">
          {!sidebarCollapsed && (
            <div className="px-3">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Signed in as</p>
            </div>
          )}

          {!sidebarCollapsed && (
            <div className="flex items-center gap-3 px-3 py-2">
              <Avatar className="size-7 flex-shrink-0">
                <AvatarFallback className="bg-blue-900 text-white text-xs">
                  {displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 truncate">{displayName}</p>
                {staffAccount ? (
                  <p className="text-xs text-gray-400 truncate">{staffAccount.staffId}</p>
                ) : (
                  <p className="text-xs text-gray-400 truncate">Administrator</p>
                )}
              </div>
            </div>
          )}

          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left text-red-600 hover:bg-red-50"
            title={sidebarCollapsed ? "Logout" : undefined}
          >
            <LogOut className="size-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`absolute top-[56px] right-0 bottom-0 bg-gray-50 overflow-hidden transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'left-0 lg:left-[70px]' : 'left-0 lg:left-[280px]'
      }`}>
        
        {activeMenu === "dashboard" && <MainDashboard />}
        
        {/* ADMIN RENDER BLOCKS */}
        {activeMenu === "user-management" && <UserManagement />}
        {activeMenu === "audit-logs" && <AuditLogs />}
        
        {activeMenu === "settings" && <SettingsComponent />}
        
        {!["dashboard", "user-management", "audit-logs", "settings"].includes(activeMenu) && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-4">
              <p className="text-gray-400 text-lg">Coming Soon</p>
              <p className="text-gray-500 text-sm mt-2">This module is under development</p>
            </div>
          </div>
        )}
      </div>

      {/* Logout Confirm Dialog */}
      <LogoutConfirmDialog
        isOpen={showLogoutDialog}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
    </div>
  );
}