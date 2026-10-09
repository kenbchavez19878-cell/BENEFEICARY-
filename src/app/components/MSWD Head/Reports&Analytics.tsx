import React, { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { 
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line 
} from "recharts";
import { toast } from "sonner";

// ALL Lucide icons perfectly unified in ONE import to prevent duplicate errors
import { 
  Users as UsersIcon, 
  Download, 
  Search, 
  ChevronDown, 
  X, 
  TrendingUp, 
  Eye, 
  Edit, 
  FileText, 
  BarChart3, 
  Calendar,
  CheckCircle2, 
  Clock, 
  Printer,
  LayoutDashboard, 
  HeartHandshake, 
  Building2,
  Plus 
} from "lucide-react";

interface BeneficiaryRecord {
  id: string;
  date: string;
  beneficiary: {
    name: string;
    id: string;
    avatar: string;
    age?: number;
    gender?: string;
    address?: string;
    phone?: string;
  };
  sector: string;
  sectorColor: string;
  serviceType: string;
  status: string;
  statusColor: string;
  statusDot: string;
  amount?: string;
}

interface FrontlineCrisisProps {
  onNavigate?: (view: string) => void;
}

export function ReportsAnalytics({ onNavigate }: FrontlineCrisisProps) {
  const [activeView, setActiveView] = useState("dashboard");

  const [searchQuery, setSearchQuery] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("today");
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Monthly enrollment trend data
  const enrollmentData = [
    { month: "Jan", beneficiaries: 420 },
    { month: "Feb", beneficiaries: 510 },
    { month: "Mar", beneficiaries: 380 },
    { month: "Apr", beneficiaries: 590 },
    { month: "May", beneficiaries: 670 },
    { month: "Jun", beneficiaries: 710 },
  ];

  // Sector distribution data
  const distributionData = [
    { name: "Women & Solo Parent", value: 1, color: "#a855f7" },
    { name: "Children & Youth", value: 1, color: "#3b82f6" },
    { name: "PWD", value: 1, color: "#14b8a6" },
    { name: "Elderly", value: 0, color: "#f59e0b" },
    { name: "Feeding", value: 1, color: "#22c55e" },
    { name: "Day Care", value: 1, color: "#ec4899" },
    { name: "CICL", value: 1, color: "#f97316" },
  ];

  // Sample records
  const allRecords: BeneficiaryRecord[] = [
    {
      id: "REC-001",
      date: "Dec 12, 2024",
      beneficiary: { name: "Maria Santos", id: "8921", avatar: "MS" },
      sector: "Solo Parent", sectorColor: "bg-purple-100 text-purple-700",
      serviceType: "Financial Assistance", status: "Approved",
      statusColor: "text-green-600", statusDot: "bg-green-600", amount: "₱5,000",
    },
    {
      id: "REC-002",
      date: "Dec 11, 2024",
      beneficiary: { name: "Juan Dela Cruz", id: "8204", avatar: "JC" },
      sector: "PWD", sectorColor: "bg-teal-100 text-teal-700",
      serviceType: "Medical Support", status: "Pending",
      statusColor: "text-amber-600", statusDot: "bg-amber-600", amount: "₱12,000",
    },
    {
      id: "REC-003",
      date: "Dec 10, 2024",
      beneficiary: { name: "Lorna Reyes", id: "9932", avatar: "LR" },
      sector: "Elderly", sectorColor: "bg-amber-100 text-amber-700",
      serviceType: "Pension Update", status: "Approved",
      statusColor: "text-green-600", statusDot: "bg-green-600", amount: "₱3,500",
    },
    {
      id: "REC-004",
      date: "Dec 9, 2024",
      beneficiary: { name: "Baby Anna Cruz", id: "1120", avatar: "BC" },
      sector: "Feeding", sectorColor: "bg-green-100 text-green-700",
      serviceType: "Milk Supplement", status: "In Progress",
      statusColor: "text-blue-600", statusDot: "bg-blue-600", amount: "₱2,500",
    },
    {
      id: "REC-005",
      date: "Dec 8, 2024",
      beneficiary: { name: "Rosa Martinez", id: "7845", avatar: "RM" },
      sector: "Solo Parent", sectorColor: "bg-purple-100 text-purple-700",
      serviceType: "Educational Support", status: "Approved",
      statusColor: "text-green-600", statusDot: "bg-green-600", amount: "₱8,000",
    },
    {
      id: "REC-006",
      date: "Dec 7, 2024",
      beneficiary: { name: "Pedro Gonzales", id: "6523", avatar: "PG" },
      sector: "Children & Youth", sectorColor: "bg-blue-100 text-blue-700",
      serviceType: "Educational Scholarship", status: "Pending",
      statusColor: "text-amber-600", statusDot: "bg-amber-600", amount: "₱15,000",
    },
  ];

  const handleViewRecord = (record: BeneficiaryRecord) => {
    toast.info(`Viewing record for ${record.beneficiary.name}`);
  };

  const handleEditRecord = (record: BeneficiaryRecord) => {
    toast.info(`Editing record for ${record.beneficiary.name}`);
  };

  const filteredRecords = allRecords.filter((record) => {
    const matchesSearch = searchQuery === "" || 
      record.beneficiary.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.beneficiary.id.includes(searchQuery);

    const matchesSector = sectorFilter === "all" ||
      (sectorFilter === "solo-parent" && record.sector === "Solo Parent") ||
      (sectorFilter === "pwd" && record.sector === "PWD") ||
      (sectorFilter === "elderly" && record.sector === "Elderly") ||
      (sectorFilter === "feeding" && record.sector === "Feeding") ||
      (sectorFilter === "children" && record.sector === "Children & Youth");

    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "approved" && record.status === "Approved") ||
      (statusFilter === "pending" && record.status === "Pending") ||
      (statusFilter === "in-progress" && record.status === "In Progress");

    return matchesSearch && matchesSector && matchesStatus;
  });

  const handleExport = (format: string) => {
    toast.success(`Exporting ${filteredRecords.length} records as ${format}...`);
    setShowExportMenu(false);
  };

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100 pb-10">
      {/* Page Header (Title) */}
      <div className="bg-white border-b border-gray-200 py-4 mb-6">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1
                className="text-2xl font-bold text-blue-900"
                style={{ fontFamily: "Arial, Calibri, 'Segoe UI', sans-serif" }}
              >
                Reports & Analytics
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* ========================================= */}
        {/* CONTENT AREA (Conditional Rendering) */}
        {/* ========================================= */}
        <div className="mt-8">
          
          {/* Dashboard Content */}
          {activeView === "dashboard" && (
            <div className="space-y-6">
              
              {/* Top Stats Grid - 4 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-blue-500 bg-white rounded-xl shadow-sm hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="size-9 rounded-xl bg-blue-50 flex items-center justify-center">
                        <UsersIcon className="size-4 text-blue-600" />
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50">
                        <TrendingUp className="size-3 text-blue-600" />
                        <span className="text-xs text-blue-600">+8.2%</span>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Active Cases</p>
                    <p className="text-2xl font-normal text-gray-900 mb-2">4</p>
                    <p className="text-xs text-gray-500">Across all sectors</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500 bg-white rounded-xl shadow-sm hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="size-9 rounded-xl bg-green-50 flex items-center justify-center">
                        <CheckCircle2 className="size-4 text-green-600" />
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-50">
                        <CheckCircle2 className="size-3 text-green-600" />
                        <span className="text-xs text-green-600">Active</span>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Approved Services</p>
                    <p className="text-2xl font-normal text-gray-900 mb-2">3</p>
                    <p className="text-xs text-gray-500">All operational</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500 bg-white rounded-xl shadow-sm hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="size-9 rounded-xl bg-orange-50 flex items-center justify-center">
                        <Clock className="size-4 text-orange-600" />
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-50">
                        <Clock className="size-3 text-orange-600" />
                        <span className="text-xs text-orange-600">Urgent</span>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Pending Applications</p>
                    <p className="text-2xl font-normal text-gray-900 mb-2">1</p>
                    <p className="text-xs text-gray-500">Awaiting review</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500 bg-white rounded-xl shadow-sm hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="size-9 rounded-xl bg-purple-50 flex items-center justify-center">
                        <Calendar className="size-4 text-purple-600" />
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-50">
                        <TrendingUp className="size-3 text-purple-600" />
                        <span className="text-xs text-purple-600">+12%</span>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Completed Interventions</p>
                    <p className="text-2xl font-normal text-gray-900 mb-2">2</p>
                    <p className="text-xs text-gray-500">New enrollments</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-[20px] text-[#1a1d29] mb-1">Monthly Enrollment Trend</h3>
                          <p className="text-sm text-[#6b7280]">Beneficiaries enrolled per month</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => toast.success("Opening detailed report...")}
                        >
                          <BarChart3 className="size-4" />
                          View Report
                        </Button>
                      </div>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={enrollmentData}>
                          <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis key="x-axis" dataKey="month" stroke="#6b7280" fontSize={12} />
                          <YAxis key="y-axis" stroke="#6b7280" fontSize={12} />
                          <Tooltip
                            key="tooltip"
                            contentStyle={{
                              backgroundColor: '#fff',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}
                          />
                          <Line
                            key="beneficiaries"
                            type="monotone"
                            dataKey="beneficiaries"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={{ fill: '#3b82f6', r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm h-full">
                    <CardContent className="p-4">
                      <div className="mb-6">
                        <h3 className="text-[20px] text-[#1a1d29] mb-1">Sector Distribution</h3>
                        <p className="text-sm text-[#6b7280]">By beneficiary count</p>
                      </div>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={distributionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {distributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            key="tooltip"
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-4 space-y-2 max-h-[140px] overflow-y-auto">
                        {distributionData.map((item) => (
                          <div key={item.name} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div className="size-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                              <span className="text-[#6b7280] truncate">{item.name}</span>
                            </div>
                            <span className="text-[#1a1d29]">{item.value.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Filters & Search */}
              <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by name or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="size-4" />
                        </button>
                      )}
                    </div>

                    <div className="relative min-w-[160px]">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm appearance-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 pr-10 cursor-pointer transition-all"
                      >
                        <option value="all">All Status</option>
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                    </div>

                    <div className="relative min-w-[180px]">
                      <select
                        value={sectorFilter}
                        onChange={(e) => setSectorFilter(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm appearance-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 pr-10 cursor-pointer transition-all"
                      >
                        <option value="all">All Sectors</option>
                        <option value="solo-parent">Solo Parent</option>
                        <option value="pwd">PWD</option>
                        <option value="elderly">Elderly</option>
                        <option value="feeding">Feeding</option>
                        <option value="children">Children & Youth</option>
                        <option value="daycare">Day Care</option>
                        <option value="cicl">CICL</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                    </div>

                    <div className="relative min-w-[160px]">
                      <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm appearance-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 pr-10 cursor-pointer transition-all"
                      >
                        <option value="today">Today</option>
                        <option value="this-week">This Week</option>
                        <option value="this-month">This Month</option>
                        <option value="this-year">This Year</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                    </div>

                    <div className="relative">
                      <Button 
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 transition-colors active:bg-blue-800 gap-2"
                        onClick={() => setShowExportMenu(!showExportMenu)}
                      >
                        <Download className="size-4" />
                        Export
                      </Button>

                      {showExportMenu && (
                        <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[160px]">
                          <div className="py-1">
                            <button
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                              onClick={() => handleExport("Excel")}
                            >
                              <FileText className="size-4 text-green-600" />
                              <span className="text-sm text-gray-900">Excel</span>
                            </button>
                            <button
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                              onClick={() => handleExport("PDF")}
                            >
                              <FileText className="size-4 text-red-600" />
                              <span className="text-sm text-gray-900">PDF</span>
                            </button>
                            <button
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                              onClick={() => {
                                toast.info("Printing records...");
                                setShowExportMenu(false);
                                window.print();
                              }}
                            >
                              <Printer className="size-4 text-blue-600" />
                              <span className="text-sm text-gray-900">Print</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Records Table */}
              <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm mt-6">
                <CardContent className="p-0">
                  <div className="p-6 border-b border-gray-200">
                    <div>
                      <h2 className="text-[20px] text-[#1a1d29] mb-1">Recent Records</h2>
                      <p className="text-sm text-[#6b7280]">Latest beneficiary assistance records</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase tracking-wider">Beneficiary</th>
                          <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase tracking-wider">Sector</th>
                          <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase tracking-wider">Service Type</th>
                          <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredRecords.map((record) => (
                          <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 text-sm text-gray-600">{record.date}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="size-10">
                                  <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                                    {record.beneficiary.avatar}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{record.beneficiary.name}</p>
                                  <p className="text-xs text-gray-500">ID: {record.beneficiary.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge className={`${record.sectorColor} border-0`}>
                                {record.sector}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{record.serviceType}</td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.amount}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className={`size-2 rounded-full ${record.statusDot}`}></span>
                                <span className={`text-sm font-medium ${record.statusColor}`}>{record.status}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 hover:bg-blue-50"
                                  onClick={() => handleViewRecord(record)}
                                >
                                  <Eye className="size-4 text-blue-600" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 hover:bg-green-50"
                                  onClick={() => handleEditRecord(record)}
                                >
                                  <Edit className="size-4 text-green-600" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
                    <p>Showing {filteredRecords.length} of {allRecords.length} results</p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" disabled className="disabled:opacity-50">Previous</Button>
                      <Button variant="outline" size="sm" disabled className="disabled:opacity-50">Next</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}