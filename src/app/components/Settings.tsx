import { useState } from "react";
import { User, Lock, Bell, Globe, Shield, Database, Moon, Sun, Monitor } from "lucide-react";
import { Button } from "./ui/button";

export function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [darkMode, setDarkMode] = useState("light");
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
  });

  const tabs = [
    { id: "profile", label: "Profile Settings", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "preferences", label: "Preferences", icon: Globe },
    { id: "privacy", label: "Privacy & Data", icon: Shield },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[32px] text-[#1a1d29] mb-2">Settings</h1>
          <p className="text-[15px] text-[#6b7280]">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Settings Content */}
        <div className="flex gap-6">
          {/* Sidebar Tabs */}
          <div className="w-[280px] flex-shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                      activeTab === tab.id
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="size-5 flex-shrink-0" />
                    <span className="text-sm">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {activeTab === "profile" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl text-[#1a1d29] mb-4">Profile Information</h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-[#374151] mb-2">Full Name</label>
                      <input
                        type="text"
                        placeholder="Enter your full name"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue="Administrator"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-[#374151] mb-2">Email Address</label>
                      <input
                        type="email"
                        placeholder="Enter your email"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue="admin@mswd.gov.ph"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-[#374151] mb-2">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="Enter your phone number"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue="+63 912 345 6789"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-[#374151] mb-2">Department</label>
                      <input
                        type="text"
                        placeholder="Enter your department"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue="Municipal Social Welfare and Development"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-[#374151] mb-2">Position</label>
                      <input
                        type="text"
                        placeholder="Enter your position"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue="System Administrator"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline">Cancel</Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      Save Changes
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === "security" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl text-[#1a1d29] mb-4">Security Settings</h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-[#374151] mb-2">Current Password</label>
                      <input
                        type="password"
                        placeholder="Enter current password"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-[#374151] mb-2">New Password</label>
                      <input
                        type="password"
                        placeholder="Enter new password"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-[#374151] mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        placeholder="Confirm new password"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters.
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-base text-[#1a1d29] mb-4">Two-Factor Authentication</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#374151]">Enable two-factor authentication</p>
                        <p className="text-xs text-[#6b7280] mt-1">Add an extra layer of security to your account</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline">Cancel</Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      Update Password
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === "notifications" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl text-[#1a1d29] mb-4">Notification Preferences</h2>
                    <p className="text-sm text-[#6b7280]">Choose how you want to receive notifications</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b">
                      <div>
                        <p className="text-sm text-[#374151]">Email Notifications</p>
                        <p className="text-xs text-[#6b7280] mt-1">Receive notifications via email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={notifications.email}
                          onChange={(e) => setNotifications({...notifications, email: e.target.checked})}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b">
                      <div>
                        <p className="text-sm text-[#374151]">Push Notifications</p>
                        <p className="text-xs text-[#6b7280] mt-1">Receive push notifications in browser</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={notifications.push}
                          onChange={(e) => setNotifications({...notifications, push: e.target.checked})}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b">
                      <div>
                        <p className="text-sm text-[#374151]">SMS Notifications</p>
                        <p className="text-xs text-[#6b7280] mt-1">Receive notifications via SMS</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={notifications.sms}
                          onChange={(e) => setNotifications({...notifications, sms: e.target.checked})}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-base text-[#1a1d29] mb-4">Notification Types</h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input type="checkbox" className="w-4 h-4 text-blue-600" defaultChecked />
                        <span className="text-sm text-[#374151]">New client registrations</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" className="w-4 h-4 text-blue-600" defaultChecked />
                        <span className="text-sm text-[#374151]">Program updates</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-[#374151]">System maintenance alerts</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" className="w-4 h-4 text-blue-600" defaultChecked />
                        <span className="text-sm text-[#374151]">Emergency assistance requests</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline">Cancel</Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      Save Preferences
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === "preferences" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl text-[#1a1d29] mb-4">Application Preferences</h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-[#374151] mb-3">Appearance</label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={() => setDarkMode("light")}
                          className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all ${
                            darkMode === "light"
                              ? "border-blue-600 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <Sun className="size-6" />
                          <span className="text-sm">Light</span>
                        </button>
                        <button
                          onClick={() => setDarkMode("dark")}
                          className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all ${
                            darkMode === "dark"
                              ? "border-blue-600 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <Moon className="size-6" />
                          <span className="text-sm">Dark</span>
                        </button>
                        <button
                          onClick={() => setDarkMode("system")}
                          className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all ${
                            darkMode === "system"
                              ? "border-blue-600 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <Monitor className="size-6" />
                          <span className="text-sm">System</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-[#374151] mb-2">Language</label>
                      <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>English</option>
                        <option>Filipino</option>
                        <option>Cebuano</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-[#374151] mb-2">Time Zone</label>
                      <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>Asia/Manila (GMT+8)</option>
                        <option>Asia/Tokyo (GMT+9)</option>
                        <option>America/New_York (GMT-5)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-[#374151] mb-2">Date Format</label>
                      <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>MM/DD/YYYY</option>
                        <option>DD/MM/YYYY</option>
                        <option>YYYY-MM-DD</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline">Cancel</Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      Save Preferences
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === "privacy" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl text-[#1a1d29] mb-4">Privacy & Data Management</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex gap-3">
                        <Database className="size-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-yellow-900">Data Protection Notice</p>
                          <p className="text-xs text-yellow-800 mt-1">
                            Your data is protected under the Data Privacy Act of 2012 (Republic Act No. 10173)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="text-base text-[#1a1d29] mb-4">Data Access</h3>
                      <div className="space-y-3">
                        <Button variant="outline" className="w-full justify-start">
                          <Database className="size-4 mr-2" />
                          Download My Data
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Shield className="size-4 mr-2" />
                          View Activity Log
                        </Button>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="text-base text-[#1a1d29] mb-4">Privacy Settings</h3>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3">
                          <input type="checkbox" className="w-4 h-4 text-blue-600" defaultChecked />
                          <span className="text-sm text-[#374151]">Allow usage analytics</span>
                        </label>
                        <label className="flex items-center gap-3">
                          <input type="checkbox" className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-[#374151]">Share data for research purposes</span>
                        </label>
                        <label className="flex items-center gap-3">
                          <input type="checkbox" className="w-4 h-4 text-blue-600" defaultChecked />
                          <span className="text-sm text-[#374151]">Enable session logging</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline">Cancel</Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      Save Settings
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
