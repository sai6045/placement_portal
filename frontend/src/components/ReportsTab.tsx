import React, { useState, useEffect, useMemo } from 'react';
import { ReportSummary, StudentFull, User } from '../types';
import { api } from '../api';
import { BarChart3, Download, Users, Building2, Search, Filter, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown, Award, TrendingUp, Briefcase, DollarSign, CheckCircle2, XCircle } from 'lucide-react';

interface ReportsTabProps {
  currentUser: User;
  refreshTrigger?: number;
}

type SortField = 's_no' | 'reg_no' | 'name' | 'department' | 'gender' | 'graduation_year' | 'placement_status' | 'placed_company' | 'placed_ctc_lpa' | 'placement_date';
type SortOrder = 'asc' | 'desc' | null;

export const ReportsTab: React.FC<ReportsTabProps> = ({ currentUser, refreshTrigger }) => {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedGradYear, setSelectedGradYear] = useState('');
  const [selectedPlacementStatus, setSelectedPlacementStatus] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [minCtc, setMinCtc] = useState('');

  // Sorting
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  const fetchReports = () => {
    setLoading(true);
    api.getReportSummary()
      .then(res => setSummary(res))
      .catch(err => console.error('Failed to load reports:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReports();
  }, [refreshTrigger]);

  const studentsList: StudentFull[] = useMemo(() => {
    return summary?.students || [];
  }, [summary]);

  // Unique companies and years for filter dropdowns
  const availableCompanies = useMemo(() => {
    const set = new Set<string>();
    studentsList.forEach(s => {
      if (s.placed_company && s.placed_company !== 'N/A' && s.placed_company.trim() !== '') {
        set.add(s.placed_company);
      }
    });
    return Array.from(set).sort();
  }, [studentsList]);

  const availableDepartments = useMemo(() => {
    const deptMap = new Map<string, string>();
    studentsList.forEach(s => {
      const d = (s.department || s.dept || '').trim();
      if (d) {
        const key = d.toLowerCase();
        if (!deptMap.has(key)) {
          deptMap.set(key, d);
        }
      }
    });
    return Array.from(deptMap.values()).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    );
  }, [studentsList]);

  const availableGradYears = useMemo(() => {
    const set = new Set<number>();
    studentsList.forEach(s => {
      if (s.graduation_year) set.add(s.graduation_year);
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [studentsList]);

  // Filtered and Sorted Students
  const filteredStudents = useMemo(() => {
    let result = [...studentsList];

    // 1. Search Query (Reg No, Name, Department, Company)
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(s =>
        (s.reg_no && s.reg_no.toLowerCase().includes(q)) ||
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.department && s.department.toLowerCase().includes(q)) ||
        (s.dept && s.dept.toLowerCase().includes(q)) ||
        (s.placed_company && s.placed_company.toLowerCase().includes(q))
      );
    }

    // 2. Department
    if (selectedDept) {
      result = result.filter(s => (s.department || s.dept || '').toUpperCase() === selectedDept.toUpperCase());
    }

    // 3. Graduation Year
    if (selectedGradYear) {
      result = result.filter(s => String(s.graduation_year) === selectedGradYear);
    }

    // 4. Placement Status
    if (selectedPlacementStatus) {
      result = result.filter(s => {
        const isPlaced = (s.placement_status || '').toUpperCase() === 'PLACED';
        return selectedPlacementStatus === 'PLACED' ? isPlaced : !isPlaced;
      });
    }

    // 5. Company
    if (selectedCompany) {
      result = result.filter(s => (s.placed_company || '').toLowerCase() === selectedCompany.toLowerCase());
    }

    // 6. Min CTC
    if (minCtc && !isNaN(Number(minCtc))) {
      const threshold = Number(minCtc);
      result = result.filter(s => (s.placed_ctc_lpa || 0) >= threshold);
    }

    // 7. Sorting
    if (sortField && sortOrder) {
      result.sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (sortField === 'placed_ctc_lpa') {
          valA = a.placed_ctc_lpa ?? 0;
          valB = b.placed_ctc_lpa ?? 0;
        } else if (sortField === 's_no') {
          valA = a.s_no ?? 0;
          valB = b.s_no ?? 0;
        } else if (sortField === 'graduation_year') {
          valA = a.graduation_year ?? 0;
          valB = b.graduation_year ?? 0;
        } else {
          valA = String(valA || '').toLowerCase();
          valB = String(valB || '').toLowerCase();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [studentsList, search, selectedDept, selectedGradYear, selectedPlacementStatus, selectedCompany, minCtc, sortField, sortOrder]);

  const handleSortToggle = (field: SortField) => {
    if (sortField !== field) {
      setSortField(field);
      setSortOrder('asc');
    } else if (sortOrder === 'asc') {
      setSortOrder('desc');
    } else {
      setSortField(null);
      setSortOrder(null);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedDept('');
    setSelectedGradYear('');
    setSelectedPlacementStatus('');
    setSelectedCompany('');
    setMinCtc('');
    setSortField(null);
    setSortOrder(null);
  };

  const handleExportFilteredCSV = () => {
    if (filteredStudents.length === 0) {
      alert('No matching student records to export.');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'S.No,Reg No,Student Name,Department,Gender,Hosteller Status,Graduation Year,Placement Status,Placed Company,CTC (LPA),Placement Date,Email,Phone\n';

    filteredStudents.forEach((s, idx) => {
      const isPlaced = (s.placement_status || '').toUpperCase() === 'PLACED';
      const ctcVal = isPlaced && s.placed_ctc_lpa ? `${s.placed_ctc_lpa} LPA` : (isPlaced && s.salary_package ? s.salary_package : 'N/A');
      const compVal = isPlaced ? (s.placed_company || 'N/A') : 'N/A';
      const dateVal = isPlaced ? (s.placement_date || 'N/A') : 'N/A';

      const row = [
        s.s_no || idx + 1,
        `"${s.reg_no}"`,
        `"${s.name}"`,
        `"${s.department || s.dept || ''}"`,
        `"${s.gender}"`,
        `"${s.hosteller_status || s.hosteller_day_scholar || ''}"`,
        `"${s.graduation_year || ''}"`,
        `"${isPlaced ? 'Placed' : 'Yet to be Placed'}"`,
        `"${compVal}"`,
        `"${ctcVal}"`,
        `"${dateVal}"`,
        `"${s.email || ''}"`,
        `"${s.phone || s.mobile_no || ''}"`
      ];
      csvContent += row.join(',') + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `Placement_Report_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field || !sortOrder) {
      return <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-60 inline ml-1" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-[#3B82F6] font-bold inline ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 text-[#3B82F6] font-bold inline ml-1" />
    );
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-[#64748B] text-xs">
        <div className="animate-spin h-5 w-5 border-2 border-[#3B82F6] border-t-transparent rounded-full mx-auto mb-2"></div>
        Loading live placement reports...
      </div>
    );
  }

  const overview = summary?.overview ?? {
    total_students: 0,
    placed_students: 0,
    unplaced_students: 0,
    placement_percentage: 0,
    total_companies: 0,
    drives_completed: 0,
    total_hiring_capacity: 0,
    total_actual_placements: 0,
    average_ctc: 0,
    highest_ctc: 0
  };
  const department_statistics = summary?.department_statistics ?? [];
  const demographics = summary?.demographics ?? {
    gender: { Male: 0, Female: 0 },
    residence: { Hosteller: 0, 'Day Scholar': 0 },
  };

  const isTotalEmpty = overview.total_students === 0 && overview.total_companies === 0;

  return (
    <div className="space-y-6">
      {/* Header & Export Bar */}
      <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#1E293B] flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#3B82F6]" />
            Live Placement Reports &amp; Analytics
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Real-time statistics calculated from Supabase &bull; Search, filter, sort, and export comprehensive placement records
          </p>
        </div>

        <button
          onClick={handleExportFilteredCSV}
          disabled={filteredStudents.length === 0}
          title="Export current filtered records as CSV"
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-lg shadow-sm transition"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export Filtered Report (CSV)</span>
        </button>
      </div>

      {/* Empty State */}
      {isTotalEmpty ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm py-16 text-center">
          <div className="inline-flex p-4 bg-[#EFF6FF] text-[#3B82F6] rounded-full mb-3">
            <BarChart3 className="h-8 w-8 text-[#3B82F6]" />
          </div>
          <h3 className="text-[#1E293B] font-bold text-sm">No placement data available yet.</h3>
          <p className="text-[#64748B] text-xs mt-1 max-w-sm mx-auto">
            Reports and analytics calculate dynamically once students and companies are registered.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-1.5">
              <Users className="h-3.5 w-3.5 text-[#3B82F6]" />
              Add students via <strong>Student Details</strong>
            </div>
            <div className="flex items-center gap-1.5 text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-1.5">
              <Building2 className="h-3.5 w-3.5 text-[#3B82F6]" />
              Add companies via <strong>Faculty Members</strong>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Live Placement Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* Total Students */}
            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm">
              <p className="text-[11px] font-semibold text-[#64748B] uppercase">Total Students</p>
              <h3 className="text-xl font-bold text-[#1E293B] mt-1">{overview.total_students}</h3>
              <p className="text-[11px] text-[#64748B] mt-0.5">Enrolled Candidates</p>
            </div>

            {/* Placed vs Yet to be Placed */}
            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm">
              <p className="text-[11px] font-semibold text-[#64748B] uppercase">Placed / Yet to be Placed</p>
              <h3 className="text-xl font-bold text-emerald-600 mt-1">
                {overview.placed_students} <span className="text-xs text-rose-500 font-semibold">/ {overview.unplaced_students}</span>
              </h3>
              <p className="text-[11px] text-[#64748B] mt-0.5">Verified Placements</p>
            </div>

            {/* Placement Rate */}
            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm">
              <p className="text-[11px] font-semibold text-[#64748B] uppercase">Placement Rate</p>
              <h3 className="text-xl font-bold text-[#3B82F6] mt-1">{overview.placement_percentage}%</h3>
              <p className="text-[11px] text-[#64748B] mt-0.5">{overview.placed_students} of {overview.total_students}</p>
            </div>

            {/* Average CTC */}
            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm">
              <p className="text-[11px] font-semibold text-[#64748B] uppercase">Average CTC</p>
              <h3 className="text-xl font-bold text-emerald-700 mt-1">
                {overview.average_ctc ? `${overview.average_ctc} LPA` : '0.0 LPA'}
              </h3>
              <p className="text-[11px] text-[#64748B] mt-0.5">Placed Students Avg</p>
            </div>

            {/* Highest CTC */}
            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm">
              <p className="text-[11px] font-semibold text-[#64748B] uppercase">Highest CTC</p>
              <h3 className="text-xl font-bold text-emerald-800 mt-1">
                {overview.highest_ctc ? `${overview.highest_ctc} LPA` : '0.0 LPA'}
              </h3>
              <p className="text-[11px] text-[#64748B] mt-0.5">Top Verified Offer</p>
            </div>

            {/* Total Companies */}
            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm">
              <p className="text-[11px] font-semibold text-[#64748B] uppercase">Total Companies</p>
              <h3 className="text-xl font-bold text-[#1E293B] mt-1">{overview.total_companies}</h3>
              <p className="text-[11px] text-[#64748B] mt-0.5">Registered Recruiters</p>
            </div>

            {/* Drives Completed */}
            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm">
              <p className="text-[11px] font-semibold text-[#64748B] uppercase">Completed Drives</p>
              <h3 className="text-xl font-bold text-emerald-600 mt-1">{overview.drives_completed}</h3>
              <p className="text-[11px] text-[#64748B] mt-0.5">Concluded Campus Drives</p>
            </div>

            {/* Total Hiring Capacity */}
            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm">
              <p className="text-[11px] font-semibold text-[#64748B] uppercase">Hiring Capacity</p>
              <h3 className="text-xl font-bold text-[#1E293B] mt-1">{overview.total_hiring_capacity || 0}</h3>
              <p className="text-[11px] text-[#64748B] mt-0.5">Total Target Hirings</p>
            </div>

            {/* Actual Placements */}
            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm">
              <p className="text-[11px] font-semibold text-[#64748B] uppercase">Actual Placements</p>
              <h3 className="text-xl font-bold text-[#3B82F6] mt-1">{overview.total_actual_placements || overview.placed_students}</h3>
              <p className="text-[11px] text-[#64748B] mt-0.5">Offers Secured</p>
            </div>

            {/* Placement Status Ratio */}
            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm">
              <p className="text-[11px] font-semibold text-[#64748B] uppercase">Success Ratio</p>
              <h3 className="text-xl font-bold text-[#1E293B] mt-1">
                {overview.total_students > 0 ? `${Math.round((overview.placed_students / overview.total_students) * 100)}%` : '0%'}
              </h3>
              <p className="text-[11px] text-[#64748B] mt-0.5">Overall Performance</p>
            </div>
          </div>

          {/* Department Performance Statistics Table */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
              <h3 className="font-bold text-[#1E293B] text-xs">Department-Wise Placement Performance Breakdown</h3>
              <span className="text-[11px] text-[#64748B]">All Registered Streams</span>
            </div>

            {department_statistics.length === 0 ? (
              <div className="py-8 text-center text-[#64748B] text-xs">No department data available yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#EFF6FF] text-[#1E293B] font-semibold border-b border-[#E2E8F0]">
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4 text-center">Total Students</th>
                      <th className="py-3 px-4 text-center">Placed</th>
                      <th className="py-3 px-4 text-center">Yet to be Placed</th>
                      <th className="py-3 px-4 text-center">Placement Rate</th>
                      <th className="py-3 px-4 text-center">Avg CTC</th>
                      <th className="py-3 px-4 text-center">Highest CTC</th>
                      <th className="py-3 px-4">Placement Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] text-[#1E293B]">
                    {department_statistics.map((dept) => (
                      <tr key={dept.department} className="hover:bg-[#EFF6FF]/60 transition">
                        <td className="py-3 px-4 font-bold text-[#1E293B]">{dept.department}</td>
                        <td className="py-3 px-4 text-center text-[#64748B] font-medium">{dept.total}</td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-600">{dept.placed}</td>
                        <td className="py-3 px-4 text-center font-semibold text-rose-600">{dept.unplaced}</td>
                        <td className="py-3 px-4 text-center font-bold text-[#3B82F6]">{dept.placement_percentage}%</td>
                        <td className="py-3 px-4 text-center font-semibold text-emerald-700">
                          {dept.avg_ctc ? `${dept.avg_ctc} LPA` : '0.0 LPA'}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-800">
                          {dept.highest_ctc ? `${dept.highest_ctc} LPA` : '0.0 LPA'}
                        </td>
                        <td className="py-3 px-4 w-40">
                          <div className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-[#3B82F6] h-2 rounded-full transition-all duration-300"
                              style={{ width: `${dept.placement_percentage}%` }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* DETAILED STUDENT PLACEMENT REPORT (SEARCH / FILTER / SORT) */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden space-y-4 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
              <div>
                <h3 className="font-bold text-[#1E293B] text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#3B82F6]" />
                  Detailed Student Placement Records
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Showing {filteredStudents.length} of {studentsList.length} students
                </p>
              </div>

              {/* Clear Filters Button */}
              {(search || selectedDept || selectedGradYear || selectedPlacementStatus || selectedCompany || minCtc || sortField) && (
                <button
                  onClick={handleClearFilters}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Clear Filters</span>
                </button>
              )}
            </div>

            {/* Filter Controls Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
              {/* 1. Search Box */}
              <div className="lg:col-span-2 relative">
                <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-[#64748B]" />
                <input
                  type="text"
                  placeholder="Search Reg No, Name, Dept, Company..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-xs focus:ring-2 focus:ring-[#3B82F6]"
                />
              </div>

              {/* 2. Department Filter */}
              <div>
                <select
                  value={selectedDept}
                  onChange={e => setSelectedDept(e.target.value)}
                  className="w-full py-2 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs focus:ring-2 focus:ring-[#3B82F6]"
                >
                  <option value="">All Departments</option>
                  {availableDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* 3. Placement Status */}
              <div>
                <select
                  value={selectedPlacementStatus}
                  onChange={e => setSelectedPlacementStatus(e.target.value)}
                  className="w-full py-2 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs focus:ring-2 focus:ring-[#3B82F6]"
                >
                  <option value="">All Statuses</option>
                  <option value="PLACED">Placed</option>
                  <option value="YET_TO_BE_PLACED">Yet to be Placed</option>
                </select>
              </div>

              {/* 4. Company Filter */}
              <div>
                <select
                  value={selectedCompany}
                  onChange={e => setSelectedCompany(e.target.value)}
                  className="w-full py-2 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs focus:ring-2 focus:ring-[#3B82F6]"
                >
                  <option value="">All Companies</option>
                  {availableCompanies.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* 5. Graduation Year Filter */}
              <div>
                <select
                  value={selectedGradYear}
                  onChange={e => setSelectedGradYear(e.target.value)}
                  className="w-full py-2 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs focus:ring-2 focus:ring-[#3B82F6]"
                >
                  <option value="">All Grad Years</option>
                  {availableGradYears.map(y => (
                    <option key={y} value={String(y)}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Report Table */}
            {filteredStudents.length === 0 ? (
              <div className="py-12 text-center text-[#64748B]">
                <Users className="h-7 w-7 text-[#94A3B8] mx-auto mb-2" />
                <p className="font-semibold text-xs text-[#1E293B]">No matching student records found</p>
                <p className="text-[11px] text-[#64748B] mt-0.5">Try adjusting your search query or filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#EFF6FF] text-[#1E293B] font-semibold border-b border-[#E2E8F0] select-none">
                      <th
                        onClick={() => handleSortToggle('s_no')}
                        className="py-3 px-4 w-16 text-center cursor-pointer hover:bg-blue-100/60 transition"
                      >
                        S.No {renderSortIcon('s_no')}
                      </th>
                      <th
                        onClick={() => handleSortToggle('reg_no')}
                        className="py-3 px-4 cursor-pointer hover:bg-blue-100/60 transition"
                      >
                        Reg. No {renderSortIcon('reg_no')}
                      </th>
                      <th
                        onClick={() => handleSortToggle('name')}
                        className="py-3 px-4 cursor-pointer hover:bg-blue-100/60 transition"
                      >
                        Student Name {renderSortIcon('name')}
                      </th>
                      <th
                        onClick={() => handleSortToggle('department')}
                        className="py-3 px-4 cursor-pointer hover:bg-blue-100/60 transition"
                      >
                        Department {renderSortIcon('department')}
                      </th>
                      <th
                        onClick={() => handleSortToggle('gender')}
                        className="py-3 px-4 cursor-pointer hover:bg-blue-100/60 transition"
                      >
                        Gender {renderSortIcon('gender')}
                      </th>
                      <th
                        onClick={() => handleSortToggle('graduation_year')}
                        className="py-3 px-4 text-center cursor-pointer hover:bg-blue-100/60 transition"
                      >
                        Grad Year {renderSortIcon('graduation_year')}
                      </th>
                      <th
                        onClick={() => handleSortToggle('placement_status')}
                        className="py-3 px-4 text-center cursor-pointer hover:bg-blue-100/60 transition"
                      >
                        Status {renderSortIcon('placement_status')}
                      </th>
                      <th
                        onClick={() => handleSortToggle('placed_company')}
                        className="py-3 px-4 cursor-pointer hover:bg-blue-100/60 transition"
                      >
                        Placed Company {renderSortIcon('placed_company')}
                      </th>
                      <th
                        onClick={() => handleSortToggle('placed_ctc_lpa')}
                        className="py-3 px-4 text-center cursor-pointer hover:bg-blue-100/60 transition"
                      >
                        CTC (LPA) {renderSortIcon('placed_ctc_lpa')}
                      </th>
                      <th
                        onClick={() => handleSortToggle('placement_date')}
                        className="py-3 px-4 text-center cursor-pointer hover:bg-blue-100/60 transition"
                      >
                        Placement Date {renderSortIcon('placement_date')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] text-[#1E293B]">
                    {filteredStudents.map((s, idx) => {
                      const isPlaced = (s.placement_status || '').toUpperCase() === 'PLACED';

                      return (
                        <tr key={s.id} className="hover:bg-[#EFF6FF]/60 transition">
                          <td className="py-3 px-4 text-center font-medium text-[#64748B]">
                            {s.s_no || idx + 1}
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-[#3B82F6]">
                            {s.reg_no}
                          </td>
                          <td className="py-3 px-4 font-semibold text-[#1E293B]">
                            {s.name}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 bg-[#F8FAFC] text-[#64748B] font-medium rounded text-[11px] border border-[#E2E8F0]">
                              {s.department || s.dept}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#64748B]">
                            {s.gender}
                          </td>
                          <td className="py-3 px-4 text-center font-medium text-[#64748B]">
                            {s.graduation_year || 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isPlaced ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 inline-flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Placed
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-300 inline-flex items-center gap-1">
                                <XCircle className="h-3 w-3 text-amber-400" /> Yet to be Placed
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-semibold text-[#1E293B]">
                            {isPlaced ? (s.placed_company || 'N/A') : <span className="text-slate-300">-</span>}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-emerald-700">
                            {isPlaced ? (s.placed_ctc_lpa ? `${s.placed_ctc_lpa} LPA` : (s.salary_package || 'N/A')) : <span className="text-slate-300">-</span>}
                          </td>
                          <td className="py-3 px-4 text-center font-medium text-[#64748B]">
                            {isPlaced ? (s.placement_date || 'N/A') : <span className="text-slate-300">-</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Demographics & Residence Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm">
              <h4 className="font-bold text-[#1E293B] text-xs mb-3">Gender Diversity Distribution</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                  <span className="text-[#64748B] font-medium">Male Candidates</span>
                  <span className="font-bold text-[#1E293B]">{demographics.gender.Male || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                  <span className="text-[#64748B] font-medium">Female Candidates</span>
                  <span className="font-bold text-[#1E293B]">{demographics.gender.Female || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm">
              <h4 className="font-bold text-[#1E293B] text-xs mb-3">Residence Status Distribution</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                  <span className="text-[#64748B] font-medium">Hostellers</span>
                  <span className="font-bold text-[#1E293B]">{demographics.residence.Hosteller || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                  <span className="text-[#64748B] font-medium">Day Scholars</span>
                  <span className="font-bold text-[#1E293B]">{demographics.residence['Day Scholar'] || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
