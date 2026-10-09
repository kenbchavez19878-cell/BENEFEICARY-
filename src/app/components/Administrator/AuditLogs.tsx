import { useState } from "react";
import { Search, Download, Filter, Calendar, CheckCircle, AlertCircle, Info, Eye } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";

interface AuditEntry {
  id: string;
  user: string;
  role: string;
  action: string;
  module: string;
  dateTime: string;
  status: "Success" | "Failed" | "Pending";
}

const AUDIT_DATA: AuditEntry[] = [
  { id: "AL-001", user: "Juan Dela Cruz", role: "Staff", action: "Updated CICL application #BC-2204", module: "Sectoral Services", dateTime: "Oct 24, 2024 · 10:32 AM", status: "Success" },
  { id: "AL-002", user: "Carlos Villanueva", role: "Staff", action: "Created TUPAD beneficiary record for M. Ramos", module: "Employment Programs", dateTime: "Oct 24, 2024 · 10:15 AM", status: "Success" },
  { id: "AL-003", user: "MSWD Head Officer", role: "Head Account", action: "Viewed audit logs", module: "Reports & Administration", dateTime: "Oct 24, 2024 · 09:58 AM", status: "Success" },
  { id: "AL-004", user: "System Administrator", role: "Administrator", action: "Created new user account for P. Garcia", module: "User Management", dateTime: "Oct 24, 2024 · 09:40 AM", status: "Success" },
  { id: "AL-005", user: "Rosa Mendoza", role: "Staff", action: "Approved medical assistance request #MA-0981", module: "Emergency & Crisis", dateTime: "Oct 24, 2024 · 09:20 AM", status: "Success" },
  { id: "AL-006", user: "Elena Bautista", role: "Staff", action: "Submitted DOLE assistance report Q3-2024", module: "Employment Programs", dateTime: "Oct 23, 2024 · 04:55 PM", status: "Success" },
  { id: "AL-007", user: "Miguel Torres", role: "Staff", action: "Registered OFW profile for A. Cruz (Saudi Arabia)", module: "OFW Services", dateTime: "Oct 23, 2024 · 04:30 PM", status: "Success" },
  { id: "AL-008", user: "MSWD Head Officer", role: "Head Account", action: "Changed staff module assignment for Staff 3", module: "User Management", dateTime: "Oct 23, 2024 · 03:15 PM", status: "Success" },
  { id: "AL-009", user: "Ana Reyes", role: "Staff", action: "Submitted supplementary feeding attendance — Oct batch", module: "Sectoral Services", dateTime: "Oct 23, 2024 · 02:40 PM", status: "Success" },
  { id: "AL-010", user: "Pedro Garcia", role: "Staff", action: "Updated PWD registration #PWD-4421", module: "Sectoral Services", dateTime: "Oct 23, 2024 · 02:10 PM", status: "Success" },
  { id: "AL-011", user: "System Administrator", role: "Administrator", action: "Generated monthly beneficiary report — October 2024", module: "Reports & Administration", dateTime: "Oct 23, 2024 · 01:30 PM", status: "Success" },
  { id: "AL-012", user: "Maria Santos", role: "Staff", action: "Added family profile — Santos household (Brgy. Salvacion)", module: "Beneficiary Profiling", dateTime: "Oct 23, 2024 · 11:45 AM", status: "Success" },
  { id: "AL-013", user: "Juan Dela Cruz", role: "Staff", action: "Failed login attempt", module: "Authentication", dateTime: "Oct 22, 2024 · 08:05 AM", status: "Failed" },
  { id: "AL-014", user: "Rosa Mendoza", role: "Staff", action: "Submitted disaster relief request — pending supervisor review", module: "Emergency & Crisis", dateTime: "Oct 22, 2024 · 09:50 AM", status: "Pending" },
  { id: "AL-015", user: "Program Supervisor", role: "Supervisor", action: "Approved quarterly program performance report", module: "Reports & Administration", dateTime: "Oct 21, 2024 · 03:00 PM", status: "Success" },
];

const STATUS_CONFIG = {
  Success: { color: "bg-green-50 text-green-700 border-green-200", icon: <CheckCircle className="size-3" /> },
  Failed: { color: "bg-red-50 text-red-700 border-red-200", icon: <AlertCircle className="size-3" /> },
  Pending: { color: "bg-amber-50 text-amber-700 border-amber-200", icon: <Info className="size-3" /> },
};

const ROLE_COLORS: Record<string, string> = {
  "Head Account": "bg-amber-100 text-amber-700",
  Administrator: "bg-red-100 text-red-700",
  Supervisor: "bg-purple-100 text-purple-700",
  Staff: "bg-blue-100 text-blue-700",
};

const MODULE_LIST = ["All Modules", "Sectoral Services", "Employment Programs", "Emergency & Crisis", "OFW Services", "Beneficiary Profiling", "Reports & Administration", "User Management", "Authentication"];
const ROLE_LIST = ["All Roles", "Head Account", "Administrator", "Supervisor", "Staff"];

export function AuditLogs() {
  const [search, setSearch] = useState("");
  const [filterModule, setFilterModule] = useState("All Modules");
  const [filterRole, setFilterRole] = useState("All Roles");
  const [filterStatus, setFilterStatus] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = AUDIT_DATA.filter(entry => {
    const matchSearch =
      entry.user.toLowerCase().includes(search.toLowerCase()) ||
      entry.action.toLowerCase().includes(search.toLowerCase()) ||
      entry.id.toLowerCase().includes(search.toLowerCase());
    const matchModule = filterModule === "All Modules" || entry.module === filterModule;
    const matchRole = filterRole === "All Roles" || entry.role === filterRole;
    const matchStatus = filterStatus === "All" || entry.status === filterStatus;
    return matchSearch && matchModule && matchRole && matchStatus;
  });

  function handleExport() {
    toast.success("Audit log exported", { description: "audit_log_oct2024.csv has been downloaded." });
  }

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      <div className="max-w-[1440px] mx-auto px-6 py-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-blue-900" style={{ fontFamily: "'Libre Franklin', sans-serif" }}>Audit Logs</h2>
            <p className="text-sm text-gray-500 mt-0.5">System activity and access history</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 border-gray-300 text-gray-700 hover:border-blue-300"
              onClick={() => setShowFilters(!showFilters)}>
              <Filter className="size-4" />
              Filters
            </Button>
            <Button className="bg-blue-900 hover:bg-blue-800 text-white gap-2" onClick={handleExport}>
              <Download className="size-4" />
              Export Logs
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by user, action, or log ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 h-10 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          />
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Module</label>
              <select value={filterModule} onChange={e => setFilterModule(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                {MODULE_LIST.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Role</label>
              <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                {ROLE_LIST.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Status</label>
              <div className="flex gap-2">
                {["All", "Success", "Failed", "Pending"].map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      filterStatus === s
                        ? "bg-blue-900 text-white border-blue-900"
                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-300"
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Log ID</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Action Performed</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Module</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    <span className="flex items-center gap-1"><Calendar className="size-3" />Date & Time</span>
                  </th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(entry => {
                  const statusCfg = STATUS_CONFIG[entry.status];
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{entry.id}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs flex-shrink-0">
                            {entry.user.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-xs">{entry.user}</p>
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${ROLE_COLORS[entry.role] ?? "bg-gray-100 text-gray-600"}`}>
                              {entry.role}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell max-w-xs">
                        <p className="text-sm text-gray-700 line-clamp-2">{entry.action}</p>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <span className="text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-lg">{entry.module}</span>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <p className="text-xs text-gray-500">{entry.dateTime}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusCfg.color}`}>
                          {statusCfg.icon}
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-50"
                          onClick={() => toast.info(`Log ${entry.id}`, { description: entry.action })}>
                          <Eye className="size-4 text-gray-400" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Search className="size-10 text-gray-300 mb-2" />
              <p className="text-gray-500 text-sm">No audit logs match your filters</p>
            </div>
          )}
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">Showing {filtered.length} of {AUDIT_DATA.length} entries</p>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-gray-500 hover:text-blue-700" onClick={handleExport}>
              <Download className="size-3.5" /> Export filtered results
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
