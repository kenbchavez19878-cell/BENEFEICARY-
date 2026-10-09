import { useState } from "react";
import {
  Search, Plus, Edit2, UserCheck, UserX, KeyRound, ChevronDown, X, Check,
  Shield, Users, UserCog, User, Briefcase,
} from "lucide-react";
import { Button } from "../ui/button";
import { STAFF_ACCOUNTS } from "../../data/staffAccounts";
import { SYSTEM_ACCOUNTS } from "../../data/systemAccounts";
import { toast } from "sonner";

interface UserRow {
  id: string;
  name: string;
  username: string;
  role: string;
  assignedModule: string;
  assignedServices: string[];
  status: "Active" | "Inactive";
  position: string;
}

const MODULE_LABELS: Record<string, string> = {
  "client-profiling": "Beneficiary Profiling & Records",
  "sectoral-services": "Sectoral Social Welfare Services",
  "emergency-crisis": "Emergency & Crisis Assistance",
  "employment-programs": "Employment & Livelihood Programs",
  "ofw-services": "OFW / OWWA Services",
  "reports": "Reports & System Administration",
  "": "—",
};

const SUBMODULE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  profiling: "Individual & Family Profiling",
  "children-youth": "Children & Youth Services",
  "women-solo-parent": "Women & Solo Parent Assistance",
  pwd: "PWD Services",
  elderly: "Elderly Services",
  disaster: "Disaster Assistance",
  aics: "AICS",
  "job-fair": "Job Fair Management",
  tupad: "TUPAD Program",
  dole: "DOLE Livelihood Assistance",
  sra: "Special Recruitment Activity",
  "ofw-profiling": "OFW Profiling",
  "owwa-officers": "OWWA Officer Organization",
};

const ROLE_COLORS: Record<string, string> = {
  HeadAccount: "bg-amber-100 text-amber-700 border-amber-200",
  Administrator: "bg-red-100 text-red-700 border-red-200",
  Supervisor: "bg-purple-100 text-purple-700 border-purple-200",
  Staff: "bg-blue-100 text-blue-700 border-blue-200",
  Beneficiary: "bg-green-100 text-green-700 border-green-200",
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  HeadAccount: <Shield className="size-3" />,
  Administrator: <UserCog className="size-3" />,
  Supervisor: <UserCheck className="size-3" />,
  Staff: <Users className="size-3" />,
  Beneficiary: <User className="size-3" />,
};

function buildUserRows(): UserRow[] {
  const rows: UserRow[] = [];
  for (const sa of SYSTEM_ACCOUNTS) {
    rows.push({
      id: sa.id,
      name: sa.name,
      username: sa.username,
      role: sa.role === "HeadAccount" ? "Head Account" : sa.role,
      assignedModule: sa.role === "HeadAccount" ? "reports" : "",
      assignedServices: [],
      status: sa.status,
      position: sa.position,
    });
  }
  for (const s of STAFF_ACCOUNTS) {
    rows.push({
      id: s.id,
      name: s.name,
      username: s.username,
      role: "Staff",
      assignedModule: s.assignedModule,
      assignedServices: s.assignedSubModules.filter(m => m !== "dashboard"),
      status: s.status,
      position: s.position,
    });
  }
  return rows;
}

const ROLE_KEY_MAP: Record<string, string> = {
  "Head Account": "HeadAccount",
  Administrator: "Administrator",
  Supervisor: "Supervisor",
  Staff: "Staff",
  Beneficiary: "Beneficiary",
};

export function UserManagement() {
  const [users, setUsers] = useState<UserRow[]>(buildUserRows);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);

  const roleOptions = ["All", "Head Account", "Administrator", "Supervisor", "Staff"];

  const filtered = users.filter(u => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "All" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  function toggleStatus(id: string) {
    setUsers(prev =>
      prev.map(u =>
        u.id === id ? { ...u, status: u.status === "Active" ? "Inactive" : "Active" } : u
      )
    );
    const user = users.find(u => u.id === id);
    if (user) {
      toast.success(`Account ${user.status === "Active" ? "deactivated" : "activated"}`, {
        description: `${user.name}'s account has been updated.`,
      });
    }
  }

  function handleEdit(user: UserRow) {
    setEditingUser({ ...user });
    setShowModal(true);
  }

  function handleSave() {
    if (!editingUser) return;
    setUsers(prev => prev.map(u => u.id === editingUser.id ? editingUser : u));
    toast.success("User updated", { description: `${editingUser.name}'s account has been saved.` });
    setShowModal(false);
    setEditingUser(null);
  }

  function handleResetPassword(user: UserRow) {
    toast.success("Password reset initiated", {
      description: `A password reset link has been sent to ${user.name}.`,
    });
  }

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      <div className="max-w-[1440px] mx-auto px-6 py-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-blue-900" style={{ fontFamily: "'Libre Franklin', sans-serif" }}>User Management</h2>
            <p className="text-sm text-gray-500 mt-0.5">{users.length} total system users</p>
          </div>
          <Button
            className="bg-blue-900 hover:bg-blue-800 text-white gap-2 self-start"
            onClick={() => toast.info("Create User form coming soon")}
          >
            <Plus className="size-4" />
            Create User
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or username..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 h-9 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {roleOptions.map(r => (
              <button
                key={r}
                onClick={() => setFilterRole(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  filterRole === r
                    ? "bg-blue-900 text-white border-blue-900"
                    : "bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:text-blue-900"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Assigned Module</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Assigned Services</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(user => {
                  const roleKey = ROLE_KEY_MAP[user.role] ?? user.role;
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs flex-shrink-0">
                            {user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-400">{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${ROLE_COLORS[roleKey] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                          {ROLE_ICONS[roleKey]}
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <span className="text-xs text-gray-600">
                          {MODULE_LABELS[user.assignedModule] ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {user.assignedServices.length > 0
                            ? user.assignedServices.slice(0, 2).map(s => (
                                <span key={s} className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs border border-blue-100">
                                  {SUBMODULE_LABELS[s] ?? s}
                                </span>
                              ))
                            : <span className="text-xs text-gray-400">—</span>
                          }
                          {user.assignedServices.length > 2 && (
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs">
                              +{user.assignedServices.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          user.status === "Active"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-gray-100 text-gray-500 border border-gray-200"
                        }`}>
                          <span className={`size-1.5 rounded-full ${user.status === "Active" ? "bg-green-500" : "bg-gray-400"}`} />
                          {user.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-700"
                            title="Edit user" onClick={() => handleEdit(user)}>
                            <Edit2 className="size-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-amber-50 hover:text-amber-700"
                            title="Reset password" onClick={() => handleResetPassword(user)}>
                            <KeyRound className="size-4" />
                          </Button>
                          <Button
                            variant="ghost" size="sm"
                            className={`h-8 w-8 p-0 ${user.status === "Active" ? "hover:bg-red-50 hover:text-red-600" : "hover:bg-green-50 hover:text-green-700"}`}
                            title={user.status === "Active" ? "Deactivate" : "Activate"}
                            onClick={() => toggleStatus(user.id)}
                          >
                            {user.status === "Active" ? <UserX className="size-4" /> : <UserCheck className="size-4" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="size-10 text-gray-300 mb-2" />
              <p className="text-gray-500 text-sm">No users found</p>
            </div>
          )}
          <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
            Showing {filtered.length} of {users.length} users
          </div>
        </div>

      </div>

      {/* Edit Modal */}
      {showModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-blue-900 px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-white" style={{ fontFamily: "'Libre Franklin', sans-serif" }}>Edit User</h3>
              <button onClick={() => setShowModal(false)} className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors">
                <X className="size-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Full Name</label>
                <input type="text" value={editingUser.name}
                  onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Username</label>
                <input type="text" value={editingUser.username}
                  onChange={e => setEditingUser({ ...editingUser, username: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Role</label>
                <div className="relative">
                  <select
                    value={editingUser.role}
                    onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white appearance-none pr-8"
                  >
                    {["Head Account", "Administrator", "Supervisor", "Staff"].map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Account Status</label>
                <div className="flex gap-3">
                  {(["Active", "Inactive"] as const).map(s => (
                    <button key={s} type="button"
                      onClick={() => setEditingUser({ ...editingUser, status: s })}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
                        editingUser.status === s
                          ? s === "Active" ? "border-green-400 bg-green-50 text-green-700" : "border-gray-400 bg-gray-100 text-gray-600"
                          : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {s === "Active" ? <Check className="size-4" /> : <X className="size-4" />}
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button className="flex-1 bg-blue-900 hover:bg-blue-800 text-white" onClick={handleSave}>
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
