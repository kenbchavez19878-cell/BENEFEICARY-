import { useState } from "react";
import {
  LayoutDashboard,
  Sparkles,
  Heart,
  HandHeart,
  TrendingUp,
  Shield,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Building2,
} from "lucide-react";
import { cn } from "./ui/utils";
import { Button } from "./ui/button";
import imgImage511 from "figma:asset/aa40af48e9f7209ae7f0669fa9e7f1d7e9f17097.png";

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export function Sidebar({ currentView, onNavigate }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "youth", label: "Youth Development Hub", icon: Sparkles },
    { id: "family", label: "Family Learning & Attendance Network", icon: Heart },
    { id: "senior", label: "GoldenAge Assistance Center", icon: HandHeart },
    { id: "livelihood", label: "LivelihoodPlus Initiative", icon: TrendingUp },
    { id: "resilience", label: "Resilience & Response Unit", icon: Shield },
  ];

  const bottomItems = [
    { id: "settings", label: "Settings", icon: Settings },
    { id: "help", label: "Help & Support", icon: HelpCircle },
  ];

  return (
    <aside
      className={cn(
        "bg-white border-r border-gray-200 text-gray-900 transition-all duration-300 flex flex-col h-screen sticky top-0",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo Section - MSWD-PMS */}
      <div className="px-4 py-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-2 flex-shrink-0 shadow-md">
            <Building2 className="size-6 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="text-lg text-gray-900" style={{ fontFamily: 'SF Pro, sans-serif' }}>MSWD-PMS</h2>
              <p className="text-xs text-gray-500">Community Link System</p>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Toggle Button */}
      <div className="flex justify-end px-2 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-gray-600 hover:bg-gray-100"
        >
          {isCollapsed ? (
            <ChevronRight className="size-5" />
          ) : (
            <ChevronLeft className="size-5" />
          )}
        </Button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 py-6 px-3 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon className="size-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="text-sm truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Dashboard Preview Image */}
        {!isCollapsed && (
          <div className="mt-6 px-1">
            <div className="relative rounded-lg overflow-hidden border border-gray-200 shadow-sm">
              <img 
                alt="Dashboard Preview" 
                className="w-full h-auto object-cover" 
                src={imgImage511} 
              />
            </div>
          </div>
        )}
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-gray-200 py-4 px-3">
        <div className="space-y-1">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon className="size-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="text-sm truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}