import React, { useEffect, useState } from 'react';
import { ReportSummary, TabType } from '../types';
import { api } from '../api';
import { Users, Building2, CheckCircle2, TrendingUp, ArrowRight, Zap, Snowflake, Sun, BarChart3, PlusCircle } from 'lucide-react';

interface DashboardTabProps {
  setActiveTab: (tab: TabType) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ setActiveTab }) => {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getReportSummary()
      .then(res => setSummary(res))
      .catch(err => console.error('Failed to load dashboard summary:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-[#64748B] text-xs">
        <div className="animate-spin h-6 w-6 border-2 border-[#3B82F6] border-t-transparent rounded-full mx-auto mb-3"></div>
        Loading dashboard statistics...
      </div>
    );
  }

  const overview = summary?.overview ?? {
    total_students: 0,
    placed_students: 0,
    unplaced_students: 0,
    higher_studies: 0,
    entrepreneur: 0,
    placement_percentage: 0,
    total_companies: 0,
    drives_completed: 0,
  };
  const company_status_counts = summary?.company_status_counts ?? { Cold: 0, Warm: 0, Hot: 0, 'Drive Completed': 0 };
  const department_statistics = summary?.department_statistics ?? [];

  const isEmpty = overview.total_students === 0 && overview.total_companies === 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner with Rathinam Logo */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl overflow-hidden bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-center p-1 shrink-0">
              <img src="/logo.jpg" alt="Rathinam Group Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1E293B]">Rathinam Placement Cell Overview &amp; Dashboard</h2>
              <p className="text-xs text-[#64748B] mt-0.5 max-w-2xl">
                Track candidate registrations, corporate outreach pipelines, drive conclusions, and live department placement statistics.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('students')}
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
            >
              Manage Student Details <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setActiveTab('faculties')}
              className="bg-white hover:bg-[#EFF6FF] border border-[#E2E8F0] hover:border-[#3B82F6] text-[#3B82F6] px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
            >
              + Add Company <Building2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm flex items-center gap-4">
          <div className="p-3 bg-[#EFF6FF] text-[#3B82F6] rounded-lg">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] text-[#64748B] font-semibold uppercase tracking-wider">Total Registered</p>
            <h3 className="text-2xl font-bold text-[#1E293B]">{overview.total_students}</h3>
            <p className="text-[11px] text-[#64748B]">18-Field Student Records</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] text-[#64748B] font-semibold uppercase tracking-wider">Placed Candidates</p>
            <h3 className="text-2xl font-bold text-emerald-600">{overview.placed_students}</h3>
            <p className="text-[11px] text-emerald-600 font-semibold">{overview.placement_percentage}% Success Rate</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] text-[#64748B] font-semibold uppercase tracking-wider">Total Companies</p>
            <h3 className="text-2xl font-bold text-[#1E293B]">{overview.total_companies}</h3>
            <p className="text-[11px] text-[#64748B]">{overview.drives_completed} Drives Completed</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] text-[#64748B] font-semibold uppercase tracking-wider">Active Pipeline</p>
            <h3 className="text-2xl font-bold text-amber-600">
              {(company_status_counts.Hot || 0) + (company_status_counts.Warm || 0)}
            </h3>
            <p className="text-[11px] text-[#64748B]">{company_status_counts.Hot || 0} Hot Drives</p>
          </div>
        </div>
      </div>

      {/* Corporate Outreach Status Breakdown */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-[#1E293B] text-sm">Corporate Outreach &amp; Company Status</h3>
            <p className="text-xs text-[#64748B]">Pipeline progression managed via Faculty Members tab</p>
          </div>
          <button
            onClick={() => setActiveTab('companies')}
            className="text-xs font-semibold text-[#3B82F6] hover:text-[#2563EB] flex items-center gap-1"
          >
            View Company Details <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-slate-50 border border-[#E2E8F0] rounded-lg text-center">
            <div className="inline-flex p-1.5 bg-slate-200 text-slate-700 rounded-md mb-1.5">
              <Snowflake className="h-4 w-4" />
            </div>
            <p className="text-[10px] font-bold uppercase text-slate-500">Cold</p>
            <p className="text-xl font-bold text-slate-800">{company_status_counts.Cold || 0}</p>
            <p className="text-[10px] text-slate-400">Initial Contact</p>
          </div>

          <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-lg text-center">
            <div className="inline-flex p-1.5 bg-amber-100 text-amber-700 rounded-md mb-1.5">
              <Sun className="h-4 w-4" />
            </div>
            <p className="text-[10px] font-bold uppercase text-amber-700">Warm</p>
            <p className="text-xl font-bold text-amber-800">{company_status_counts.Warm || 0}</p>
            <p className="text-[10px] text-amber-600">Discussions On</p>
          </div>

          <div className="p-3.5 bg-red-50/60 border border-red-200 rounded-lg text-center">
            <div className="inline-flex p-1.5 bg-red-100 text-red-700 rounded-md mb-1.5">
              <Zap className="h-4 w-4" />
            </div>
            <p className="text-[10px] font-bold uppercase text-red-700">Hot</p>
            <p className="text-xl font-bold text-red-800">{company_status_counts.Hot || 0}</p>
            <p className="text-[10px] text-red-600">Slot Confirmed</p>
          </div>

          <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-lg text-center">
            <div className="inline-flex p-1.5 bg-emerald-100 text-emerald-700 rounded-md mb-1.5">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <p className="text-[10px] font-bold uppercase text-emerald-700">Drive Completed</p>
            <p className="text-xl font-bold text-emerald-800">{company_status_counts['Drive Completed'] || 0}</p>
            <p className="text-[10px] text-emerald-600">Offers Released</p>
          </div>
        </div>
      </div>

      {/* Department-wise Placement Rates */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
        <h3 className="font-bold text-[#1E293B] text-sm mb-4">Department-wise Placement Performance</h3>

        {department_statistics.length === 0 ? (
          <div className="py-10 text-center">
            <div className="inline-flex p-3 bg-[#EFF6FF] text-[#3B82F6] rounded-full mb-3">
              <BarChart3 className="h-6 w-6" />
            </div>
            <p className="text-[#1E293B] font-semibold text-xs">No student data recorded yet</p>
            <p className="text-[#64748B] text-[11px] mt-0.5 mb-3">
              Department statistics will appear here once student records are uploaded.
            </p>
            <button
              onClick={() => setActiveTab('students')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-semibold rounded-lg transition"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Add Students
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {department_statistics.map((dept) => (
              <div key={dept.department} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-[#1E293B] font-semibold">{dept.department} Department</span>
                  <span className="text-[#64748B]">
                    {dept.placed} / {dept.total} Placed ({dept.placement_percentage}%)
                  </span>
                </div>
                <div className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-[#3B82F6] h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${dept.placement_percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Empty State Welcome Guide */}
      {isEmpty && (
        <div className="bg-[#EFF6FF] border border-blue-200 rounded-xl p-5">
          <h3 className="font-bold text-[#1E293B] text-sm mb-2 flex items-center gap-2">
            <PlusCircle className="h-4 w-4 text-[#3B82F6]" />
            Getting Started
          </h3>
          <p className="text-[#64748B] text-xs mb-3">
            The placement database is connected and ready. Choose an action below:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => setActiveTab('students')}
              className="p-3.5 bg-white border border-[#E2E8F0] hover:border-[#3B82F6] rounded-lg text-left transition shadow-sm"
            >
              <Users className="h-4 w-4 text-[#3B82F6] mb-1.5" />
              <p className="font-bold text-[#1E293B] text-xs">Student Details</p>
              <p className="text-[#64748B] text-[11px]">Upload Excel or add single record</p>
            </button>
            <button
              onClick={() => setActiveTab('faculties')}
              className="p-3.5 bg-white border border-[#E2E8F0] hover:border-[#3B82F6] rounded-lg text-left transition shadow-sm"
            >
              <Building2 className="h-4 w-4 text-[#3B82F6] mb-1.5" />
              <p className="font-bold text-[#1E293B] text-xs">Faculty Members</p>
              <p className="text-[#64748B] text-[11px]">Register recruiters &amp; status</p>
            </button>
            <button
              onClick={() => setActiveTab('companies')}
              className="p-3.5 bg-white border border-[#E2E8F0] hover:border-[#3B82F6] rounded-lg text-left transition shadow-sm"
            >
              <BarChart3 className="h-4 w-4 text-[#3B82F6] mb-1.5" />
              <p className="font-bold text-[#1E293B] text-xs">Company Details</p>
              <p className="text-[#64748B] text-[11px]">Explore recruiter directory</p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
