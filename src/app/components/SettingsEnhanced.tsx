import { useState } from "react";
import { 
  User, Lock, Bell, Globe, Shield, Database, Moon, Sun, Monitor,
  Camera, Mail, Phone, Briefcase, MapPin, Key, AlertTriangle,
  CheckCircle2, Download, FileText, Trash2, Eye, EyeOff
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { toast } from "sonner";

interface ProfileData {
  fullName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  address: string;
  bio: string;
}

interface SecurityData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  twoFactorEnabled: boolean;
  sessionTimeout: string;
}

interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  newClients: boolean;
  programUpdates: boolean;
  systemMaintenance: boolean;
  emergencyRequests: boolean;
  weeklyReports: boolean;
  monthlyReports: boolean;
}

interface PreferencesData {
  theme: "light" | "dark" | "system";
  language: string;
  timezone: string;
  dateFormat: string;
  itemsPerPage: number;
  defaultDashboard: string;
}

interface PrivacyData {
  allowAnalytics: boolean;
  shareForResearch: boolean;
  enableSessionLogging: boolean;
  dataRetention: string;
  showActivityStatus: boolean;
}

export function SettingsEnhanced() {
  const [activeTab, setActiveTab] = useState("profile");
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Profile State
  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: "Administrator",
    email: "admin@mswd.gov.ph",
    phone: "+63 912 345 6789",
    department: "Municipal Social Welfare and Development",
    position: "System Administrator",
    address: "MSWD Office, Municipal Hall, Main Street",
    bio: "Dedicated to serving the community through efficient social welfare programs."
  });

  // Security State
  const [securityData, setSecurityData] = useState<SecurityData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: false,
    sessionTimeout: "30"
  });

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: true,
    push: true,
    sms: false,
    newClients: true,
    programUpdates: true,
    systemMaintenance: false,
    emergencyRequests: true,
    weeklyReports: true,
    monthlyReports: false
  });

  // Preferences State
  const [preferences, setPreferences] = useState<PreferencesData>({
    theme: "light",
    language: "en",
    timezone: "Asia/Manila",
    dateFormat: "MM/DD/YYYY",
    itemsPerPage: 25,
    defaultDashboard: "overview"
  });

  // Privacy State
  const [privacy, setPrivacy] = useState<PrivacyData>({
    allowAnalytics: true,
    shareForResearch: false,
    enableSessionLogging: true,
    dataRetention: "2-years",
    showActivityStatus: true
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const tabs = [
    { id: "profile", label: "Profile Settings", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "preferences", label: "Preferences", icon: Globe },
    { id: "privacy", label: "Privacy & Data", icon: Shield },
  ];

  const handleProfileSave = () => {
    // Validation
    if (!profileData.fullName || !profileData.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Simulate API call
    setTimeout(() => {
      toast.success("Profile updated successfully!");
      setHasUnsavedChanges(false);
    }, 500);
  };

  const handleSecuritySave = () => {
    // Password validation
    if (securityData.newPassword && securityData.newPassword !== securityData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (securityData.newPassword && securityData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setTimeout(() => {
      toast.success("Security settings updated successfully!");
      setSecurityData({
        ...securityData,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    }, 500);
  };

  const handleNotificationsSave = () => {
    setTimeout(() => {
      toast.success("Notification preferences saved!");
    }, 500);
  };

  const handlePreferencesSave = () => {
    setTimeout(() => {
      toast.success("Preferences updated successfully!");
    }, 500);
  };

  const handlePrivacySave = () => {
    setTimeout(() => {
      toast.success("Privacy settings saved!");
    }, 500);
  };

  const handleDownloadData = () => {
    toast.info("Preparing your data for download...");
    setTimeout(() => {
      toast.success("Download started! Check your downloads folder.");
    }, 2000);
  };

  const handleViewActivityLog = () => {
    toast.info("Opening activity log...");
  };

  const handleDeleteAccount = () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      toast.error("Account deletion requested. Please contact your system administrator.");
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
        {/* Settings Content */}
        <div className="space-y-6">
          {/* Horizontal Tabs Navigation */}
          <div className="flex flex-wrap gap-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all border ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="size-4 flex-shrink-0" />
                  <span className="text-[14px] whitespace-nowrap" style={{ fontWeight: 500 }}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="flex-1">
            <Card className="bg-white border-gray-200 shadow-sm min-h-[calc(100vh-100px)]">
              <CardContent className="p-6">
                {/* Profile Settings */}
                {activeTab === "profile" && (
                  <div className="space-y-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-2xl text-gray-900 mb-2">Profile Information</h2>
                        <p className="text-sm text-gray-600">Update your personal information and profile details</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700 border-0">
                        <CheckCircle2 className="size-3 mr-1" />
                        Verified
                      </Badge>
                    </div>

                    {/* Profile Picture */}
                    <div className="flex items-center gap-6 p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                      <div className="size-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl shadow-lg">
                        {profileData.fullName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base text-gray-900 mb-1">{profileData.fullName}</h3>
                        <p className="text-sm text-gray-600 mb-3">{profileData.position}</p>
                        <Button variant="outline" className="gap-2 bg-white hover:bg-gray-50">
                          <Camera className="size-4" />
                          Change Photo
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Full Name */}
                      <div>
                        <label className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                          <User className="size-4 text-gray-400" />
                          Full Name
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={profileData.fullName}
                          onChange={(e) => {
                            setProfileData({ ...profileData, fullName: e.target.value });
                            setHasUnsavedChanges(true);
                          }}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          placeholder="Enter your full name"
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                          <Mail className="size-4 text-gray-400" />
                          Email Address
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => {
                            setProfileData({ ...profileData, email: e.target.value });
                            setHasUnsavedChanges(true);
                          }}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          placeholder="Enter your email"
                        />
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                          <Phone className="size-4 text-gray-400" />
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => {
                            setProfileData({ ...profileData, phone: e.target.value });
                            setHasUnsavedChanges(true);
                          }}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          placeholder="+63 XXX XXX XXXX"
                        />
                      </div>

                      {/* Department */}
                      <div>
                        <label className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                          <Briefcase className="size-4 text-gray-400" />
                          Department
                        </label>
                        <input
                          type="text"
                          value={profileData.department}
                          onChange={(e) => {
                            setProfileData({ ...profileData, department: e.target.value });
                            setHasUnsavedChanges(true);
                          }}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          placeholder="Your department"
                        />
                      </div>

                      {/* Position */}
                      <div>
                        <label className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                          <Briefcase className="size-4 text-gray-400" />
                          Position
                        </label>
                        <input
                          type="text"
                          value={profileData.position}
                          onChange={(e) => {
                            setProfileData({ ...profileData, position: e.target.value });
                            setHasUnsavedChanges(true);
                          }}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          placeholder="Your position"
                        />
                      </div>

                      {/* Address */}
                      <div>
                        <label className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                          <MapPin className="size-4 text-gray-400" />
                          Office Address
                        </label>
                        <input
                          type="text"
                          value={profileData.address}
                          onChange={(e) => {
                            setProfileData({ ...profileData, address: e.target.value });
                            setHasUnsavedChanges(true);
                          }}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          placeholder="Office address"
                        />
                      </div>
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="text-sm text-gray-700 mb-2 block">Bio / Description</label>
                      <textarea
                        value={profileData.bio}
                        onChange={(e) => {
                          setProfileData({ ...profileData, bio: e.target.value });
                          setHasUnsavedChanges(true);
                        }}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all"
                        placeholder="Tell us about yourself..."
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button variant="outline" onClick={() => setHasUnsavedChanges(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleProfileSave}
                        className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white transition-colors"
                      >
                        Save Changes
                      </Button>
                    </div>
                  </div>
                )}

                {/* Security Settings */}
                {activeTab === "security" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl text-gray-900 mb-2">Security Settings</h2>
                      <p className="text-sm text-gray-600">Manage your password and security preferences</p>
                    </div>

                    {/* Password Change Section */}
                    <div className="space-y-4">
                      <h3 className="text-base text-gray-900 flex items-center gap-2">
                        <Key className="size-5 text-gray-600" />
                        Change Password
                      </h3>

                      {/* Current Password */}
                      <div>
                        <label className="block text-sm text-gray-700 mb-2">Current Password</label>
                        <div className="relative">
                          <input
                            type={showPassword.current ? "text" : "password"}
                            value={securityData.currentPassword}
                            onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                            className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter current password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword.current ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                          </button>
                        </div>
                      </div>

                      {/* New Password */}
                      <div>
                        <label className="block text-sm text-gray-700 mb-2">New Password</label>
                        <div className="relative">
                          <input
                            type={showPassword.new ? "text" : "password"}
                            value={securityData.newPassword}
                            onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                            className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter new password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword.new ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label className="block text-sm text-gray-700 mb-2">Confirm New Password</label>
                        <div className="relative">
                          <input
                            type={showPassword.confirm ? "text" : "password"}
                            value={securityData.confirmPassword}
                            onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                            className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Confirm new password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword.confirm ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <AlertTriangle className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-900">
                          <strong>Password Requirements:</strong>
                          <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
                            <li>At least 8 characters long</li>
                            <li>Include uppercase and lowercase letters</li>
                            <li>Include at least one number</li>
                            <li>Include at least one special character</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Two-Factor Authentication */}
                    <div className="border-t pt-6">
                      <h3 className="text-base text-gray-900 mb-4 flex items-center gap-2">
                        <Shield className="size-5 text-gray-600" />
                        Two-Factor Authentication
                      </h3>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-900 mb-1">Enable two-factor authentication</p>
                          <p className="text-xs text-gray-600">Add an extra layer of security to your account</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={securityData.twoFactorEnabled}
                            onChange={(e) => {
                              setSecurityData({ ...securityData, twoFactorEnabled: e.target.checked });
                              toast.info(e.target.checked ? "2FA will be enabled" : "2FA will be disabled");
                            }}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>

                    {/* Session Timeout */}
                    <div className="border-t pt-6">
                      <h3 className="text-base text-gray-900 mb-4">Session Settings</h3>
                      <div>
                        <label className="block text-sm text-gray-700 mb-2">Auto Logout After (minutes)</label>
                        <select
                          value={securityData.sessionTimeout}
                          onChange={(e) => setSecurityData({ ...securityData, sessionTimeout: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                        >
                          <option value="15">15 minutes</option>
                          <option value="30">30 minutes</option>
                          <option value="60">1 hour</option>
                          <option value="120">2 hours</option>
                          <option value="never">Never</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button variant="outline">Cancel</Button>
                      <Button 
                        onClick={handleSecuritySave}
                        className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white transition-colors"
                      >
                        Update Security Settings
                      </Button>
                    </div>
                  </div>
                )}

                {/* Notifications Settings */}
                {activeTab === "notifications" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl text-gray-900 mb-2">Notification Preferences</h2>
                      <p className="text-sm text-gray-600">Choose how you want to receive notifications</p>
                    </div>

                    {/* Notification Channels */}
                    <div className="space-y-4">
                      <h3 className="text-base text-gray-900 flex items-center gap-2">
                        <Bell className="size-5 text-gray-600" />
                        Notification Channels
                      </h3>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            <Mail className="size-5 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-900">Email Notifications</p>
                              <p className="text-xs text-gray-600">Receive notifications via email</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer"
                              checked={notifications.email}
                              onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            <Bell className="size-5 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-900">Push Notifications</p>
                              <p className="text-xs text-gray-600">Receive push notifications in browser</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer"
                              checked={notifications.push}
                              onChange={(e) => setNotifications({ ...notifications, push: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            <Phone className="size-5 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-900">SMS Notifications</p>
                              <p className="text-xs text-gray-600">Receive notifications via SMS</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer"
                              checked={notifications.sms}
                              onChange={(e) => setNotifications({ ...notifications, sms: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Notification Types */}
                    <div className="border-t pt-6">
                      <h3 className="text-base text-gray-900 mb-4">Notification Types</h3>
                      <div className="space-y-3">
                        {[
                          { key: 'newClients' as const, label: 'New client registrations', desc: 'Get notified when new clients register' },
                          { key: 'programUpdates' as const, label: 'Program updates', desc: 'Updates about assistance programs' },
                          { key: 'systemMaintenance' as const, label: 'System maintenance alerts', desc: 'Scheduled maintenance notifications' },
                          { key: 'emergencyRequests' as const, label: 'Emergency assistance requests', desc: 'Urgent requests that need attention' },
                          { key: 'weeklyReports' as const, label: 'Weekly summary reports', desc: 'Receive weekly activity summaries' },
                          { key: 'monthlyReports' as const, label: 'Monthly analytics reports', desc: 'Detailed monthly performance reports' }
                        ].map(item => (
                          <label key={item.key} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                            <input 
                              type="checkbox" 
                              className="mt-1 size-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                              checked={notifications[item.key]}
                              onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                            />
                            <div className="flex-1">
                              <span className="text-sm text-gray-900 block">{item.label}</span>
                              <span className="text-xs text-gray-600">{item.desc}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button variant="outline">Cancel</Button>
                      <Button 
                        onClick={handleNotificationsSave}
                        className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white transition-colors"
                      >
                        Save Preferences
                      </Button>
                    </div>
                  </div>
                )}

                {/* Preferences Settings */}
                {activeTab === "preferences" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl text-gray-900 mb-2">Application Preferences</h2>
                      <p className="text-sm text-gray-600">Customize your application experience</p>
                    </div>

                    {/* Appearance */}
                    <div>
                      <label className="text-sm text-gray-700 mb-3 block flex items-center gap-2">
                        <Monitor className="size-4 text-gray-400" />
                        Appearance
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={() => setPreferences({ ...preferences, theme: "light" })}
                          className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all ${
                            preferences.theme === "light"
                              ? "border-blue-600 bg-blue-50 shadow-md"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <Sun className="size-6 text-gray-700" />
                          <span className="text-sm text-gray-900">Light</span>
                        </button>
                        <button
                          onClick={() => setPreferences({ ...preferences, theme: "dark" })}
                          className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all ${
                            preferences.theme === "dark"
                              ? "border-blue-600 bg-blue-50 shadow-md"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <Moon className="size-6 text-gray-700" />
                          <span className="text-sm text-gray-900">Dark</span>
                        </button>
                        <button
                          onClick={() => setPreferences({ ...preferences, theme: "system" })}
                          className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all ${
                            preferences.theme === "system"
                              ? "border-blue-600 bg-blue-50 shadow-md"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <Monitor className="size-6 text-gray-700" />
                          <span className="text-sm text-gray-900">System</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Language */}
                      <div>
                        <label className="block text-sm text-gray-700 mb-2">Language</label>
                        <select 
                          value={preferences.language}
                          onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                        >
                          <option value="en">English</option>
                          <option value="fil">Filipino</option>
                          <option value="ceb">Cebuano</option>
                          <option value="ilo">Ilocano</option>
                        </select>
                      </div>

                      {/* Time Zone */}
                      <div>
                        <label className="block text-sm text-gray-700 mb-2">Time Zone</label>
                        <select 
                          value={preferences.timezone}
                          onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                        >
                          <option value="Asia/Manila">Asia/Manila (GMT+8)</option>
                          <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
                          <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
                        </select>
                      </div>

                      {/* Date Format */}
                      <div>
                        <label className="block text-sm text-gray-700 mb-2">Date Format</label>
                        <select 
                          value={preferences.dateFormat}
                          onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                        >
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                      </div>

                      {/* Items Per Page */}
                      <div>
                        <label className="block text-sm text-gray-700 mb-2">Items Per Page</label>
                        <select 
                          value={preferences.itemsPerPage}
                          onChange={(e) => setPreferences({ ...preferences, itemsPerPage: Number(e.target.value) })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                        >
                          <option value="10">10 items</option>
                          <option value="25">25 items</option>
                          <option value="50">50 items</option>
                          <option value="100">100 items</option>
                        </select>
                      </div>

                      {/* Default Dashboard */}
                      <div className="md:col-span-2">
                        <label className="block text-sm text-gray-700 mb-2">Default Dashboard View</label>
                        <select 
                          value={preferences.defaultDashboard}
                          onChange={(e) => setPreferences({ ...preferences, defaultDashboard: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                        >
                          <option value="overview">Overview Dashboard</option>
                          <option value="client-profiling">Beneficiary Profiling</option>
                          <option value="emergency">Emergency & Crisis</option>
                          <option value="employment">Employment Programs</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button variant="outline">Cancel</Button>
                      <Button 
                        onClick={handlePreferencesSave}
                        className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white transition-colors"
                      >
                        Save Preferences
                      </Button>
                    </div>
                  </div>
                )}

                {/* Privacy & Data Settings */}
                {activeTab === "privacy" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl text-gray-900 mb-2">Privacy & Data Management</h2>
                      <p className="text-sm text-gray-600">Control your data and privacy settings</p>
                    </div>

                    {/* Data Protection Notice */}
                    <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <Shield className="size-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-yellow-900 mb-1"><strong>Data Protection Notice</strong></p>
                        <p className="text-xs text-yellow-800">
                          Your data is protected under the Data Privacy Act of 2012 (Republic Act No. 10173). We are committed to safeguarding your personal information.
                        </p>
                      </div>
                    </div>

                    {/* Data Access */}
                    <div>
                      <h3 className="text-base text-gray-900 mb-4 flex items-center gap-2">
                        <Database className="size-5 text-gray-600" />
                        Data Access & Export
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button 
                          variant="outline" 
                          className="justify-start gap-4 hover:bg-gray-50 h-auto py-4 px-5"
                          onClick={handleDownloadData}
                        >
                          <Download className="size-5 text-blue-600 flex-shrink-0" />
                          <div className="text-left">
                            <div className="text-sm text-gray-900 mb-1">Download My Data</div>
                            <div className="text-xs text-gray-600">Export all your personal information</div>
                          </div>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="justify-start gap-4 hover:bg-gray-50 h-auto py-4 px-5"
                          onClick={handleViewActivityLog}
                        >
                          <FileText className="size-5 text-green-600 flex-shrink-0" />
                          <div className="text-left">
                            <div className="text-sm text-gray-900 mb-1">View Activity Log</div>
                            <div className="text-xs text-gray-600">See your recent account activity</div>
                          </div>
                        </Button>
                      </div>
                    </div>

                    {/* Privacy Settings */}
                    <div className="border-t pt-6">
                      <h3 className="text-base text-gray-900 mb-4">Privacy Settings</h3>
                      <div className="space-y-4">
                        <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="mt-1 size-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                            checked={privacy.allowAnalytics}
                            onChange={(e) => setPrivacy({ ...privacy, allowAnalytics: e.target.checked })}
                          />
                          <div>
                            <span className="text-sm text-gray-900 block">Allow usage analytics</span>
                            <span className="text-xs text-gray-600">Help us improve by sharing anonymous usage data</span>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="mt-1 size-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                            checked={privacy.shareForResearch}
                            onChange={(e) => setPrivacy({ ...privacy, shareForResearch: e.target.checked })}
                          />
                          <div>
                            <span className="text-sm text-gray-900 block">Share data for research purposes</span>
                            <span className="text-xs text-gray-600">Contribute to government research and policy development</span>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="mt-1 size-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                            checked={privacy.enableSessionLogging}
                            onChange={(e) => setPrivacy({ ...privacy, enableSessionLogging: e.target.checked })}
                          />
                          <div>
                            <span className="text-sm text-gray-900 block">Enable session logging</span>
                            <span className="text-xs text-gray-600">Record session data for security and audit purposes</span>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="mt-1 size-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                            checked={privacy.showActivityStatus}
                            onChange={(e) => setPrivacy({ ...privacy, showActivityStatus: e.target.checked })}
                          />
                          <div>
                            <span className="text-sm text-gray-900 block">Show activity status</span>
                            <span className="text-xs text-gray-600">Let others see when you're online</span>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Data Retention */}
                    <div className="border-t pt-6">
                      <h3 className="text-base text-gray-900 mb-4">Data Retention</h3>
                      <div>
                        <label className="block text-sm text-gray-700 mb-2">Keep my data for</label>
                        <select 
                          value={privacy.dataRetention}
                          onChange={(e) => setPrivacy({ ...privacy, dataRetention: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                        >
                          <option value="1-year">1 year</option>
                          <option value="2-years">2 years</option>
                          <option value="5-years">5 years</option>
                          <option value="indefinite">Indefinitely</option>
                        </select>
                      </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="border-t pt-6">
                      <h3 className="text-base text-red-600 mb-4 flex items-center gap-2">
                        <AlertTriangle className="size-5" />
                        Danger Zone
                      </h3>
                      <div className="p-4 border-2 border-red-200 rounded-lg bg-red-50">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm text-gray-900 mb-1"><strong>Delete Account</strong></p>
                            <p className="text-xs text-gray-600">Permanently delete your account and all associated data. This action cannot be undone.</p>
                          </div>
                          <Button 
                            variant="outline" 
                            className="border-red-300 text-red-600 hover:bg-red-100 flex-shrink-0"
                            onClick={handleDeleteAccount}
                          >
                            <Trash2 className="size-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button variant="outline">Cancel</Button>
                      <Button 
                        onClick={handlePrivacySave}
                        className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white transition-colors"
                      >
                        Save Settings
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}