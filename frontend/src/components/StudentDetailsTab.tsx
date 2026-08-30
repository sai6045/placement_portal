import React, { useState, useEffect, useMemo } from 'react';
import { StudentSummary, StudentFull, Company, User } from '../types';
import { api } from '../api';
import { Upload, FileSpreadsheet, Download, Search, Eye, Plus, X, Check, Mail, Phone, GraduationCap, ExternalLink, AlertCircle, Building2, CheckCircle, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown, CheckCircle2, XCircle, Calendar, Trash2 } from 'lucide-react';

interface StudentDetailsTabProps {
  currentUser: User;
}

type StudentSortField = 's_no' | 'reg_no' | 'name' | 'department' | 'gender' | 'hosteller_status' | 'placement_status';
type SortOrder = 'asc' | 'desc' | null;

export const StudentDetailsTab: React.FC<StudentDetailsTabProps> = ({ currentUser }) => {
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedHosteller, setSelectedHosteller] = useState('');
  const [selectedPlacementStatus, setSelectedPlacementStatus] = useState('');

  // Sorting
  const [sortField, setSortField] = useState<StudentSortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  // Modals state
  const [selectedStudentFull, setSelectedStudentFull] = useState<StudentFull | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Place Student Modal State
  const [placeModalStudent, setPlaceModalStudent] = useState<StudentSummary | null>(null);
  const [eligibleCompanies, setEligibleCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | ''>('');
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placementError, setPlacementError] = useState<string | null>(null);
  const [placementSuccess, setPlacementSuccess] = useState<string | null>(null);

  // Delete Student Modal State
  const [deletingStudent, setDeletingStudent] = useState<StudentSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Select All & Bulk Delete State
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null);
  const [bulkActionMessage, setBulkActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const headerCheckboxRef = React.useRef<HTMLInputElement>(null);

  // Excel Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Manual Add Student Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  const initialStudentForm: Partial<StudentFull> = {
    reg_no: '',
    name: '',
    department: 'CSE',
    gender: 'Male',
    hosteller_status: 'Day Scholar',
    sslc_percentage: 85.0,
    hsc_percentage: 85.0,
    ug_percentage: 80.0,
    pg_percentage: null,
    diploma_percentage: 0.0,
    current_arrears: 0,
    history_arrears: 0,
    graduation_year: new Date().getFullYear(),
    github_id: '',
    linkedin_id: '',
    resume_link: '',
    self_intro_link: '',
    photo_link: '',
    portfolio_link: '',
    email: '',
    phone: '',
    placement_status: 'YET_TO_BE_PLACED',
    placed_company: '',
    salary_package: '',
    remarks: ''
  };

  const [newStudent, setNewStudent] = useState<Partial<StudentFull>>(initialStudentForm);

  const fetchStudents = () => {
    setLoading(true);
    api.getStudents()
      .then(res => setStudents(res))
      .catch(err => console.error('Failed to load students:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Filtered and Sorted list
  const processedStudents = useMemo(() => {
    let result = [...students];

    // 1. Search Query (Reg No, Name, Dept)
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(s =>
        (s.reg_no && s.reg_no.toLowerCase().includes(q)) ||
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.department && s.department.toLowerCase().includes(q)) ||
        (s.dept && s.dept.toLowerCase().includes(q))
      );
    }

    // 2. Department
    if (selectedDept) {
      result = result.filter(s => (s.department || s.dept || '').toUpperCase() === selectedDept.toUpperCase());
    }

    // 3. Gender
    if (selectedGender) {
      result = result.filter(s => s.gender === selectedGender);
    }

    // 4. Hosteller / Day Scholar
    if (selectedHosteller) {
      result = result.filter(s => (s.hosteller_status || s.hosteller_day_scholar || '') === selectedHosteller);
    }

    // 5. Placement Status
    if (selectedPlacementStatus) {
      result = result.filter(s => {
        const isPlaced = (s.placement_status || '').toUpperCase() === 'PLACED';
        return selectedPlacementStatus === 'PLACED' ? isPlaced : !isPlaced;
      });
    }

    // 6. Sorting
    if (sortField && sortOrder) {
      result.sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (sortField === 's_no') {
          valA = a.s_no ?? 0;
          valB = b.s_no ?? 0;
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
  }, [students, search, selectedDept, selectedGender, selectedHosteller, selectedPlacementStatus, sortField, sortOrder]);

  const handleSortToggle = (field: StudentSortField) => {
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
    setSelectedGender('');
    setSelectedHosteller('');
    setSelectedPlacementStatus('');
    setSortField(null);
    setSortOrder(null);
  };

  const renderSortIcon = (field: StudentSortField) => {
    if (sortField !== field || !sortOrder) {
      return <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-60 inline ml-1" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-[#3B82F6] font-bold inline ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 text-[#3B82F6] font-bold inline ml-1" />
    );
  };

  const handleOpenMore = (studentId: number) => {
    setLoadingDetails(true);
    api.getStudentDetails(studentId)
      .then(res => setSelectedStudentFull(res))
      .catch(err => alert('Failed to fetch full student details: ' + (err.response?.data?.error || err.message)))
      .finally(() => setLoadingDetails(false));
  };

  const handleOpenPlaceModal = async (student: StudentSummary) => {
    setPlaceModalStudent(student);
    setSelectedCompanyId('');
    setPlacementError(null);
    setPlacementSuccess(null);
    setLoadingEligible(true);

    try {
      const comps = await api.getCompanies({
        status: 'Drive Completed',
        approval_status: 'APPROVED'
      });
      setEligibleCompanies(comps);
    } catch (err: any) {
      console.error('Failed to load eligible companies:', err);
      setPlacementError('Failed to fetch eligible companies.');
    } finally {
      setLoadingEligible(false);
    }
  };

  const selectedCompany = eligibleCompanies.find(c => c.id === Number(selectedCompanyId));

  const handleConfirmPlacement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placeModalStudent || !selectedCompanyId) {
      setPlacementError('Please select an approved completed company.');
      return;
    }

    setPlacing(true);
    setPlacementError(null);
    setPlacementSuccess(null);

    try {
      const res = await api.placeStudent(placeModalStudent.id, Number(selectedCompanyId));
      setPlacementSuccess(res.message || `Student successfully placed at ${selectedCompany?.name || 'company'}.`);
      fetchStudents();
      setTimeout(() => {
        setPlaceModalStudent(null);
        setPlacementSuccess(null);
      }, 1500);
    } catch (err: any) {
      setPlacementError(err.response?.data?.error || err.response?.data?.details || 'Failed to place student.');
    } finally {
      setPlacing(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingStudent) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteStudent(deletingStudent.id);
      setDeletingStudent(null);
      fetchStudents();
    } catch (err: any) {
      setDeleteError(err.response?.data?.error || err.response?.data?.details || 'Failed to delete student.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Requirement 12: Clear selection whenever search / filters change
  useEffect(() => {
    setSelectedStudentIds([]);
  }, [search, selectedDept, selectedGender, selectedHosteller, selectedPlacementStatus]);

  // Derived selection state for currently displayed students
  const displayedIds = useMemo(() => processedStudents.map(s => s.id), [processedStudents]);

  const allDisplayedSelected = useMemo(() => {
    return displayedIds.length > 0 && displayedIds.every(id => selectedStudentIds.includes(id));
  }, [displayedIds, selectedStudentIds]);

  const someDisplayedSelected = useMemo(() => {
    return displayedIds.some(id => selectedStudentIds.includes(id)) && !allDisplayedSelected;
  }, [displayedIds, selectedStudentIds, allDisplayedSelected]);

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someDisplayedSelected;
    }
  }, [someDisplayedSelected]);

  const handleToggleSelectAll = () => {
    if (allDisplayedSelected) {
      // Unselect all currently displayed students
      setSelectedStudentIds(prev => prev.filter(id => !displayedIds.includes(id)));
    } else {
      // Select all currently displayed students
      setSelectedStudentIds(prev => Array.from(new Set([...prev, ...displayedIds])));
    }
  };

  const handleToggleSelectStudent = (id: number) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Check placed students in the current selection for warnings
  const selectedStudentsObjects = useMemo(() => {
    return students.filter(s => selectedStudentIds.includes(s.id));
  }, [students, selectedStudentIds]);

  const placedCountInSelection = useMemo(() => {
    return selectedStudentsObjects.filter(s => (s.placement_status || '').toUpperCase() === 'PLACED').length;
  }, [selectedStudentsObjects]);

  const hasPlacedStudentsInSelection = placedCountInSelection > 0;

  const handleConfirmBulkDelete = async () => {
    if (selectedStudentIds.length === 0) return;
    setIsBulkDeleting(true);
    setBulkDeleteError(null);
    try {
      const res = await api.bulkDeleteStudents(selectedStudentIds);
      const count = res.deleted_count || selectedStudentIds.length;
      setSelectedStudentIds([]);
      setIsBulkDeleteModalOpen(false);
      setBulkActionMessage({ type: 'success', text: `${count} students deleted successfully.` });
      fetchStudents();
      setTimeout(() => setBulkActionMessage(null), 4000);
    } catch (err: any) {
      setBulkDeleteError(err.response?.data?.error || err.response?.data?.details || 'Failed to delete selected students.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleFileUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploading(true);
    setUploadMessage(null);
    try {
      const res = await api.uploadStudentExcel(uploadFile);
      // Build a rich success message with stats
      let msg = res.message;
      if (res.stats) {
        const placed = res.stats.placed ?? 0;
        const ytbp  = res.stats.yet_to_be_placed ?? 0;
        msg += ` | Placed: ${placed} | Yet to be Placed: ${ytbp}`;
      }
      setUploadMessage({ type: 'success', text: msg });
      setUploadFile(null);
      fetchStudents();
      setTimeout(() => {
        setIsUploadModalOpen(false);
        setUploadMessage(null);
      }, 3000);
    } catch (err: any) {
      setUploadMessage({
        type: 'error',
        text: err.response?.data?.error || err.response?.data?.details || 'Failed to upload spreadsheet. Please verify columns.'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setAddError(null);
    setAddSuccess(null);

    try {
      await api.addStudent(newStudent);
      setAddSuccess('Student added successfully!');
      setTimeout(() => {
        setIsAddModalOpen(false);
        setAddSuccess(null);
        setNewStudent(initialStudentForm);
        fetchStudents();
      }, 1000);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.response?.data?.details || 'Unable to save student. Please try again.';
      setAddError(errMsg);
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Excel Upload Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-[#1E293B]">Student Directory &amp; Database</h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Manage student records &bull; Search, filter, sort, and place eligible candidates
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Selected Count & Delete Selected for Admin */}
          <div className="flex items-center gap-2 mr-1">
            <span className={`text-xs font-semibold px-2.5 py-2 rounded-lg border transition ${
              selectedStudentIds.length > 0
                ? 'bg-blue-50 text-[#3B82F6] border-blue-200 font-bold'
                : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]'
            }`}>
              Selected: {selectedStudentIds.length}
            </span>

            {currentUser.role === 'ADMIN' && (
              <button
                onClick={() => {
                  if (selectedStudentIds.length > 0) {
                    setBulkDeleteError(null);
                    setIsBulkDeleteModalOpen(true);
                  }
                }}
                disabled={selectedStudentIds.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:hover:bg-rose-600 rounded-lg transition shadow-sm"
                title={selectedStudentIds.length > 0 ? `Delete ${selectedStudentIds.length} selected students` : 'Select students to delete'}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Selected</span>
              </button>
            )}
          </div>

          <a
            href="/api/students/template"
            download
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#1E293B] bg-white hover:bg-[#EFF6FF] border border-[#E2E8F0] hover:border-[#3B82F6] rounded-lg transition"
            title="Download 19-Field Excel Template"
          >
            <Download className="h-3.5 w-3.5 text-[#64748B]" />
            <span>Excel Template</span>
          </a>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#1E293B] bg-white hover:bg-[#EFF6FF] border border-[#E2E8F0] hover:border-[#3B82F6] rounded-lg transition shadow-sm"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-[#3B82F6]" />
            <span>Excel Upload</span>
          </button>

          {(currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER') && (
            <button
              onClick={() => {
                setAddError(null);
                setAddSuccess(null);
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#3B82F6] hover:bg-[#2563EB] rounded-lg transition shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Add Student</span>
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Notification Banner */}
      {bulkActionMessage && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-sm transition ${
          bulkActionMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {bulkActionMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
            <span>{bulkActionMessage.text}</span>
          </div>
          <button onClick={() => setBulkActionMessage(null)} className="text-slate-400 hover:text-slate-600 p-0.5">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs">
            <span className="font-semibold text-[#64748B]">
              Showing {processedStudents.length} of {students.length} students
            </span>
            {selectedStudentIds.length > 0 && (
              <span className="px-2 py-0.5 bg-blue-50 text-[#3B82F6] border border-blue-200 rounded-md font-bold text-[11px]">
                {selectedStudentIds.length} selected
              </span>
            )}
          </div>

          {(search || selectedDept || selectedGender || selectedHosteller || selectedPlacementStatus || sortField) && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition self-start sm:self-auto"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Search box */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search Reg No, Name, Dept..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6]"
            />
          </div>

          {/* Department filter */}
          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full py-2 px-3 bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            >
              <option value="">All Departments</option>
              <option value="CSE">CSE</option>
              <option value="IT">IT</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="MECH">MECH</option>
              <option value="CIVIL">CIVIL</option>
            </select>
          </div>

          {/* Gender filter */}
          <div>
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="w-full py-2 px-3 bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          {/* Hosteller filter */}
          <div>
            <select
              value={selectedHosteller}
              onChange={(e) => setSelectedHosteller(e.target.value)}
              className="w-full py-2 px-3 bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            >
              <option value="">All Residence</option>
              <option value="Day Scholar">Day Scholar</option>
              <option value="Hosteller">Hosteller</option>
            </select>
          </div>

          {/* Placement Status filter */}
          <div>
            <select
              value={selectedPlacementStatus}
              onChange={(e) => setSelectedPlacementStatus(e.target.value)}
              className="w-full py-2 px-3 bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            >
              <option value="">All Statuses</option>
              <option value="PLACED">Placed</option>
              <option value="YET_TO_BE_PLACED">Yet to be Placed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table — Exactly 6 fields: S.No, Reg No, Name, Dept, Gender, Hosteller/Day Scholar + Actions */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[#64748B] text-xs">
            <div className="animate-spin h-5 w-5 border-2 border-[#3B82F6] border-t-transparent rounded-full mx-auto mb-2"></div>
            Loading student records...
          </div>
        ) : processedStudents.length === 0 ? (
          <div className="py-16 text-center text-[#64748B]">
            <GraduationCap className="h-8 w-8 text-[#94A3B8] mx-auto mb-2" />
            <p className="font-semibold text-xs text-[#1E293B]">No student records found</p>
            <p className="text-[11px] text-[#64748B] mt-0.5">Try adjusting your search query or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#EFF6FF] text-[#1E293B] font-semibold border-b border-[#E2E8F0] select-none">
                  {/* Select All Checkbox */}
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      aria-label="Select All"
                      checked={allDisplayedSelected}
                      ref={headerCheckboxRef}
                      onChange={handleToggleSelectAll}
                      className="h-4 w-4 rounded border-[#CBD5E1] text-[#3B82F6] focus:ring-[#3B82F6] cursor-pointer"
                      title="Select / Unselect all displayed students"
                    />
                  </th>
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
                    Reg No {renderSortIcon('reg_no')}
                  </th>
                  <th
                    onClick={() => handleSortToggle('name')}
                    className="py-3 px-4 cursor-pointer hover:bg-blue-100/60 transition"
                  >
                    Name {renderSortIcon('name')}
                  </th>
                  <th
                    onClick={() => handleSortToggle('department')}
                    className="py-3 px-4 cursor-pointer hover:bg-blue-100/60 transition"
                  >
                    Dept {renderSortIcon('department')}
                  </th>
                  <th
                    onClick={() => handleSortToggle('gender')}
                    className="py-3 px-4 cursor-pointer hover:bg-blue-100/60 transition"
                  >
                    Gender {renderSortIcon('gender')}
                  </th>
                  <th
                    onClick={() => handleSortToggle('hosteller_status')}
                    className="py-3 px-4 cursor-pointer hover:bg-blue-100/60 transition"
                  >
                    Hosteller/Day Scholar {renderSortIcon('hosteller_status')}
                  </th>
                  <th
                    onClick={() => handleSortToggle('placement_status')}
                    className="py-3 px-4 text-center cursor-pointer hover:bg-blue-100/60 transition"
                  >
                    Placement Status {renderSortIcon('placement_status')}
                  </th>
                  <th className="py-3 px-4 text-center w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#1E293B]">
                {processedStudents.map((student, idx) => {
                  const isPlaced = (student.placement_status || '').toUpperCase() === 'PLACED';
                  const isSelected = selectedStudentIds.includes(student.id);

                  return (
                    <tr 
                      key={student.id} 
                      className={`transition ${isSelected ? 'bg-blue-50/70 hover:bg-blue-100/60' : 'hover:bg-[#EFF6FF]/60'}`}
                    >
                      {/* Row Checkbox */}
                      <td className="py-3 px-3 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label={`Select student ${student.name}`}
                          checked={isSelected}
                          onChange={() => handleToggleSelectStudent(student.id)}
                          className="h-4 w-4 rounded border-[#CBD5E1] text-[#3B82F6] focus:ring-[#3B82F6] cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-[#64748B]">
                        {student.s_no || idx + 1}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-[#3B82F6]">
                        {student.reg_no}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#1E293B]">
                        {student.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-[#F8FAFC] text-[#64748B] font-medium rounded text-[11px] border border-[#E2E8F0]">
                          {student.department || student.dept}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#64748B]">
                        {student.gender}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]">
                          {student.hosteller_status || student.hosteller_day_scholar || 'Day Scholar'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isPlaced ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Placed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-300 inline-flex items-center gap-1">
                            <XCircle className="h-3 w-3 text-amber-400" /> Yet to be Placed
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* [ More ] Button */}
                          <button
                            onClick={() => handleOpenMore(student.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#3B82F6] bg-[#EFF6FF] hover:bg-blue-100 border border-blue-200 rounded-md transition"
                            title="View Complete 18-Field Profile"
                          >
                            <Eye className="h-3 w-3" /> More
                          </button>

                          {/* [ Place Student ] */}
                          {!isPlaced && (
                            <button
                              onClick={() => handleOpenPlaceModal(student)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition"
                              title="Place student into an Approved Drive Completed company"
                            >
                              <Building2 className="h-3 w-3 text-emerald-600" /> Place
                            </button>
                          )}

                          {/* [ Delete Student ] - Admin Only */}
                          {currentUser.role === 'ADMIN' && (
                            <button
                              onClick={() => {
                                setDeletingStudent(student);
                                setDeleteError(null);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition"
                              title="Delete Student Record"
                            >
                              <Trash2 className="h-3 w-3 text-rose-600" /> Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PLACE STUDENT MODAL */}
      {placeModalStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 border border-[#E2E8F0]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1E293B] text-base">Place Student</h3>
                  <p className="text-xs text-[#64748B]">Confirm placement into an Approved Completed Company</p>
                </div>
              </div>
              <button
                onClick={() => setPlaceModalStudent(null)}
                className="p-1 text-[#64748B] hover:text-[#1E293B]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {placementError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{placementError}</span>
              </div>
            )}

            {placementSuccess && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{placementSuccess}</span>
              </div>
            )}

            <form onSubmit={handleConfirmPlacement} className="py-4 space-y-3.5 text-xs">
              {/* Read-Only Student Information */}
              <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Student Name:</span>
                  <strong className="text-[#1E293B]">{placeModalStudent.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Register No:</span>
                  <span className="font-mono font-bold text-[#3B82F6]">{placeModalStudent.reg_no}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Department:</span>
                  <span className="font-medium text-[#1E293B]">{placeModalStudent.department || placeModalStudent.dept}</span>
                </div>
              </div>

              {/* Company Selection Dropdown */}
              <div>
                <label className="block font-semibold text-[#1E293B] mb-1">
                  Select Completed Company *
                </label>
                {loadingEligible ? (
                  <div className="p-2 text-center text-[#64748B] text-xs">Loading approved companies...</div>
                ) : eligibleCompanies.length === 0 ? (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-[11px]">
                    No approved companies with "Drive Completed" status are currently available in Supabase.
                  </div>
                ) : (
                  <select
                    required
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#3B82F6]"
                  >
                    <option value="">-- Select Completed Company --</option>
                    {eligibleCompanies.map(comp => (
                      <option key={comp.id} value={comp.id}>
                        {comp.name} ({comp.location}) - {comp.ctc_lpa ? `${comp.ctc_lpa} LPA` : 'N/A'} (Placed: {comp.placed_students ?? 0}/{comp.no_of_hirings ?? comp.employee_count ?? 0})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Auto-populated Read-Only CTC Field */}
              <div>
                <label className="block font-semibold text-[#1E293B] mb-1">
                  CTC (LPA) [Official Company Package]
                </label>
                <input
                  type="text"
                  readOnly
                  value={
                    selectedCompany
                      ? (selectedCompany.ctc_lpa !== undefined && selectedCompany.ctc_lpa !== null ? `${selectedCompany.ctc_lpa} LPA` : (selectedCompany.package_offered || 'N/A'))
                      : 'Select a company above'
                  }
                  className="w-full p-2 bg-slate-100 border border-[#E2E8F0] rounded-lg text-xs font-bold text-emerald-800 cursor-not-allowed"
                />
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Automatically populated from the company's verified CTC record.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setPlaceModalStudent(null)}
                  className="px-3.5 py-1.5 bg-white text-[#64748B] font-semibold rounded-lg hover:bg-[#F8FAFC] border border-[#E2E8F0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={placing || !selectedCompanyId || eligibleCompanies.length === 0}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm disabled:opacity-50 transition flex items-center gap-1.5"
                >
                  {placing ? 'Placing...' : 'Confirm Placement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MORE MODAL — Complete 18 Field Record */}
      {selectedStudentFull && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-3xl w-full p-6 border border-[#E2E8F0] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#EFF6FF] text-[#3B82F6] rounded-lg">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1E293B]">{selectedStudentFull.name}</h3>
                  <p className="text-xs text-[#64748B] font-mono">Reg No: {selectedStudentFull.reg_no} &bull; {selectedStudentFull.department || selectedStudentFull.dept}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentFull(null)}
                className="p-1 text-[#64748B] hover:text-[#1E293B] rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-5 space-y-4 text-xs">
              {/* Placement Status Overview Banner */}
              <div className={`p-3.5 rounded-lg border flex flex-wrap items-center justify-between gap-2 ${
                selectedStudentFull.placement_status === 'PLACED'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Placement Status:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    selectedStudentFull.placement_status === 'PLACED'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-amber-50 text-amber-700 border-amber-300'
                  }`}>
                    {selectedStudentFull.placement_status === 'PLACED' ? 'Placed' : 'Yet to be Placed'}
                  </span>
                </div>

                {selectedStudentFull.placement_status === 'PLACED' && (
                  <div className="flex items-center gap-3 text-xs font-medium">
                    <span>Company: <strong className="font-bold text-emerald-950">{selectedStudentFull.placed_company || selectedStudentFull.placed_company_name || 'N/A'}</strong></span>
                    <span>CTC: <strong className="font-bold text-emerald-950">{selectedStudentFull.placed_ctc_lpa ? `${selectedStudentFull.placed_ctc_lpa} LPA` : (selectedStudentFull.salary_package || 'N/A')}</strong></span>
                    {selectedStudentFull.placement_date && (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-800">
                        <Calendar className="h-3 w-3" /> {selectedStudentFull.placement_date}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Basic Information */}
              <div className="bg-[#F8FAFC] p-4 rounded-lg border border-[#E2E8F0] grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[#64748B] font-medium">1. S.No:</span>
                  <p className="font-bold text-[#1E293B] mt-0.5">{selectedStudentFull.s_no}</p>
                </div>
                <div>
                  <span className="text-[#64748B] font-medium">2. Reg No:</span>
                  <p className="font-bold text-[#3B82F6] font-mono mt-0.5">{selectedStudentFull.reg_no}</p>
                </div>
                <div>
                  <span className="text-[#64748B] font-medium">3. Full Name:</span>
                  <p className="font-bold text-[#1E293B] mt-0.5">{selectedStudentFull.name}</p>
                </div>
                <div>
                  <span className="text-[#64748B] font-medium">4. Department:</span>
                  <p className="font-bold text-[#1E293B] mt-0.5">{selectedStudentFull.department || selectedStudentFull.dept}</p>
                </div>
                <div>
                  <span className="text-[#64748B] font-medium">5. Gender:</span>
                  <p className="font-bold text-[#1E293B] mt-0.5">{selectedStudentFull.gender}</p>
                </div>
                <div>
                  <span className="text-[#64748B] font-medium">6. Hosteller / Day Scholar:</span>
                  <p className="font-bold text-[#1E293B] mt-0.5">{selectedStudentFull.hosteller_status || selectedStudentFull.hosteller_day_scholar}</p>
                </div>
              </div>

              {/* Academic Scores */}
              <div className="bg-[#F8FAFC] p-4 rounded-lg border border-[#E2E8F0] grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[#64748B] font-medium">7. SSLC (10th) %:</span>
                  <p className="font-bold text-[#1E293B] mt-0.5">{selectedStudentFull.sslc_percentage ?? selectedStudentFull.tenth_percentage ?? 0}%</p>
                </div>
                <div>
                  <span className="text-[#64748B] font-medium">8. HSC (12th) %:</span>
                  <p className="font-bold text-[#1E293B] mt-0.5">{selectedStudentFull.hsc_percentage ?? selectedStudentFull.twelfth_percentage ?? 0}%</p>
                </div>
                <div>
                  <span className="text-[#64748B] font-medium">9. UG % / CGPA:</span>
                  <p className="font-bold text-emerald-600 mt-0.5">{selectedStudentFull.ug_percentage ?? selectedStudentFull.cgpa ?? 0}%</p>
                </div>
                <div>
                  <span className="text-[#64748B] font-medium">10. PG % (Optional):</span>
                  <p className="font-bold text-[#1E293B] mt-0.5">
                    {selectedStudentFull.pg_percentage !== null && selectedStudentFull.pg_percentage !== undefined ? `${selectedStudentFull.pg_percentage}%` : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-[#64748B] font-medium">11. Graduation Year:</span>
                  <p className="font-bold text-[#1E293B] mt-0.5">{selectedStudentFull.graduation_year || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[#64748B] font-medium">12. Current Arrears:</span>
                  <p className="font-bold text-[#1E293B] mt-0.5">{selectedStudentFull.current_arrears ?? 0}</p>
                </div>
                <div>
                  <span className="text-[#64748B] font-medium">13. History of Arrears:</span>
                  <p className="font-bold text-[#1E293B] mt-0.5">{selectedStudentFull.history_arrears ?? 0}</p>
                </div>
              </div>

              {/* Profiles & Links */}
              <div className="bg-[#F8FAFC] p-4 rounded-lg border border-[#E2E8F0] grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[#64748B] font-medium">14. GitHub ID:</span>
                  <p className="font-medium text-[#1E293B] mt-0.5">{selectedStudentFull.github_id || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[#64748B] font-medium">15. LinkedIn ID / URL:</span>
                  <p className="font-medium text-[#1E293B] mt-0.5">{selectedStudentFull.linkedin_id || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[#64748B] font-medium">16. Resume Link:</span>
                  <p className="mt-0.5">
                    {selectedStudentFull.resume_link ? (
                      <a href={selectedStudentFull.resume_link} target="_blank" rel="noreferrer" className="text-[#3B82F6] hover:underline inline-flex items-center gap-1 font-medium">
                        View Resume <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-[#64748B] font-medium">17. Portfolio Link:</span>
                  <p className="mt-0.5">
                    {selectedStudentFull.portfolio_link ? (
                      <a href={selectedStudentFull.portfolio_link} target="_blank" rel="noreferrer" className="text-[#3B82F6] hover:underline inline-flex items-center gap-1 font-medium">
                        View Portfolio <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-[#EFF6FF]/60 p-4 rounded-lg border border-blue-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#64748B]" />
                  <div>
                    <span className="text-[#64748B] font-medium">18. Email:</span>
                    <p className="font-semibold text-[#1E293B]">{selectedStudentFull.email || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[#64748B]" />
                  <div>
                    <span className="text-[#64748B] font-medium">Mobile No:</span>
                    <p className="font-semibold text-[#1E293B]">{selectedStudentFull.phone || selectedStudentFull.mobile_no || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex justify-end">
              <button
                onClick={() => setSelectedStudentFull(null)}
                className="px-4 py-2 bg-[#1E293B] hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXCEL UPLOAD MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full p-6 border border-[#E2E8F0]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h3 className="font-bold text-[#1E293B] text-base flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-[#3B82F6]" />
                Upload Student Excel Sheet
              </h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="p-1 text-[#64748B] hover:text-[#1E293B]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {uploadMessage && (
              <div className={`mt-4 p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                uploadMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {uploadMessage.type === 'success' ? <Check className="h-4 w-4 text-emerald-600 shrink-0" /> : <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />}
                <span>{uploadMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleFileUploadSubmit} className="py-4 space-y-4 text-xs">
              <div className="border-2 border-dashed border-[#E2E8F0] hover:border-[#3B82F6] rounded-xl p-6 text-center cursor-pointer transition bg-[#F8FAFC]">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="student-excel-file"
                />
                <label htmlFor="student-excel-file" className="cursor-pointer block space-y-2">
                  <Upload className="h-8 w-8 text-[#3B82F6] mx-auto" />
                  <p className="font-bold text-[#1E293B]">
                    {uploadFile ? uploadFile.name : 'Click to select student spreadsheet'}
                  </p>
                  <p className="text-[11px] text-[#64748B]">Supported formats: .xlsx, .xls, .csv</p>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-3.5 py-1.5 bg-white text-[#64748B] font-semibold rounded-lg hover:bg-[#F8FAFC] border border-[#E2E8F0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadFile || uploading}
                  className="px-4 py-1.5 bg-[#3B82F6] text-white font-bold rounded-lg hover:bg-[#2563EB] disabled:opacity-50 transition flex items-center gap-1.5"
                >
                  {uploading ? 'Processing File...' : 'Upload & Process'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL ADD STUDENT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-xl w-full p-6 border border-[#E2E8F0] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h3 className="font-bold text-[#1E293B] text-base flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#3B82F6]" />
                Add Student Manually
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-[#64748B] hover:text-[#1E293B]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {addError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            {addSuccess && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{addSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAddStudentSubmit} className="py-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#1E293B]">Register Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 721422104001"
                    value={newStudent.reg_no}
                    onChange={e => setNewStudent({...newStudent, reg_no: e.target.value})}
                    className="w-full mt-1 p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs focus:ring-2 focus:ring-[#3B82F6]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#1E293B]">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={newStudent.name}
                    onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                    className="w-full mt-1 p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs focus:ring-2 focus:ring-[#3B82F6]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#1E293B]">Department *</label>
                  <select
                    value={newStudent.department}
                    onChange={e => setNewStudent({...newStudent, department: e.target.value})}
                    className="w-full mt-1 p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs focus:ring-2 focus:ring-[#3B82F6]"
                  >
                    <option value="CSE">CSE</option>
                    <option value="IT">IT</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[#1E293B]">Gender *</label>
                  <select
                    value={newStudent.gender}
                    onChange={e => setNewStudent({...newStudent, gender: e.target.value})}
                    className="w-full mt-1 p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs focus:ring-2 focus:ring-[#3B82F6]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[#1E293B]">Residence Status *</label>
                  <select
                    value={newStudent.hosteller_status}
                    onChange={e => setNewStudent({...newStudent, hosteller_status: e.target.value})}
                    className="w-full mt-1 p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs focus:ring-2 focus:ring-[#3B82F6]"
                  >
                    <option value="Day Scholar">Day Scholar</option>
                    <option value="Hosteller">Hosteller</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[#1E293B]">UG % / CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="85.5"
                    value={newStudent.ug_percentage || ''}
                    onChange={e => setNewStudent({...newStudent, ug_percentage: parseFloat(e.target.value) || 0})}
                    className="w-full mt-1 p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs focus:ring-2 focus:ring-[#3B82F6]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 bg-white text-[#64748B] font-semibold rounded-lg hover:bg-[#F8FAFC] border border-[#E2E8F0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-1.5 bg-[#3B82F6] text-white font-bold rounded-lg hover:bg-[#2563EB] disabled:opacity-50 transition"
                >
                  {formSubmitting ? 'Saving...' : 'Save Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-[#E2E8F0] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5 text-rose-600">
                <div className="p-2 bg-rose-50 rounded-lg">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1E293B] text-base">Confirm Student Deletion</h3>
                  <p className="text-xs text-[#64748B]">This action is irreversible</p>
                </div>
              </div>
              <button
                onClick={() => { setDeletingStudent(null); setDeleteError(null); }}
                className="p-1 hover:bg-[#F8FAFC] rounded-lg text-[#64748B]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-[#1E293B] font-medium">
                Are you sure you want to delete this student from the placement database?
              </p>

              <div className="bg-[#F8FAFC] p-3.5 rounded-lg border border-[#E2E8F0] space-y-2 font-medium">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Student Name:</span>
                  <span className="font-bold text-[#1E293B]">{deletingStudent.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Roll / Reg No:</span>
                  <span className="font-mono font-bold text-[#3B82F6]">{deletingStudent.reg_no}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Department:</span>
                  <span className="font-semibold text-[#1E293B]">{deletingStudent.department || deletingStudent.dept}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Placement Status:</span>
                  <span className={`font-bold ${
                    (deletingStudent.placement_status || '').toUpperCase() === 'PLACED' ? 'text-emerald-700' : 'text-amber-700'
                  }`}>
                    {(deletingStudent.placement_status || '').toUpperCase() === 'PLACED' ? 'Placed' : 'Yet to be Placed'}
                  </span>
                </div>
              </div>

              {/* Strong warning if student is PLACED */}
              {(deletingStudent.placement_status || '').toUpperCase() === 'PLACED' && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-2.5 text-amber-900">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <p className="font-semibold leading-relaxed">
                    This student has an active placement record. Deleting the student will also remove the associated placement record and automatically recalculate company placement counts.
                  </p>
                </div>
              )}

              {deleteError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                  <span>{deleteError}</span>
                </div>
              )}
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => { setDeletingStudent(null); setDeleteError(null); }}
                className="px-3.5 py-2 bg-white text-[#64748B] font-semibold text-xs rounded-lg hover:bg-[#F8FAFC] border border-[#E2E8F0]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-sm disabled:opacity-50 transition flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK DELETE CONFIRMATION MODAL */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-[#E2E8F0] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5 text-rose-600">
                <div className="p-2 bg-rose-50 rounded-lg">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1E293B] text-base">Confirm Bulk Deletion</h3>
                  <p className="text-xs text-[#64748B]">Delete {selectedStudentIds.length} selected student(s)</p>
                </div>
              </div>
              <button
                onClick={() => { setIsBulkDeleteModalOpen(false); setBulkDeleteError(null); }}
                className="p-1 hover:bg-[#F8FAFC] rounded-lg text-[#64748B]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-[#1E293B] font-medium">
                Are you sure you want to delete the <strong>{selectedStudentIds.length}</strong> selected student(s) from the portal database?
              </p>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-semibold">
                ⚠️ This action cannot be undone. All personal details, academic percentages, and portfolio links for the selected students will be permanently deleted.
              </div>

              {/* Placed student warning */}
              {hasPlacedStudentsInSelection && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-2.5 text-amber-900">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <p className="font-semibold leading-relaxed">
                    Some selected students ({placedCountInSelection}) have active placement records. Their associated placement records will also be removed, and company placement counts will be automatically updated.
                  </p>
                </div>
              )}

              {bulkDeleteError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                  <span>{bulkDeleteError}</span>
                </div>
              )}
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => { setIsBulkDeleteModalOpen(false); setBulkDeleteError(null); }}
                className="px-3.5 py-2 bg-white text-[#64748B] font-semibold text-xs rounded-lg hover:bg-[#F8FAFC] border border-[#E2E8F0]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                disabled={isBulkDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-sm disabled:opacity-50 transition flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {isBulkDeleting ? 'Deleting...' : `Delete ${selectedStudentIds.length} Students`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
