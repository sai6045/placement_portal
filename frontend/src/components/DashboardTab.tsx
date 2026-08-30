import React, { useEffect, useState, useMemo } from 'react';
import { ReportSummary, Company, TabType } from '../types';
import { api } from '../api';
import { 
  Users, 
  Building2, 
  CheckCircle2, 
  TrendingUp, 
  ArrowRight, 
  Zap, 
  Snowflake, 
  Sun, 
  BarChart3, 
  PlusCircle, 
  Award, 
  DollarSign, 
  Briefcase, 
  ChevronRight, 
  Clock, 
  ExternalLink,
  Sparkles,
  MapPin,
  GraduationCap
} from 'lucide-react';

interface DashboardTabProps {
  setActiveTab: (tab: TabType) => void;
  navigateToStudents?: (filter?: { placementStatus?: string; department?: string }) => void;
  navigateToCompanies?: (filter?: { status?: string; approvalStatus?: string }) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ 
  setActiveTab, 
  navigateToStudents, 
  navigateToCompanies 
}) => {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeHoverDept, setActiveHoverDept] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.getReportSummary().catch(err => {
        console.error('Failed to load dashboard summary:', err);
        return null;
      }),
      api.getCompanies().catch(err => {
        console.error('Failed to load company directory:', err);
        return [];
      })
    ]).then(([sumData, compData]) => {
      if (sumData) setSummary(sumData);
      if (compData) setCompanies(compData);
    }).finally(() => setLoading(false));
  }, []);

  const handleStudentNav = (filter?: { placementStatus?: string; department?: string }) => {
    if (navigateToStudents) {
      navigateToStudents(filter);
    } else {
      setActiveTab('students');
    }
  };

  const handleCompanyNav = (filter?: { status?: string; approvalStatus?: string }) => {
    if (navigateToCompanies) {
      navigateToCompanies(filter);
    } else {
      setActiveTab('companies');
    }
  };

  const overview = summary?.overview ?? {
    total_students: 0,
    placed_students: 0,
    unplaced_students: 0,
    higher_studies: 0,
    entrepreneur: 0,
    placement_percentage: 0,
    total_companies: 0,
    drives_completed: 0,
    total_hiring_capacity: 0,
    average_ctc: 0,
    highest_ctc: 0
  };

  const company_status_counts = summary?.company_status_counts ?? { 
    Cold: 0, 
    Warm: 0, 
    Hot: 0, 
    'Drive Completed': 0 
  };
  
  const department_statistics = useMemo(() => {
    return summary?.department_statistics ?? [];
  }, [summary]);

  // Max student count among departments for relative bar scaling
  const maxDeptStudents = useMemo(() => {
    if (department_statistics.length === 0) return 1;
    return Math.max(...department_statistics.map(d => d.total), 1);
  }, [department_statistics]);

  // Dynamic Quick Insights calculated from actual database data
  const insights = useMemo(() => {
    if (department_statistics.length === 0) {
      return {
        highestDept: null,
        lowestDept: null,
        largestDept: null
      };
    }

    const sortedByRate = [...department_statistics].sort((a, b) => b.placement_percentage - a.placement_percentage);
    const sortedBySize = [...department_statistics].sort((a, b) => b.total - a.total);

    return {
      highestDept: sortedByRate[0],
      lowestDept: sortedByRate[sortedByRate.length - 1],
      largestDept: sortedBySize[0]
    };
  }, [department_statistics]);

  // Recent companies (latest 4 sorted by ID descending)
  const recentCompanies = useMemo(() => {
    return [...companies].sort((a, b) => b.id - a.id).slice(0, 4);
  }, [companies]);

  if (loading) {
    return (
      <div className="py-24 text-center text-[#64748B] text-xs">
        <div className="animate-spin h-7 w-7 border-2 border-[#3B82F6] border-t-transparent rounded-full mx-auto mb-3"></div>
        <p className="font-semibold text-sm text-[#1E293B]">Loading live placement statistics...</p>
        <p className="text-xs text-[#64748B] mt-1">Connecting to database and calculating live student metrics.</p>
      </div>
    );
  }

  const isEmpty = overview.total_students === 0 && overview.total_companies === 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl overflow-hidden bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-center p-1.5 shrink-0">
              <img src="/logo.jpg" alt="Rathinam Group Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#1E293B]">Rathinam Placement Cell Overview</h2>
                <span className="px-2 py-0.5 bg-blue-50 text-[#3B82F6] font-bold text-[10px] rounded-full border border-blue-200">
                  Live System
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5 max-w-2xl">
                Track candidate registrations, corporate outreach pipelines, drive conclusions, and live department placement statistics.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => handleStudentNav()}
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Users className="h-3.5 w-3.5" />
              <span>Student Directory</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setActiveTab('faculties')}
              className="bg-white hover:bg-[#EFF6FF] border border-[#E2E8F0] hover:border-[#3B82F6] text-[#1E293B] hover:text-[#3B82F6] px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 active:scale-95"
            >
              <Building2 className="h-3.5 w-3.5 text-[#3B82F6]" />
              <span>+ Add Company</span>
            </button>
          </div>
        </div>
      </div>

      {/* TOP 4 KPI CARDS (Interactive & Responsive) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL REGISTERED */}
        <div 
          onClick={() => handleStudentNav()}
          className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer group flex items-start justify-between relative overflow-hidden"
          title="Click to view all registered students"
        >
          <div className="space-y-1.5">
            <p className="text-[11px] text-[#64748B] font-bold uppercase tracking-wider">
              Total Registered
            </p>
            <h3 className="text-3xl font-extrabold text-[#1E293B] group-hover:text-[#3B82F6] transition-colors">
              {overview.total_students}
            </h3>
            <p className="text-xs text-[#64748B] font-medium flex items-center gap-1">
              <span>18-Field Student Records</span>
            </p>
          </div>
          <div className="p-3 bg-blue-50 text-[#3B82F6] border border-blue-100 rounded-xl group-hover:scale-110 transition-transform shrink-0">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Card 2: PLACED CANDIDATES */}
        <div 
          onClick={() => handleStudentNav({ placementStatus: 'PLACED' })}
          className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-200 cursor-pointer group flex items-start justify-between relative overflow-hidden"
          title="Click to view all placed students"
        >
          <div className="space-y-1.5">
            <p className="text-[11px] text-[#64748B] font-bold uppercase tracking-wider">
              Placed Candidates
            </p>
            <h3 className="text-3xl font-extrabold text-emerald-600">
              {overview.placed_students}
            </h3>
            <p className="text-xs font-bold text-emerald-700 inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <Sparkles className="h-3 w-3 text-emerald-600" />
              <span>{overview.placement_percentage}% Success Rate</span>
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl group-hover:scale-110 transition-transform shrink-0">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        {/* Card 3: TOTAL COMPANIES */}
        <div 
          onClick={() => handleCompanyNav()}
          className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200 cursor-pointer group flex items-start justify-between relative overflow-hidden"
          title="Click to view all companies"
        >
          <div className="space-y-1.5">
            <p className="text-[11px] text-[#64748B] font-bold uppercase tracking-wider">
              Total Companies
            </p>
            <h3 className="text-3xl font-extrabold text-[#1E293B] group-hover:text-indigo-600 transition-colors">
              {overview.total_companies}
            </h3>
            <p className="text-xs text-indigo-700 font-semibold flex items-center gap-1">
              <span>{overview.drives_completed} Drives Completed</span>
            </p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl group-hover:scale-110 transition-transform shrink-0">
            <Building2 className="h-6 w-6" />
          </div>
        </div>

        {/* Card 4: ACTIVE PIPELINE */}
        <div 
          onClick={() => handleCompanyNav({ status: 'ACTIVE' })}
          className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-md hover:border-amber-300 transition-all duration-200 cursor-pointer group flex items-start justify-between relative overflow-hidden"
          title="Click to view active recruiter pipeline"
        >
          <div className="space-y-1.5">
            <p className="text-[11px] text-[#64748B] font-bold uppercase tracking-wider">
              Active Pipeline
            </p>
            <h3 className="text-3xl font-extrabold text-amber-600">
              {(company_status_counts.Hot || 0) + (company_status_counts.Warm || 0)}
            </h3>
            <p className="text-xs text-amber-700 font-semibold flex items-center gap-1">
              <span>{company_status_counts.Hot || 0} Hot Drives Active</span>
            </p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl group-hover:scale-110 transition-transform shrink-0">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* CORPORATE OUTREACH STATUS BREAKDOWN (Interactive Filter Cards) */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="font-bold text-[#1E293B] text-sm">Corporate Outreach &amp; Company Status</h3>
            <p className="text-xs text-[#64748B]">Click any status card to filter matching companies in Company Details</p>
          </div>
          <button
            onClick={() => handleCompanyNav()}
            className="text-xs font-bold text-[#3B82F6] hover:text-[#2563EB] flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View All Companies</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {/* Cold Status */}
          <div 
            onClick={() => handleCompanyNav({ status: 'Cold' })}
            className="p-4 bg-slate-50 hover:bg-slate-100 border border-[#E2E8F0] hover:border-slate-300 rounded-xl text-center cursor-pointer transition-all duration-150 group shadow-2xs"
            title="Filter Cold recruiters"
          >
            <div className="inline-flex p-2 bg-slate-200 text-slate-700 rounded-lg mb-2 group-hover:scale-110 transition-transform">
              <Snowflake className="h-4 w-4" />
            </div>
            <p className="text-[10px] font-bold uppercase text-slate-500">Cold</p>
            <p className="text-2xl font-black text-slate-800">{company_status_counts.Cold || 0}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Initial Contact</p>
          </div>

          {/* Warm Status */}
          <div 
            onClick={() => handleCompanyNav({ status: 'Warm' })}
            className="p-4 bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200 hover:border-amber-300 rounded-xl text-center cursor-pointer transition-all duration-150 group shadow-2xs"
            title="Filter Warm recruiters"
          >
            <div className="inline-flex p-2 bg-amber-100 text-amber-700 rounded-lg mb-2 group-hover:scale-110 transition-transform">
              <Sun className="h-4 w-4" />
            </div>
            <p className="text-[10px] font-bold uppercase text-amber-700">Warm</p>
            <p className="text-2xl font-black text-amber-800">{company_status_counts.Warm || 0}</p>
            <p className="text-[11px] text-amber-700 font-medium mt-0.5">Discussions On</p>
          </div>

          {/* Hot Status */}
          <div 
            onClick={() => handleCompanyNav({ status: 'Hot' })}
            className="p-4 bg-rose-50/70 hover:bg-rose-100/70 border border-rose-200 hover:border-rose-300 rounded-xl text-center cursor-pointer transition-all duration-150 group shadow-2xs"
            title="Filter Hot recruiters"
          >
            <div className="inline-flex p-2 bg-rose-100 text-rose-700 rounded-lg mb-2 group-hover:scale-110 transition-transform">
              <Zap className="h-4 w-4" />
            </div>
            <p className="text-[10px] font-bold uppercase text-rose-700">Hot</p>
            <p className="text-2xl font-black text-rose-800">{company_status_counts.Hot || 0}</p>
            <p className="text-[11px] text-rose-700 font-medium mt-0.5">Slot Confirmed</p>
          </div>

          {/* Drive Completed */}
          <div 
            onClick={() => handleCompanyNav({ status: 'Drive Completed' })}
            className="p-4 bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 hover:border-emerald-300 rounded-xl text-center cursor-pointer transition-all duration-150 group shadow-2xs"
            title="Filter Drive Completed companies"
          >
            <div className="inline-flex p-2 bg-emerald-100 text-emerald-700 rounded-lg mb-2 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <p className="text-[10px] font-bold uppercase text-emerald-700">Drive Completed</p>
            <p className="text-2xl font-black text-emerald-800">{company_status_counts['Drive Completed'] || 0}</p>
            <p className="text-[11px] text-emerald-700 font-medium mt-0.5">Offers Released</p>
          </div>
        </div>
      </div>

      {/* 2-COLUMN SECTION: Interactive Department Chart & Quick Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Interactive Department Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E2E8F0] mb-5">
              <div>
                <h3 className="font-bold text-[#1E293B] text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-[#3B82F6]" />
                  Department-Wise Placement Performance
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Dynamic student placement breakdown from actual records (Click a department to view students)
                </p>
              </div>

              {/* Chart Legend */}
              <div className="flex items-center gap-3 text-[11px] font-semibold self-start sm:self-auto">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm bg-[#3B82F6]"></span>
                  <span className="text-[#1E293B]">Placed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm bg-slate-200 border border-slate-300"></span>
                  <span className="text-[#64748B]">Yet to Place</span>
                </div>
              </div>
            </div>

            {department_statistics.length === 0 ? (
              <div className="py-14 text-center">
                <div className="inline-flex p-3 bg-[#EFF6FF] text-[#3B82F6] rounded-2xl mb-3">
                  <BarChart3 className="h-7 w-7" />
                </div>
                <p className="text-[#1E293B] font-bold text-xs">No student records recorded yet</p>
                <p className="text-[#64748B] text-[11px] mt-0.5 mb-4">
                  Departments will automatically populate here as student Excel data is uploaded.
                </p>
                <button
                  onClick={() => handleStudentNav()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold rounded-xl transition shadow-sm"
                >
                  <PlusCircle className="h-4 w-4" />
                  Upload Students
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {department_statistics.map((dept) => {
                  const isHovered = activeHoverDept === dept.department;
                  const placedWidth = dept.total > 0 ? (dept.placed / maxDeptStudents) * 100 : 0;
                  const unplacedWidth = dept.total > 0 ? ((dept.total - dept.placed) / maxDeptStudents) * 100 : 0;

                  return (
                    <div 
                      key={dept.department} 
                      onClick={() => handleStudentNav({ department: dept.department })}
                      onMouseEnter={() => setActiveHoverDept(dept.department)}
                      onMouseLeave={() => setActiveHoverDept(null)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isHovered 
                          ? 'bg-[#EFF6FF]/60 border-blue-300 shadow-sm' 
                          : 'bg-[#F8FAFC]/70 border-[#E2E8F0] hover:bg-slate-50'
                      }`}
                      title={`Click to filter ${dept.department} in Student Details`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1E293B] text-xs sm:text-sm">
                            {dept.department}
                          </span>
                          <span className="text-[11px] text-[#64748B] font-medium">
                            ({dept.total} {dept.total === 1 ? 'Student' : 'Students'})
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <span className="text-[11px] font-semibold text-[#1E293B]">
                            <span className="text-[#3B82F6] font-bold">{dept.placed}</span> Placed &bull;{' '}
                            <span className="text-[#64748B]">{dept.total - dept.placed}</span> Remaining
                          </span>

                          <span className={`px-2 py-0.5 text-[11px] font-black rounded-md border ${
                            dept.placement_percentage >= 70
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : dept.placement_percentage >= 40
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {dept.placement_percentage}% Rate
                          </span>
                        </div>
                      </div>

                      {/* Interactive Grouped Stacked Bar */}
                      <div className="w-full bg-slate-100 rounded-lg h-4 flex overflow-hidden border border-slate-200">
                        {dept.placed > 0 && (
                          <div
                            className="bg-[#3B82F6] hover:bg-[#2563EB] transition-all duration-300 flex items-center justify-center text-[9px] font-bold text-white relative group/bar"
                            style={{ width: `${placedWidth}%` }}
                          >
                            {placedWidth > 12 && <span>{dept.placed}</span>}
                          </div>
                        )}
                        {(dept.total - dept.placed) > 0 && (
                          <div
                            className="bg-slate-200 hover:bg-slate-300 transition-all duration-300 flex items-center justify-center text-[9px] font-semibold text-slate-600"
                            style={{ width: `${unplacedWidth}%` }}
                          >
                            {unplacedWidth > 12 && <span>{dept.total - dept.placed}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
            <span>Showing {department_statistics.length} active academic stream(s)</span>
            <button
              onClick={() => setActiveTab('reports')}
              className="text-[#3B82F6] hover:text-[#2563EB] font-bold inline-flex items-center gap-1"
            >
              <span>View Detailed Reports</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Right (1 col): Quick Insights Panel */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm flex flex-col justify-between space-y-5">
          <div>
            <h3 className="font-bold text-[#1E293B] text-sm flex items-center gap-2 pb-4 border-b border-[#E2E8F0]">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Live Placement Insights
            </h3>

            <div className="mt-4 space-y-3.5">
              {/* Insight 1: Highest Placement Rate */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
                  <Award className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase text-emerald-800 tracking-wide">
                    Highest Placement Rate
                  </p>
                  <p className="text-sm font-black text-emerald-950 truncate">
                    {insights.highestDept ? `${insights.highestDept.department} (${insights.highestDept.placement_percentage}%)` : 'N/A'}
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    {insights.highestDept ? `${insights.highestDept.placed} of ${insights.highestDept.total} students placed` : 'No data recorded'}
                  </p>
                </div>
              </div>

              {/* Insight 2: Largest Department */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 text-[#3B82F6] rounded-xl shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase text-blue-800 tracking-wide">
                    Largest Department
                  </p>
                  <p className="text-sm font-black text-blue-950 truncate">
                    {insights.largestDept ? `${insights.largestDept.department}` : 'N/A'}
                  </p>
                  <p className="text-[11px] text-blue-700">
                    {insights.largestDept ? `${insights.largestDept.total} candidates enrolled` : 'No data recorded'}
                  </p>
                </div>
              </div>

              {/* Insight 3: Average & Highest Package */}
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl shrink-0">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase text-indigo-800 tracking-wide">
                    CTC Package Metrics
                  </p>
                  <p className="text-sm font-black text-indigo-950 truncate">
                    {overview.average_ctc ? `${overview.average_ctc} LPA Avg` : 'N/A'}
                  </p>
                  <p className="text-[11px] text-indigo-700">
                    {overview.highest_ctc ? `Highest: ${overview.highest_ctc} LPA` : 'Offers pending'}
                  </p>
                </div>
              </div>

              {/* Insight 4: Total Drives Completed */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl shrink-0">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase text-amber-800 tracking-wide">
                    Completed Recruiter Drives
                  </p>
                  <p className="text-sm font-black text-amber-950 truncate">
                    {overview.drives_completed} Completed
                  </p>
                  <p className="text-[11px] text-amber-700">
                    {overview.total_companies} total corporate partners
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#64748B] flex items-center justify-between">
            <span>Overall Success Ratio:</span>
            <span className="font-extrabold text-[#1E293B] text-sm">
              {overview.placement_percentage}%
            </span>
          </div>
        </div>
      </div>

      {/* RECENT RECRUITER ACTIVITY */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] mb-4">
          <div>
            <h3 className="font-bold text-[#1E293B] text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#3B82F6]" />
              Recent Recruiter Directory Activity
            </h3>
            <p className="text-xs text-[#64748B]">Real company records logged from database</p>
          </div>
          <button
            onClick={() => handleCompanyNav()}
            className="text-xs font-bold text-[#3B82F6] hover:text-[#2563EB] flex items-center gap-1"
          >
            <span>View Full Directory</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {recentCompanies.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#64748B]">
            No company activities logged yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentCompanies.map((comp) => {
              const statusColor = 
                comp.status === 'Drive Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                comp.status === 'Hot' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                comp.status === 'Warm' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-slate-50 text-slate-700 border-slate-200';

              return (
                <div
                  key={comp.id}
                  onClick={() => handleCompanyNav()}
                  className="p-3.5 bg-[#F8FAFC] hover:bg-blue-50/50 border border-[#E2E8F0] hover:border-blue-200 rounded-xl transition cursor-pointer space-y-2 group shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-xs text-[#1E293B] group-hover:text-[#3B82F6] transition-colors truncate">
                      {comp.company_name || comp.name}
                    </h4>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${statusColor} shrink-0`}>
                      {comp.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#64748B] space-y-0.5">
                    {comp.location && (
                      <p className="flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                        <span>{comp.location}</span>
                      </p>
                    )}
                    <p className="font-semibold text-emerald-700">
                      CTC: {comp.ctc_lpa ? `${comp.ctc_lpa} LPA` : (comp.package_offered || 'N/A')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Empty State Welcome Guide */}
      {isEmpty && (
        <div className="bg-[#EFF6FF] border border-blue-200 rounded-2xl p-6">
          <h3 className="font-bold text-[#1E293B] text-sm mb-2 flex items-center gap-2">
            <PlusCircle className="h-4 w-4 text-[#3B82F6]" />
            Getting Started with Placement Management
          </h3>
          <p className="text-[#64748B] text-xs mb-4">
            The placement database is connected and ready. Choose an action below:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => handleStudentNav()}
              className="p-4 bg-white border border-[#E2E8F0] hover:border-[#3B82F6] rounded-xl text-left transition shadow-sm group"
            >
              <Users className="h-5 w-5 text-[#3B82F6] mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-bold text-[#1E293B] text-xs">Student Directory</p>
              <p className="text-[#64748B] text-[11px] mt-0.5">Upload Excel or add single student</p>
            </button>
            <button
              onClick={() => setActiveTab('faculties')}
              className="p-4 bg-white border border-[#E2E8F0] hover:border-[#3B82F6] rounded-xl text-left transition shadow-sm group"
            >
              <Building2 className="h-5 w-5 text-[#3B82F6] mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-bold text-[#1E293B] text-xs">Faculty Members</p>
              <p className="text-[#64748B] text-[11px] mt-0.5">Register recruiters &amp; manage pipeline</p>
            </button>
            <button
              onClick={() => handleCompanyNav()}
              className="p-4 bg-white border border-[#E2E8F0] hover:border-[#3B82F6] rounded-xl text-left transition shadow-sm group"
            >
              <TrendingUp className="h-5 w-5 text-[#3B82F6] mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-bold text-[#1E293B] text-xs">Company Details</p>
              <p className="text-[#64748B] text-[11px] mt-0.5">View drive conclusions &amp; placed students</p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

