import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  FolderOpen,
  CheckCircle2,
  Wallet,
  ArrowRight,
  Calendar,
  Clock,
  RotateCw,
  Baby,
  ShieldCheck,
  MapPin,
  Sparkles,
  Layers,
  Activity,
  HeartHandshake
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts";
import { toast } from "sonner";
import { 
  apiGetDashboardStats, 
  subscribeDataUpdated, 
  type DashboardStats 
} from "../../services/caseService";

interface MainDashboardProps {
  onNavigate?: (view: string) => void;
  userRole?: string;
}

const DEFAULT_STATS: DashboardStats = {
  totalBeneficiaries: 0,
  activeCases: 0,
  approvedReleasedCases: 0,
  totalDisbursed: 0,
  categoryBreakdown: [
    { name: "Solo Parent", value: 0, color: "#10b981" },
    { name: "Women / VAWC", value: 0, color: "#a855f7" },
  ],
  aicsBreakdown: [
    { name: "Medical", value: 0, color: "#3b82f6" },
    { name: "Burial", value: 0, color: "#f97316" },
    { name: "Transportation", value: 0, color: "#eab308" },
    { name: "Economic Relief", value: 0, color: "#10b981" },
    { name: "Balik Probinsya", value: 0, color: "#8b5cf6" },
  ],
  barangayDistribution: [],
  recentActivities: [],
};

export function MainDashboard({ onNavigate = () => {}, userRole = "Staff" }: MainDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadStats = useCallback(async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true);
      const data = await apiGetDashboardStats();
      if (data) {
        setStats(data);
        if (showToast) toast.success("Dashboard metrics updated with live PostgreSQL data");
      }
    } catch (err: any) {
      console.warn("[Dashboard] Could not fetch live statistics:", err);
      if (showToast) toast.error("Could not refresh dashboard statistics");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    // Subscribe to real-time events triggered by case creation or 8-step updates
    const unsubscribe = subscribeDataUpdated(() => {
      loadStats();
    });
    return unsubscribe;
  }, [loadStats]);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Calculate Solo Parent vs. VAWC stats
  const soloCount = stats.categoryBreakdown.find((c) => c.name === "Solo Parent")?.value || 0;
  const vawcCount = stats.categoryBreakdown.find((c) => c.name.includes("VAWC"))?.value || 0;
  const womenSoloTotal = soloCount + vawcCount || 1;
  const soloPercent = Math.round((soloCount / womenSoloTotal) * 100);
  const vawcPercent = Math.round((vawcCount / womenSoloTotal) * 100);

  // Solo Parent vs VAWC Chart Data
  const soloVawcChartData = [
    { name: "Solo Parent", value: soloCount, color: "#10b981" },
    { name: "Women / VAWC", value: vawcCount, color: "#a855f7" },
  ];

  // AICS Crisis Type Chart Data
  const aicsChartData = stats.aicsBreakdown && stats.aicsBreakdown.length > 0
    ? stats.aicsBreakdown
    : [
        { name: "Medical", value: 0, color: "#3b82f6" },
        { name: "Burial", value: 0, color: "#f97316" },
        { name: "Transportation", value: 0, color: "#eab308" },
        { name: "Economic Relief", value: 0, color: "#10b981" },
        { name: "Balik Probinsya", value: 0, color: "#8b5cf6" },
      ];

  const totalAicsCount = aicsChartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      <div className="max-w-[1600px] mx-auto px-6 sm:px-8 py-8 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1
                className="text-2xl font-semibold text-blue-900 tracking-tight"
                style={{ fontFamily: "'Libre Franklin', sans-serif" }}
              >
                Municipal Welfare Dashboard
              </h1>
              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-[11px] font-medium gap-1 px-2 py-0.5">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live PostgreSQL Sync
              </Badge>
            </div>
            <p className="text-[14px] text-gray-500 mt-1">
              Welcome back, {userRole} — {today}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Calabanga Social Welfare &amp; Development — Real-Time Program Administration
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              onClick={() => loadStats(true)}
              className="gap-2 border-gray-200 text-gray-700 hover:bg-gray-100 text-xs h-9 bg-white shadow-xs"
            >
              <RotateCw className={`size-3.5 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
              {isRefreshing ? "Refreshing..." : "Refresh Data"}
            </Button>

            <Button
              size="sm"
              onClick={() => onNavigate("women-solo-parent")}
              className="gap-1.5 bg-blue-900 hover:bg-blue-800 text-white text-xs h-9 shadow-sm"
            >
              <Baby className="size-3.5" />
              Solo Parent / VAWC
            </Button>

            <Button
              size="sm"
              onClick={() => onNavigate("aics")}
              className="gap-1.5 bg-indigo-900 hover:bg-indigo-800 text-white text-xs h-9 shadow-sm"
            >
              <HeartHandshake className="size-3.5" />
              AICS Crisis
            </Button>
          </div>
        </div>

        {/* 1. SUMMARY METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Total Beneficiaries Profiled */}
          <Card className="border-l-4 border-l-blue-600 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Users className="size-5 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                  Total Profiled
                </span>
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Total Beneficiaries Profiled
              </p>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {isLoading ? "—" : stats.totalBeneficiaries}
              </p>
              <p className="text-xs text-gray-400">
                Sum of Women, Solo Parent &amp; AICS cases
              </p>
            </CardContent>
          </Card>

          {/* Active / Pending Cases */}
          <Card className="border-l-4 border-l-amber-500 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="size-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <FolderOpen className="size-5 text-amber-600" />
                </div>
                <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  Under Review
                </span>
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Active / Pending Cases
              </p>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {isLoading ? "—" : stats.activeCases}
              </p>
              <p className="text-xs text-gray-400">
                Endorsed, Under Review &amp; In Assessment
              </p>
            </CardContent>
          </Card>

          {/* Approved / Released Cases */}
          <Card className="border-l-4 border-l-emerald-600 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="size-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="size-5 text-emerald-600" />
                </div>
                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Approved
                </span>
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Approved / Released Cases
              </p>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {isLoading ? "—" : stats.approvedReleasedCases}
              </p>
              <p className="text-xs text-gray-400">
                Approved for release &amp; Disbursed payouts
              </p>
            </CardContent>
          </Card>

          {/* Total Financial Aid Disbursed */}
          <Card className="border-l-4 border-l-violet-600 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="size-10 rounded-xl bg-violet-50 flex items-center justify-center">
                  <Wallet className="size-5 text-violet-600" />
                </div>
                <span className="text-xs font-medium text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
                  Disbursed
                </span>
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Total Financial Aid Disbursed
              </p>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {isLoading ? "—" : `₱${stats.totalDisbursed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </p>
              <p className="text-xs text-gray-400">
                Sum of released financial assistance (PHP)
              </p>
            </CardContent>
          </Card>

        </div>

        {/* 2. MODULE BREAKDOWN WIDGETS & CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Solo Parent vs. VAWC Breakdown Widget */}
          <Card className="bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col">
            <CardContent className="p-5 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3
                    className="text-base font-semibold text-blue-900"
                    style={{ fontFamily: "'Libre Franklin', sans-serif" }}
                  >
                    Solo Parent vs. VAWC
                  </h3>
                  <p className="text-xs text-gray-400">
                    Women &amp; Solo Parent Module Distribution
                  </p>
                </div>
                <Badge variant="outline" className="text-xs text-emerald-700 bg-emerald-50 border-emerald-200">
                  {soloCount + vawcCount} Cases
                </Badge>
              </div>

              <div className="flex-1 flex flex-col justify-center items-center py-2">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={soloVawcChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {soloVawcChartData.map((entry, index) => (
                        <Cell key={`sp-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="grid grid-cols-2 gap-3 w-full mt-3">
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-900 mb-0.5">
                      <Baby className="size-3.5 text-emerald-700" />
                      Solo Parent
                    </div>
                    <div className="text-lg font-bold text-emerald-800">{soloCount}</div>
                    <div className="text-[11px] text-emerald-600">{soloPercent}% of module</div>
                  </div>

                  <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-purple-900 mb-0.5">
                      <ShieldCheck className="size-3.5 text-purple-700" />
                      Women / VAWC
                    </div>
                    <div className="text-lg font-bold text-purple-800">{vawcCount}</div>
                    <div className="text-[11px] text-purple-600">{vawcPercent}% of module</div>
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-3 text-xs text-blue-900 hover:text-blue-700 hover:bg-blue-50 gap-1 border border-gray-100"
                onClick={() => onNavigate("women-solo-parent")}
              >
                Open Women &amp; Solo Parent Module
                <ArrowRight className="size-3.5" />
              </Button>
            </CardContent>
          </Card>

          {/* AICS Crisis Type Distribution Chart */}
          <Card className="bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col">
            <CardContent className="p-5 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3
                    className="text-base font-semibold text-blue-900"
                    style={{ fontFamily: "'Libre Franklin', sans-serif" }}
                  >
                    AICS Crisis Type Distribution
                  </h3>
                  <p className="text-xs text-gray-400">
                    Emergency assistance categories
                  </p>
                </div>
                <Badge variant="outline" className="text-xs text-blue-700 bg-blue-50 border-blue-200">
                  {totalAicsCount} AICS Cases
                </Badge>
              </div>

              <div className="flex-1">
                <ResponsiveContainer width="100%" height={170}>
                  <BarChart data={aicsChartData} barSize={26}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "12px" }}
                      labelStyle={{ fontWeight: 600, color: "#1e3a8a" }}
                    />
                    <Bar dataKey="value" name="Cases" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                      {aicsChartData.map((entry, index) => (
                        <Cell key={`aics-cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-2 text-[11px] text-gray-500">
                  {aicsChartData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.name}:</span>
                      <span className="font-semibold text-gray-700">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-3 text-xs text-blue-900 hover:text-blue-700 hover:bg-blue-50 gap-1 border border-gray-100"
                onClick={() => onNavigate("aics")}
              >
                Open AICS Module
                <ArrowRight className="size-3.5" />
              </Button>
            </CardContent>
          </Card>

          {/* Barangay Distribution Breakdown Widget */}
          <Card className="bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col">
            <CardContent className="p-5 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3
                    className="text-base font-semibold text-blue-900"
                    style={{ fontFamily: "'Libre Franklin', sans-serif" }}
                  >
                    Barangay Distribution
                  </h3>
                  <p className="text-xs text-gray-400">
                    Highest profiled communities
                  </p>
                </div>
                <div className="size-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700">
                  <MapPin className="size-4" />
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto max-h-[220px] pr-1">
                {stats.barangayDistribution && stats.barangayDistribution.length > 0 ? (
                  stats.barangayDistribution.map((b, idx) => {
                    const maxVal = stats.barangayDistribution[0]?.count || 1;
                    const pct = Math.min(100, Math.round((b.count / maxVal) * 100));
                    return (
                      <div key={idx} className="text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-800 flex items-center gap-1.5">
                            <span className="text-[10px] text-gray-400 font-mono">#{idx + 1}</span>
                            Brgy. {b.barangay}
                          </span>
                          <span className="font-semibold text-blue-900">
                            {b.count} {b.count === 1 ? "case" : "cases"}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-400 text-xs">
                    No barangay distribution data recorded yet.
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 text-[11px] text-gray-500 flex items-center justify-between">
                <span>Coverage:</span>
                <span className="font-medium text-gray-700">
                  {stats.barangayDistribution.length} Active Barangays in Calabanga
                </span>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* 3. RECENT ACTIVITY FEED / AUDIT TRAIL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2">
            <Card className="bg-white border border-gray-100 rounded-2xl shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-800">
                      <Activity className="size-4" />
                    </div>
                    <div>
                      <h3
                        className="text-base font-semibold text-blue-900"
                        style={{ fontFamily: "'Libre Franklin', sans-serif" }}
                      >
                        Recent Activity Feed &amp; Audit Trail
                      </h3>
                      <p className="text-xs text-gray-400">
                        Real-time log of registrations, document verifications, and 8-step workflow updates
                      </p>
                    </div>
                  </div>

                  <Badge variant="outline" className="text-xs text-gray-600 border-gray-200">
                    Live Event Stream
                  </Badge>
                </div>

                <div className="space-y-3">
                  {stats.recentActivities && stats.recentActivities.length > 0 ? (
                    stats.recentActivities.map((act) => {
                      const isApproved = act.status?.includes("APPROVED") || act.status?.includes("RELEASED") || act.status?.includes("CLOSED");
                      const isPending = act.status?.includes("ENDORSED") || act.status?.includes("REVIEW") || act.status?.includes("ASSESSMENT");

                      return (
                        <div
                          key={act.id}
                          className="flex items-start gap-3.5 p-3.5 rounded-xl border border-gray-100 hover:bg-gray-50/70 hover:border-gray-200 transition-all"
                        >
                          <div className={`size-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isApproved 
                              ? "bg-emerald-100 text-emerald-800" 
                              : isPending 
                              ? "bg-amber-100 text-amber-800" 
                              : "bg-blue-100 text-blue-800"
                          }`}>
                            {act.clientName ? act.clientName.slice(0, 2).toUpperCase() : "BE"}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                              <div>
                                <span className="text-sm font-semibold text-gray-900">
                                  {act.clientName}
                                </span>
                                <span className="text-xs text-gray-400 ml-2 font-mono">
                                  {act.clientId}
                                </span>
                                {act.barangay && (
                                  <span className="text-xs text-gray-500 ml-2">
                                    • Brgy. {act.barangay}
                                  </span>
                                )}
                              </div>

                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap self-start sm:self-auto ${
                                isApproved
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : isPending
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                              }`}>
                                {act.statusLabel || act.status || "Updated"}
                              </span>
                            </div>

                            <p className="text-xs font-medium text-blue-900 mb-0.5">
                              {act.title}
                            </p>

                            {act.description && (
                              <p className="text-xs text-gray-600 mb-1.5 leading-relaxed">
                                {act.description}
                              </p>
                            )}

                            <div className="flex items-center gap-4 text-[11px] text-gray-400">
                              <span className="flex items-center gap-1 font-medium text-gray-500">
                                <Layers className="size-3 text-gray-400" />
                                {act.program}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="size-3 text-gray-400" />
                                {act.date}
                              </span>
                              {act.author && (
                                <span className="hidden sm:inline-block text-gray-400">
                                  By: {act.author}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-10 text-gray-400 text-xs">
                      No recent activities recorded. Create a beneficiary profile to begin logging.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & System Status */}
          <div className="space-y-6">
            
            <Card className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="size-4 text-blue-300" />
                <h4 className="text-sm font-semibold tracking-tight text-white">
                  MSWD Quick Registration
                </h4>
              </div>
              <p className="text-xs text-blue-200 mb-4 leading-relaxed">
                Register new beneficiaries or emergency crisis intakes with instant PostgreSQL database persistence and automated tracking IDs.
              </p>

              <div className="space-y-2.5">
                <Button
                  onClick={() => onNavigate("women-solo-parent")}
                  className="w-full bg-white text-blue-950 hover:bg-blue-50 font-semibold text-xs h-9 justify-start px-3.5 gap-2 shadow-xs"
                >
                  <Baby className="size-3.5 text-blue-700" />
                  + Register Solo Parent / VAWC
                </Button>

                <Button
                  onClick={() => onNavigate("aics")}
                  className="w-full bg-blue-800/80 hover:bg-blue-800 text-white font-semibold text-xs h-9 justify-start px-3.5 gap-2 border border-blue-700/60"
                >
                  <HeartHandshake className="size-3.5 text-blue-300" />
                  + Register AICS Crisis Client
                </Button>
              </div>
            </Card>

            <Card className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
              <h4
                className="text-sm font-semibold text-blue-900 mb-3"
                style={{ fontFamily: "'Libre Franklin', sans-serif" }}
              >
                Official 8-Step Workflow Status
              </h4>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <span className="text-gray-600">1. Barangay Endorsement</span>
                  <Badge variant="outline" className="text-[10px] bg-white text-gray-700">Step 1</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <span className="text-gray-600">2. Document Verification</span>
                  <Badge variant="outline" className="text-[10px] bg-white text-gray-700">Step 2</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <span className="text-gray-600">3. Social Assessment &amp; SCSR</span>
                  <Badge variant="outline" className="text-[10px] bg-white text-gray-700">Step 3</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <span className="text-gray-600">4. Eligibility Evaluation</span>
                  <Badge variant="outline" className="text-[10px] bg-white text-gray-700">Step 4</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <span className="text-gray-600">5. Assistance Formulation</span>
                  <Badge variant="outline" className="text-[10px] bg-white text-gray-700">Step 5</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <span className="text-gray-600">6. Approval &amp; GL Issuance</span>
                  <Badge variant="outline" className="text-[10px] bg-white text-gray-700">Step 6</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <span className="text-gray-600">7. Service / Payout Release</span>
                  <Badge variant="outline" className="text-[10px] bg-white text-gray-700">Step 7</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <span className="text-gray-600">8. Post-Release &amp; Closure</span>
                  <Badge variant="outline" className="text-[10px] bg-white text-gray-700">Step 8</Badge>
                </div>
              </div>
            </Card>

          </div>

        </div>

      </div>
    </div>
  );
}