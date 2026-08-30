import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Company, CompanyStatus, ApprovalStatus, User, CompanyRegistration } from '../types';
import { api } from '../api';
import { 
  Building2, 
  Search, 
  Mail, 
  Phone, 
  Snowflake, 
  Sun, 
  Zap, 
  CheckCircle2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Edit,
  Edit3, 
  X, 
  MapPin, 
  Globe, 
  ExternalLink, 
  Eye, 
  Download, 
  FileSpreadsheet, 
  AlertCircle, 
  RotateCcw, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  FileText,
  Copy,
  Users,
  Link2,
  GraduationCap,
  Upload,
  Trash2
} from 'lucide-react';

interface CompanyDetailsTabProps {
  currentUser: User;
  refreshTrigger?: number;
  initialFilter?: { status?: string; approvalStatus?: string } | null;
}

type CompanySortField = 'id' | 'name' | 'location' | 'no_of_hirings' | 'ctc_lpa' | 'placed_students' | 'status' | 'approval_status';
type SortOrder = 'asc' | 'desc' | null;

export const CompanyDetailsTab: React.FC<CompanyDetailsTabProps> = ({ currentUser, refreshTrigger, initialFilter }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>(initialFilter?.status || '');
  const [selectedApprovalStatus, setSelectedApprovalStatus] = useState<string>(initialFilter?.approvalStatus || '');

  useEffect(() => {
    if (initialFilter?.status !== undefined) {
      setSelectedStatus(initialFilter.status);
    }
    if (initialFilter?.approvalStatus !== undefined) {
      setSelectedApprovalStatus(initialFilter.approvalStatus);
    }
  }, [initialFilter]);

  // Sorting
  const [sortField, setSortField] = useState<CompanySortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  // Export states
  const [exporting, setExporting] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [exportMessage, setExportMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // "More" / "View Details" modal
  const [selectedCompanyFull, setSelectedCompanyFull] = useState<Company | null>(null);

  // Registered Students Modal State
  const [registrationModalCompany, setRegistrationModalCompany] = useState<Company | null>(null);
  const [selectedCompanyForRegistrations, setSelectedCompanyForRegistrations] = useState<Company | null>(null);
  const [registrations, setRegistrations] = useState<CompanyRegistration[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [regSearch, setRegSearch] = useState('');
  const [regDept, setRegDept] = useState('');
  const [regGender, setRegGender] = useState('');
  const [regStudentType, setRegStudentType] = useState('');
  const [regStatus, setRegStatus] = useState('');
  const [regPlacementStatus, setRegPlacementStatus] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Placed Students Modal State
  const [placedModalCompany, setPlacedModalCompany] = useState<Company | null>(null);
  const [placedStudentsList, setPlacedStudentsList] = useState<any[]>([]);
  const [loadingPlacedStudents, setLoadingPlacedStudents] = useState(false);
  const [placedStudentsError, setPlacedStudentsError] = useState<string | null>(null);

  const handleOpenPlacedStudentsModal = async (comp: Company) => {
    setPlacedModalCompany(comp);
    setPlacedStudentsList([]);
    setPlacedStudentsError(null);
    setLoadingPlacedStudents(true);
    try {
      const data = await api.getCompanyPlacedStudents(comp.id);
      setPlacedStudentsList(data.students || []);
    } catch (err: any) {
      console.error('Failed to load placed students for company:', err);
      setPlacedStudentsError(err.response?.data?.error || err.response?.data?.details || 'Failed to load placed candidates.');
    } finally {
      setLoadingPlacedStudents(false);
    }
  };

  // Status editing modal (Relationship Status only)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [newStatus, setNewStatus] = useState<CompanyStatus>('Warm');
  const [editPlacedStudents, setEditPlacedStudents] = useState<number>(0);
  const [statusEditError, setStatusEditError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Full Company & JD Edit Modal State
  const [fullEditModalCompany, setFullEditModalCompany] = useState<Company | null>(null);
  const [fullEditForm, setFullEditForm] = useState({
    company_name: '',
    location: '',
    website: '',
    contact_person_number: '',
    contact_person_email: '',
    no_of_hirings: 10,
    ctc_lpa: 6.0,
    status: 'Cold' as CompanyStatus,
    google_maps_link: '',
    placed_students: 0
  });
  const [editJdFile, setEditJdFile] = useState<File | null>(null);
  const [existingJdName, setExistingJdName] = useState<string | null>(null);
  const [removeJd, setRemoveJd] = useState(false);
  const [fullEditSubmitting, setFullEditSubmitting] = useState(false);
  const [fullEditError, setFullEditError] = useState<string | null>(null);
  const [fullEditSuccess, setFullEditSuccess] = useState<string | null>(null);
  const jdFileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchCompanies = () => {
    setLoading(true);
    api.getCompanies()
      .then(res => setCompanies(res))
      .catch(err => console.error('Failed to fetch companies:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCompanies();
  }, [refreshTrigger]);

  const getStatusBadge = (status: CompanyStatus) => {
    switch (status) {
      case 'Cold':
        return {
          icon: Snowflake,
          color: 'bg-blue-50 text-blue-700 border-blue-200',
          label: 'Cold'
        };
      case 'Warm':
        return {
          icon: Sun,
          color: 'bg-amber-50 text-amber-700 border-amber-200',
          label: 'Warm'
        };
      case 'Hot':
        return {
          icon: Zap,
          color: 'bg-rose-50 text-rose-700 border-rose-200',
          label: 'Hot'
        };
      case 'Drive Completed':
        return {
          icon: CheckCircle2,
          color: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          label: 'Drive Completed'
        };
      default:
        return {
          icon: Sun,
          color: 'bg-slate-50 text-slate-700 border-slate-200',
          label: status
        };
    }
  };

  const getApprovalBadge = (appStatus?: ApprovalStatus) => {
    switch (appStatus) {
      case 'APPROVED':
        return {
          icon: CheckCircle,
          style: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
          label: 'Approved'
        };
      case 'REJECTED':
        return {
          icon: XCircle,
          style: 'bg-rose-50 text-rose-800 border-rose-300 font-bold',
          label: 'Rejected'
        };
      case 'PENDING':
      default:
        return {
          icon: Clock,
          style: 'bg-amber-50 text-amber-800 border-amber-300 font-bold',
          label: 'Pending'
        };
    }
  };

  // Filtered & Sorted companies
  const processedCompanies = useMemo(() => {
    let result = [...companies];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(c => 
        (c.company_name && c.company_name.toLowerCase().includes(q)) ||
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.location && c.location.toLowerCase().includes(q)) ||
        (c.contact_person_number && c.contact_person_number.includes(q)) ||
        (c.contact_phone && c.contact_phone.includes(q)) ||
        (c.contact_person_email && c.contact_person_email.toLowerCase().includes(q)) ||
        (c.contact_email && c.contact_email.toLowerCase().includes(q))
      );
    }

    // Relationship status filter
    if (selectedStatus) {
      if (selectedStatus === 'ACTIVE') {
        result = result.filter(c => c.status === 'Hot' || c.status === 'Warm');
      } else {
        result = result.filter(c => c.status === selectedStatus);
      }
    }

    // Approval status filter
    if (selectedApprovalStatus) {
      result = result.filter(c => (c.approval_status || 'PENDING') === selectedApprovalStatus);
    }

    // Sorting
    if (sortField && sortOrder) {
      result.sort((a, b) => {
        let aVal: any = a[sortField as keyof Company];
        let bVal: any = b[sortField as keyof Company];

        // Specific fallbacks
        if (sortField === 'name') {
          aVal = a.company_name || a.name || '';
          bVal = b.company_name || b.name || '';
        } else if (sortField === 'no_of_hirings') {
          aVal = a.no_of_hirings ?? a.employee_count ?? 0;
          bVal = b.no_of_hirings ?? b.employee_count ?? 0;
        } else if (sortField === 'ctc_lpa') {
          aVal = a.ctc_lpa ?? 0;
          bVal = b.ctc_lpa ?? 0;
        } else if (sortField === 'placed_students') {
          aVal = a.placed_students ?? 0;
          bVal = b.placed_students ?? 0;
        }

        if (aVal === undefined || aVal === null) aVal = '';
        if (bVal === undefined || bVal === null) bVal = '';

        if (typeof aVal === 'string') {
          return sortOrder === 'asc' 
            ? aVal.localeCompare(String(bVal)) 
            : String(bVal).localeCompare(aVal);
        }

        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      });
    }

    return result;
  }, [companies, search, selectedStatus, selectedApprovalStatus, sortField, sortOrder]);

  const handleSort = (field: CompanySortField) => {
    handleSortToggle(field);
  };

  const handleSortToggle = (field: CompanySortField) => {
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
    setSelectedStatus('');
    setSelectedApprovalStatus('');
    setSortField(null);
    setSortOrder(null);
  };

  const handleResetSort = () => {
    setSortField(null);
    setSortOrder(null);
  };

  const renderSortIcon = (field: CompanySortField) => {
    if (sortField !== field || !sortOrder) {
      return <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-60 inline ml-1" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-[#3B82F6] font-bold inline ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 text-[#3B82F6] font-bold inline ml-1" />
    );
  };

  const handleOpenRegistrationModal = async (comp: Company) => {
    setRegistrationModalCompany(comp);
    setCopyFeedback(null);

    // If company doesn't have token loaded yet, fetch/generate via endpoint
    if (!comp.registration_token) {
      try {
        const linkData = await api.getCompanyRegistrationLink(comp.id);
        if (linkData && linkData.registration_token) {
          const updated = { ...comp, registration_token: linkData.registration_token, registered_students_count: linkData.registered_students_count };
          setRegistrationModalCompany(updated);
          setCompanies(prev => prev.map(c => c.id === comp.id ? updated : c));
        }
      } catch (err) {
        console.error('Failed to get registration link:', err);
      }
    }
  };

  const handleCopyRegistrationLink = (token: string | null | undefined) => {
    if (!token) return;
    const url = `${window.location.origin}/company/register/${token}`;
    navigator.clipboard.writeText(url);
    setCopyFeedback('Registration link copied.');
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  const handleOpenRegistrationForm = (token: string | null | undefined) => {
    if (!token) return;
    window.open(`/company/register/${token}`, '_blank');
  };

  const handleOpenRegistrations = (comp: Company) => {
    setSelectedCompanyForRegistrations(comp);
    setRegSearch('');
    setRegDept('');
    setRegGender('');
    setRegStudentType('');
    setRegStatus('');
    setRegPlacementStatus('');
    setLoadingRegistrations(true);

    api.getCompanyRegistrations(comp.id)
      .then(res => {
        setRegistrations(res.registrations || []);
      })
      .catch(err => console.error('Failed to load company registrations:', err))
      .finally(() => setLoadingRegistrations(false));
  };

  const processedRegistrations = useMemo(() => {
    let list = [...registrations];

    if (regSearch.trim()) {
      const q = regSearch.toLowerCase().trim();
      list = list.filter(r =>
        (r.student_reg_no && r.student_reg_no.toLowerCase().includes(q)) ||
        (r.student_name && r.student_name.toLowerCase().includes(q)) ||
        (r.student_department && r.student_department.toLowerCase().includes(q))
      );
    }

    if (regDept) {
      list = list.filter(r => (r.student_department || '').toUpperCase() === regDept.toUpperCase());
    }

    if (regGender) {
      list = list.filter(r => r.student_gender === regGender);
    }

    if (regStudentType) {
      list = list.filter(r => r.student_type === regStudentType);
    }

    if (regStatus) {
      list = list.filter(r => r.registration_status === regStatus);
    }

    if (regPlacementStatus) {
      list = list.filter(r => {
        const isPlaced = (r.placement_status || '').toUpperCase() === 'PLACED';
        return regPlacementStatus === 'PLACED' ? isPlaced : !isPlaced;
      });
    }

    return list;
  }, [registrations, regSearch, regDept, regGender, regStudentType, regStatus, regPlacementStatus]);

  // Export Template Handler (Blank Excel with headers only)
  const handleExportTemplate = async () => {
    setDownloadingTemplate(true);
    setExportMessage(null);
    try {
      const blob = await api.downloadCompanyTemplate();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Company_Details_Template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Template download failed:', err);
      setExportMessage({
        type: 'error',
        text: 'Failed to download company template. Please try again.'
      });
      setTimeout(() => setExportMessage(null), 3500);
    } finally {
      setDownloadingTemplate(false);
    }
  };

  // Export Filtered Records Handler
  const handleExport = async () => {
    if (processedCompanies.length === 0) {
      setExportMessage({ type: 'error', text: 'No matching company records to export.' });
      setTimeout(() => setExportMessage(null), 3500);
      return;
    }

    setExporting(true);
    setExportMessage(null);
    try {
      const blob = await api.exportCompanies({
        status: selectedStatus || undefined,
        approval_status: selectedApprovalStatus || undefined,
        search: search || undefined
      });

      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      const today = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `Company_Details_${today}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Export failed:', err);
      setExportMessage({
        type: 'error',
        text: err.response?.data?.error || 'No company data available to export.'
      });
      setTimeout(() => setExportMessage(null), 3500);
    } finally {
      setExporting(false);
    }
  };

  const handleOpenStatusEdit = (comp: Company) => {
    setEditingCompany(comp);
    setNewStatus(comp.status);
    setEditPlacedStudents(comp.placed_students || 0);
    setStatusEditError(null);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;
    setStatusEditError(null);

    const hirings = editingCompany.no_of_hirings ?? editingCompany.employee_count ?? 0;

    if (newStatus === 'Drive Completed') {
      if (editPlacedStudents < 0) {
        setStatusEditError('Placed students cannot be negative.');
        return;
      }
      if (editPlacedStudents > hirings) {
        setStatusEditError(`Placed students cannot exceed total hirings (${hirings}).`);
        return;
      }
    }

    setUpdating(true);
    try {
      await api.updateCompany(editingCompany.id, {
        status: newStatus,
        placed_students: newStatus === 'Drive Completed' ? editPlacedStudents : 0
      });
      setEditingCompany(null);
      fetchCompanies();
      if (selectedCompanyFull && selectedCompanyFull.id === editingCompany.id) {
        setSelectedCompanyFull({
          ...selectedCompanyFull,
          status: newStatus,
          placed_students: newStatus === 'Drive Completed' ? editPlacedStudents : 0
        });
      }
    } catch (err: any) {
      setStatusEditError(err.response?.data?.error || 'Failed to update company status');
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenFullEdit = (comp: Company) => {
    setFullEditModalCompany(comp);
    setFullEditForm({
      company_name: comp.company_name || comp.name,
      location: comp.location || '',
      website: comp.website || '',
      contact_person_number: comp.contact_person_number || comp.contact_phone || '',
      contact_person_email: comp.contact_person_email || comp.contact_email || '',
      no_of_hirings: comp.no_of_hirings ?? comp.employee_count ?? 10,
      ctc_lpa: comp.ctc_lpa ?? 6.0,
      status: comp.status || 'Cold',
      google_maps_link: comp.google_maps_link || comp.company_address || '',
      placed_students: comp.placed_students ?? 0
    });
    setEditJdFile(null);
    setExistingJdName(comp.jd_file_name || (comp.jd_file_path ? `${(comp.company_name || comp.name).replace(/\s+/g, '-')}-JD.pdf` : null));
    setRemoveJd(false);
    setFullEditError(null);
    setFullEditSuccess(null);
  };

  const handleFullEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullEditModalCompany) return;
    setFullEditSubmitting(true);
    setFullEditError(null);
    setFullEditSuccess(null);

    // Validations
    if (!fullEditForm.company_name.trim()) {
      setFullEditError('Company Name is required.');
      setFullEditSubmitting(false);
      return;
    }
    if (!fullEditForm.location.trim()) {
      setFullEditError('Location is required.');
      setFullEditSubmitting(false);
      return;
    }
    if (!fullEditForm.google_maps_link.trim()) {
      setFullEditError('Google Maps Location Link is required.');
      setFullEditSubmitting(false);
      return;
    }
    if (fullEditForm.no_of_hirings < 0) {
      setFullEditError('Number of hirings cannot be negative.');
      setFullEditSubmitting(false);
      return;
    }
    if (!fullEditForm.ctc_lpa || fullEditForm.ctc_lpa <= 0) {
      setFullEditError('CTC (LPA) must be greater than 0.');
      setFullEditSubmitting(false);
      return;
    }

    if (fullEditForm.status === 'Drive Completed') {
      if (fullEditForm.placed_students < 0) {
        setFullEditError('Number of placed students cannot be negative.');
        setFullEditSubmitting(false);
        return;
      }
      if (fullEditForm.placed_students > fullEditForm.no_of_hirings) {
        setFullEditError(`Placed students cannot exceed total hirings (${fullEditForm.no_of_hirings}).`);
        setFullEditSubmitting(false);
        return;
      }
    }

    try {
      const formData = new FormData();
      formData.append('name', fullEditForm.company_name);
      formData.append('company_name', fullEditForm.company_name);
      formData.append('location', fullEditForm.location);
      formData.append('website', fullEditForm.website);
      formData.append('contact_person_number', fullEditForm.contact_person_number);
      formData.append('contact_phone', fullEditForm.contact_person_number);
      formData.append('contact_person_email', fullEditForm.contact_person_email);
      formData.append('contact_email', fullEditForm.contact_person_email);
      formData.append('no_of_hirings', String(fullEditForm.no_of_hirings));
      formData.append('ctc_lpa', String(fullEditForm.ctc_lpa));
      formData.append('placed_students', String(fullEditForm.status === 'Drive Completed' ? fullEditForm.placed_students : 0));
      formData.append('google_maps_link', fullEditForm.google_maps_link);
      formData.append('company_address', fullEditForm.google_maps_link);
      formData.append('status', fullEditForm.status);

      if (editJdFile) {
        formData.append('jd_file', editJdFile);
      }
      if (removeJd) {
        formData.append('remove_jd', 'true');
      }

      await api.updateCompany(fullEditModalCompany.id, formData);
      setFullEditSuccess('Company details & Job Description updated successfully!');

      setTimeout(() => {
        setFullEditModalCompany(null);
        setFullEditSuccess(null);
        setEditJdFile(null);
        setExistingJdName(null);
        setRemoveJd(false);
        fetchCompanies();
        if (selectedCompanyFull && selectedCompanyFull.id === fullEditModalCompany.id) {
          api.getCompany(fullEditModalCompany.id).then(updated => setSelectedCompanyFull(updated)).catch(() => {});
        }
      }, 1000);
    } catch (err: any) {
      setFullEditError(err.response?.data?.error || err.response?.data?.details || 'Failed to update company details.');
    } finally {
      setFullEditSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Top-Right Action Area: [ Export Template ] [ Export ] */}
      <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#1E293B] flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#3B82F6]" />
            Company Details Repository
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Single source of truth &bull; Complete placement records, Google Maps links, and exportable Excel reports
          </p>
        </div>

        {/* TOP-RIGHT ACTIONS: [ Export Template ]  [ Export ] */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Button 1: Export Template (Secondary / Outline) */}
          <button
            onClick={handleExportTemplate}
            disabled={downloadingTemplate}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#1E293B] bg-white hover:bg-[#EFF6FF] border border-[#E2E8F0] hover:border-[#3B82F6] rounded-lg transition shadow-sm disabled:opacity-50"
            title="Download blank Excel (.xlsx) company template"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-[#3B82F6]" />
            <span>{downloadingTemplate ? 'Downloading...' : 'Export Template'}</span>
          </button>

          {/* Button 2: Export (Secondary / Outline) */}
          <button
            onClick={handleExport}
            disabled={exporting || processedCompanies.length === 0}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#1E293B] bg-white hover:bg-[#EFF6FF] border border-[#E2E8F0] hover:border-[#3B82F6] rounded-lg transition shadow-sm disabled:opacity-50"
            title="Export filtered company records to Excel (.xlsx)"
          >
            <Download className="h-3.5 w-3.5 text-[#3B82F6]" />
            <span>{exporting ? 'Exporting...' : 'Export'}</span>
          </button>
        </div>
      </div>

      {/* Export Alert Message */}
      {exportMessage && (
        <div className={`p-3.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
          exportMessage.type === 'error'
            ? 'bg-rose-50 text-rose-800 border border-rose-200'
            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
        }`}>
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{exportMessage.text}</span>
        </div>
      )}

      {/* Filter Pills, Search, and Status Controls */}
      <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs font-semibold text-[#64748B]">
            Showing {processedCompanies.length} of {companies.length} companies
          </div>

          {(search || selectedStatus || selectedApprovalStatus || sortField) && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition self-start sm:self-auto"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>

        {/* Quick Relationship Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
          <span className="text-[#64748B] mr-1 text-[11px]">Relationship:</span>
          <button
            onClick={() => setSelectedStatus('')}
            className={`px-3 py-1 rounded-md border transition ${
              selectedStatus === '' ? 'bg-[#3B82F6] text-white border-[#3B82F6]' : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F8FAFC]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedStatus('Cold')}
            className={`px-3 py-1 rounded-md border transition ${
              selectedStatus === 'Cold' ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-600 border-[#E2E8F0] hover:bg-slate-50'
            }`}
          >
            Cold
          </button>
          <button
            onClick={() => setSelectedStatus('Warm')}
            className={`px-3 py-1 rounded-md border transition ${
              selectedStatus === 'Warm' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-amber-700 border-[#E2E8F0] hover:bg-amber-50'
            }`}
          >
            Warm
          </button>
          <button
            onClick={() => setSelectedStatus('Hot')}
            className={`px-3 py-1 rounded-md border transition ${
              selectedStatus === 'Hot' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-red-700 border-[#E2E8F0] hover:bg-red-50'
            }`}
          >
            Hot
          </button>
          <button
            onClick={() => setSelectedStatus('Drive Completed')}
            className={`px-3 py-1 rounded-md border transition ${
              selectedStatus === 'Drive Completed' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-emerald-700 border-[#E2E8F0] hover:bg-emerald-50'
            }`}
          >
            Drive Completed
          </button>
        </div>

        {/* Search & Approval Dropdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-[#E2E8F0]">
          <div className="sm:col-span-2 relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search company name, location, contact, or website..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            />
          </div>

          <div>
            <select
              value={selectedApprovalStatus}
              onChange={e => setSelectedApprovalStatus(e.target.value)}
              className="w-full py-2 px-3 bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            >
              <option value="">All Approval Decisions</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Company List Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[#64748B] text-xs">
            <div className="animate-spin h-5 w-5 border-2 border-[#3B82F6] border-t-transparent rounded-full mx-auto mb-2"></div>
            Loading company records...
          </div>
        ) : processedCompanies.length === 0 ? (
          <div className="py-16 text-center text-[#64748B]">
            <Building2 className="h-8 w-8 text-[#94A3B8] mx-auto mb-2" />
            <p className="font-semibold text-xs text-[#1E293B]">No companies matching your criteria.</p>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Try clearing filters or adding recruiter companies via Faculty Members.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#EFF6FF] text-[#1E293B] font-semibold border-b border-[#E2E8F0] select-none">
                  <th
                    onClick={() => handleSortToggle('id')}
                    className="py-3 px-4 w-14 text-center cursor-pointer hover:bg-blue-100/60 transition"
                  >
                    S.No {renderSortIcon('id')}
                  </th>
                  <th
                    onClick={() => handleSortToggle('name')}
                    className="py-3 px-4 cursor-pointer hover:bg-blue-100/60 transition"
                  >
                    Company Name {renderSortIcon('name')}
                  </th>
                  <th
                    onClick={() => handleSortToggle('location')}
                    className="py-3 px-4 cursor-pointer hover:bg-blue-100/60 transition"
                  >
                    Location {renderSortIcon('location')}
                  </th>
                  <th
                    onClick={() => handleSortToggle('no_of_hirings')}
                    className="py-3 px-4 text-center cursor-pointer hover:bg-blue-100/60 transition"
                  >
                    No. of Hirings {renderSortIcon('no_of_hirings')}
                  </th>
                  <th
                    onClick={() => handleSortToggle('ctc_lpa')}
                    className="py-3 px-4 text-center cursor-pointer hover:bg-blue-100/60 transition"
                  >
                    CTC (LPA) {renderSortIcon('ctc_lpa')}
                  </th>
                  <th
                    onClick={() => handleSortToggle('status')}
                    className="py-3 px-4 text-center cursor-pointer hover:bg-blue-100/60 transition"
                  >
                    Relationship Status {renderSortIcon('status')}
                  </th>
                  <th
                    onClick={() => handleSortToggle('placed_students')}
                    className="py-3 px-4 text-center cursor-pointer hover:bg-blue-100/60 transition"
                  >
                    Placed Students {renderSortIcon('placed_students')}
                  </th>
                  <th
                    onClick={() => handleSortToggle('approval_status')}
                    className="py-3 px-4 text-center cursor-pointer hover:bg-blue-100/60 transition"
                  >
                    Approval Status {renderSortIcon('approval_status')}
                  </th>
                  <th className="py-3 px-4 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#1E293B]">
                {processedCompanies.map((comp, idx) => {
                  const badge = getStatusBadge(comp.status);
                  const StatusIcon = badge.icon;
                  const appBadge = getApprovalBadge(comp.approval_status);
                  const AppIcon = appBadge.icon;
                  const mapsUrl = comp.google_maps_link || comp.company_address || '';
                  const isDriveCompleted = comp.status === 'Drive Completed';

                  return (
                    <tr key={comp.id} className="hover:bg-[#EFF6FF]/60 transition">
                      {/* S.No */}
                      <td className="py-3.5 px-4 text-center font-medium text-[#64748B]">
                        {idx + 1}
                      </td>

                      {/* Company Name & Website */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#1E293B]">{comp.company_name || comp.name}</div>
                        {comp.website && (
                          <a
                            href={comp.website.startsWith('http') ? comp.website : `https://${comp.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-[#3B82F6] hover:text-[#2563EB] hover:underline inline-flex items-center gap-1 mt-0.5"
                          >
                            <span>Visit Website</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </td>

                      {/* Location & View on Map */}
                      <td className="py-3.5 px-4 text-[#64748B]">
                        <div className="flex items-center gap-1 font-medium text-[#1E293B]">
                          <MapPin className="h-3.5 w-3.5 text-[#64748B] shrink-0" />
                          <span>{comp.location || 'N/A'}</span>
                        </div>
                        {mapsUrl && (
                          <a
                            href={mapsUrl.startsWith('http') ? mapsUrl : `https://${mapsUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-[#3B82F6] hover:text-[#2563EB] font-semibold hover:underline inline-flex items-center gap-1 mt-0.5"
                          >
                            <span>View on Map</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </td>

                      {/* No. of Hirings */}
                      <td className="py-3.5 px-4 text-center font-bold text-[#1E293B]">
                        {comp.no_of_hirings ?? comp.employee_count ?? 0}
                      </td>

                      {/* CTC (LPA) */}
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-700">
                        {comp.ctc_lpa !== undefined && comp.ctc_lpa !== null ? `${comp.ctc_lpa} LPA` : (comp.package_offered || 'N/A')}
                      </td>

                      {/* Relationship Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border inline-flex items-center gap-1 ${badge.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          <span>{comp.status}</span>
                        </span>
                      </td>

                      {/* Placed Students (Compact Icon Button with Popover / Modal) */}
                      <td className="py-3.5 px-4 text-center">
                        {isDriveCompleted ? (
                          (comp.placed_students ?? 0) > 0 ? (
                            <button
                              onClick={() => handleOpenPlacedStudentsModal(comp)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 border border-emerald-300 rounded-lg text-xs font-extrabold transition shadow-2xs group"
                              title={`Click to view ${comp.placed_students} placed student(s)`}
                            >
                              <GraduationCap className="h-3.5 w-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                              <span className="text-[11px]">{comp.placed_students}</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenPlacedStudentsModal(comp)}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-[#F8FAFC] hover:bg-slate-100 text-[#64748B] hover:text-[#1E293B] border border-[#E2E8F0] rounded-lg text-xs font-semibold transition"
                              title="0 students placed (Click to view)"
                            >
                              <GraduationCap className="h-3.5 w-3.5 text-[#94A3B8]" />
                              <span className="text-[11px]">0</span>
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => handleOpenPlacedStudentsModal(comp)}
                            className="inline-flex items-center gap-1 px-1.5 py-1 text-slate-300 hover:text-slate-500 rounded text-xs transition"
                            title="Drive not completed yet (Click to view)"
                          >
                            <GraduationCap className="h-3.5 w-3.5 opacity-40" />
                            <span className="text-[11px] opacity-60">-</span>
                          </button>
                        )}
                      </td>

                      {/* Approval Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border inline-flex items-center gap-1 ${appBadge.style}`}>
                          <AppIcon className="h-3 w-3" />
                          <span>{appBadge.label}</span>
                        </span>
                      </td>

                      {/* Actions / More */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* REGISTRATION ACTION BUTTON */}
                          {comp.approval_status === 'APPROVED' ? (
                            <button
                              onClick={() => handleOpenRegistrationModal(comp)}
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-xs font-bold inline-flex items-center gap-1 transition shadow-xs"
                              title="Student Registration Link"
                            >
                              <Link2 className="h-3 w-3 text-indigo-600" />
                              <span>Registration</span>
                            </button>
                          ) : (
                            <span
                              className="px-2 py-1 text-slate-300 border border-slate-200 rounded-md text-xs font-medium inline-flex items-center gap-1 cursor-not-allowed"
                              title="Registration unavailable until company approval"
                            >
                              <Link2 className="h-3 w-3 opacity-40" />
                              <span className="opacity-60">Registration</span>
                            </span>
                          )}

                          {/* JD Button */}
                          {comp.has_jd || comp.jd_file_path || comp.jd_pdf_link ? (
                            <a
                              href={comp.jd_file_path ? api.getCompanyJDUrl(comp.id, false) : (comp.jd_pdf_link || '#')}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 text-xs font-bold text-[#3B82F6] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition inline-flex items-center gap-1 shadow-2xs"
                              title={`View JD: ${comp.jd_file_name || 'Job Description (PDF)'}`}
                            >
                              <FileText className="h-3 w-3" />
                              <span>JD</span>
                            </a>
                          ) : (
                            <span
                              className="px-2 py-1 text-xs font-medium text-slate-300 border border-slate-200 rounded-md inline-flex items-center gap-1 cursor-not-allowed"
                              title="No JD uploaded"
                            >
                              <FileText className="h-3 w-3 opacity-40" />
                              <span className="opacity-60">JD</span>
                            </span>
                          )}

                          {/* More / View Details Button */}
                          <button
                            onClick={() => setSelectedCompanyFull(comp)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#3B82F6] bg-[#EFF6FF] hover:bg-blue-100 border border-blue-200 rounded-md transition"
                            title="View Complete Company Profile"
                          >
                            <Eye className="h-3 w-3" /> More
                          </button>

                          {/* Edit Details & JD */}
                          <button
                            onClick={() => handleOpenFullEdit(comp)}
                            className="p-1 text-[#3B82F6] hover:bg-blue-50 border border-blue-200 rounded-md transition"
                            title="Edit Company Details & Job Description"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
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

      {/* "MORE" / COMPLETE COMPANY DETAILS MODAL */}
      {selectedCompanyFull && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-6 border border-[#E2E8F0] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#EFF6FF] text-[#3B82F6] rounded-lg">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1E293B]">
                    {selectedCompanyFull.company_name || selectedCompanyFull.name}
                  </h3>
                  <p className="text-xs text-[#64748B]">Complete Placement &amp; Recruiter Profile</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCompanyFull(null)}
                className="p-1 text-[#64748B] hover:text-[#1E293B]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              {/* Status Header Overview */}
              <div className="p-3.5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#64748B]">Relationship Status:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border inline-block ${getStatusBadge(selectedCompanyFull.status).color}`}>
                    {selectedCompanyFull.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#64748B]">Admin Approval Status:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border inline-flex items-center gap-1 ${getApprovalBadge(selectedCompanyFull.approval_status).style}`}>
                    {getApprovalBadge(selectedCompanyFull.approval_status).label}
                  </span>
                </div>
              </div>

              {/* Complete Company Placement Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. Company Name */}
                <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg">
                  <span className="text-[#64748B] font-medium block">1. Company Name</span>
                  <p className="font-bold text-sm text-[#1E293B] mt-0.5">
                    {selectedCompanyFull.company_name || selectedCompanyFull.name}
                  </p>
                </div>

                {/* 2. Location */}
                <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg">
                  <span className="text-[#64748B] font-medium block">2. Location</span>
                  <p className="font-bold text-sm text-[#1E293B] mt-0.5 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-[#3B82F6]" />
                    {selectedCompanyFull.location || 'N/A'}
                  </p>
                </div>

                {/* 3. Website */}
                <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg">
                  <span className="text-[#64748B] font-medium block">3. Website</span>
                  {selectedCompanyFull.website ? (
                    <a
                      href={selectedCompanyFull.website.startsWith('http') ? selectedCompanyFull.website : `https://${selectedCompanyFull.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#3B82F6] hover:underline font-bold mt-0.5 inline-flex items-center gap-1"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      <span>{selectedCompanyFull.website}</span>
                      <ExternalLink className="h-3 w-3 ml-0.5" />
                    </a>
                  ) : (
                    <p className="text-[#64748B] mt-0.5">N/A</p>
                  )}
                </div>

                {/* 4. Contact Person Number */}
                <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg">
                  <span className="text-[#64748B] font-medium block">4. Contact Person Number</span>
                  <p className="font-semibold text-[#1E293B] mt-0.5 flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-[#64748B]" />
                    {selectedCompanyFull.contact_person_number || selectedCompanyFull.contact_phone || 'N/A'}
                  </p>
                </div>

                {/* 5. Contact Person Mail */}
                <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg">
                  <span className="text-[#64748B] font-medium block">5. Contact Person Mail</span>
                  <p className="font-semibold text-[#1E293B] mt-0.5 flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-[#64748B]" />
                    {selectedCompanyFull.contact_person_email || selectedCompanyFull.contact_email || 'N/A'}
                  </p>
                </div>

                {/* 6. No. of Hirings */}
                <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg">
                  <span className="text-[#64748B] font-medium block">6. No. of Hirings Target</span>
                  <p className="font-bold text-sm text-[#1E293B] mt-0.5">
                    {selectedCompanyFull.no_of_hirings ?? selectedCompanyFull.employee_count ?? 0} Students
                  </p>
                </div>

                {/* 7. CTC (LPA) */}
                <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg">
                  <span className="text-[#64748B] font-medium block">7. CTC Package (LPA)</span>
                  <p className="font-bold text-sm text-emerald-700 mt-0.5">
                    {selectedCompanyFull.ctc_lpa !== undefined && selectedCompanyFull.ctc_lpa !== null ? `${selectedCompanyFull.ctc_lpa} LPA` : (selectedCompanyFull.package_offered || 'N/A')}
                  </p>
                </div>

                {/* 8. No. of Placed Students (Shown ONLY when Drive Completed) */}
                {selectedCompanyFull.status === 'Drive Completed' && (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-300 rounded-lg">
                    <span className="text-emerald-900 font-bold block">8. No. of Placed Students</span>
                    <p className="font-extrabold text-base text-emerald-800 mt-0.5">
                      {selectedCompanyFull.placed_students ?? 0} Placed
                    </p>
                  </div>
                )}

                {/* 9. Google Maps Location Link */}
                <div className="sm:col-span-2 p-3 bg-white border border-[#E2E8F0] rounded-lg">
                  <span className="text-[#64748B] font-medium block">9. Google Maps Location Link</span>
                  {selectedCompanyFull.google_maps_link || selectedCompanyFull.company_address ? (
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="text-[#64748B] truncate max-w-md">
                        {selectedCompanyFull.google_maps_link || selectedCompanyFull.company_address}
                      </span>
                      <a
                        href={(selectedCompanyFull.google_maps_link || selectedCompanyFull.company_address || '').startsWith('http')
                          ? (selectedCompanyFull.google_maps_link || selectedCompanyFull.company_address)
                          : `https://${selectedCompanyFull.google_maps_link || selectedCompanyFull.company_address}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-semibold rounded-md shrink-0 inline-flex items-center gap-1"
                      >
                        <MapPin className="h-3 w-3" />
                        <span>View on Map</span>
                        <ExternalLink className="h-3 w-3 ml-0.5" />
                      </a>
                    </div>
                  ) : (
                    <p className="text-[#64748B] mt-0.5">No Google Maps link provided.</p>
                  )}
                </div>

                {/* 10. Job Description (JD) Section */}
                <div className="sm:col-span-2 p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                  <span className="text-[#64748B] font-medium block text-xs">10. Job Description (JD) Document</span>
                  {selectedCompanyFull.has_jd || selectedCompanyFull.jd_file_path ? (
                    <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white border border-blue-200 rounded-lg shadow-sm">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="p-2 bg-blue-50 text-[#3B82F6] rounded-md shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="truncate">
                          <p className="font-bold text-xs text-[#1E293B] truncate">
                            {selectedCompanyFull.jd_file_name || 'Company_Job_Description.pdf'}
                          </p>
                          <p className="text-[10px] text-emerald-700 font-semibold">Official Recruiter JD Attached</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* View JD */}
                        <a
                          href={api.getCompanyJDUrl(selectedCompanyFull.id, false)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-[#EFF6FF] hover:bg-blue-100 text-[#3B82F6] text-xs font-semibold border border-blue-200 rounded-md transition inline-flex items-center gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View JD</span>
                        </a>

                        {/* Download JD */}
                        <a
                          href={api.getCompanyJDUrl(selectedCompanyFull.id, true)}
                          download
                          className="px-3 py-1.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-semibold rounded-md transition inline-flex items-center gap-1 shadow-sm"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Download</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-[#64748B] py-1">
                      <FileText className="h-4 w-4 text-[#94A3B8]" />
                      <span className="font-medium">JD Not Available</span>
                    </div>
                  )}
                </div>

                {/* 11. Student Campus Drive Registration System */}
                <div className="sm:col-span-2 p-3.5 bg-gradient-to-r from-blue-50/60 to-indigo-50/40 border border-blue-200 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-100 text-[#3B82F6] rounded-md">
                        <Link2 className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-[#1E293B]">11. Student Registration Link</span>
                        {selectedCompanyFull.approval_status === 'APPROVED' ? (
                          <p className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                            <CheckCircle2 className="h-3 w-3" /> Registration Link ACTIVE
                          </p>
                        ) : (
                          <p className="text-[10px] text-amber-700 font-semibold flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" /> Inactive until approved
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-white text-[#3B82F6] border border-blue-200 rounded-lg text-xs font-bold shadow-xs">
                        Registered: {selectedCompanyFull.registered_students_count || 0}
                      </span>
                    </div>
                  </div>

                  {selectedCompanyFull.approval_status === 'APPROVED' && selectedCompanyFull.registration_token ? (
                    <>
                      <div className="bg-white p-2.5 rounded-lg border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-xs font-mono text-[#64748B] truncate max-w-sm">
                          {`${window.location.origin}/company/register/${selectedCompanyFull.registration_token}`}
                        </span>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleCopyRegistrationLink(selectedCompanyFull.registration_token)}
                            className="px-3 py-1.5 bg-[#EFF6FF] hover:bg-blue-100 text-[#3B82F6] text-xs font-semibold rounded-lg border border-blue-200 transition inline-flex items-center gap-1.5"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            <span>{copyFeedback || 'Copy Link'}</span>
                          </button>

                          <button
                            onClick={() => handleOpenRegistrationForm(selectedCompanyFull.registration_token)}
                            className="px-3 py-1.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-semibold rounded-lg transition inline-flex items-center gap-1.5 shadow-sm"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>Open Form</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => {
                            const comp = selectedCompanyFull;
                            setSelectedCompanyFull(null);
                            handleOpenRegistrations(comp);
                          }}
                          className="px-3.5 py-1.5 bg-white hover:bg-blue-50 text-[#1E293B] hover:text-[#3B82F6] text-xs font-bold rounded-lg border border-[#E2E8F0] hover:border-blue-200 transition inline-flex items-center gap-1.5"
                        >
                          <Users className="h-3.5 w-3.5 text-[#3B82F6]" />
                          <span>View Registered Students ({selectedCompanyFull.registered_students_count || 0})</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2 font-medium">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>Registration unavailable until company approval.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex justify-end">
              <button
                onClick={() => setSelectedCompanyFull(null)}
                className="px-4 py-2 bg-[#1E293B] hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW REGISTERED STUDENTS MODAL */}
      {selectedCompanyForRegistrations && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-5xl w-full p-6 border border-[#E2E8F0] max-h-[92vh] flex flex-col space-y-4">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1E293B]">
                    Registered Students — {selectedCompanyForRegistrations.name}
                  </h3>
                  <p className="text-xs text-[#64748B] flex items-center gap-2 mt-0.5">
                    <span>{selectedCompanyForRegistrations.job_title || 'Software Engineer'}</span>
                    <span>&bull;</span>
                    <span className="font-semibold text-emerald-700">{selectedCompanyForRegistrations.ctc_lpa} LPA</span>
                    <span>&bull;</span>
                    <span>{selectedCompanyForRegistrations.location || 'Campus'}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold">
                  Total Registered: {registrations.length}
                </span>

                {selectedCompanyForRegistrations.registration_token && (
                  <button
                    onClick={() => handleCopyRegistrationLink(selectedCompanyForRegistrations.registration_token)}
                    className="px-3 py-1.5 bg-white hover:bg-blue-50 text-[#3B82F6] border border-blue-200 rounded-xl text-xs font-semibold transition inline-flex items-center gap-1"
                    title="Copy Registration Link"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>{copyFeedback || 'Copy Form Link'}</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedCompanyForRegistrations(null)}
                  className="p-1.5 text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC] rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Search & Filters */}
            <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0] space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 text-xs">
                {/* Search */}
                <div className="lg:col-span-2 relative">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-[#64748B]" />
                  <input
                    type="text"
                    placeholder="Search Reg No, Name, Dept..."
                    value={regSearch}
                    onChange={(e) => setRegSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs"
                  />
                </div>

                {/* Dept Filter */}
                <div>
                  <select
                    value={regDept}
                    onChange={(e) => setRegDept(e.target.value)}
                    className="w-full p-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs"
                  >
                    <option value="">All Depts</option>
                    <option value="CSE">CSE</option>
                    <option value="IT">IT</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                    <option value="AIDS">AI&amp;DS</option>
                  </select>
                </div>

                {/* Gender */}
                <div>
                  <select
                    value={regGender}
                    onChange={(e) => setRegGender(e.target.value)}
                    className="w-full p-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs"
                  >
                    <option value="">All Genders</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                {/* Registration Status */}
                <div>
                  <select
                    value={regStatus}
                    onChange={(e) => setRegStatus(e.target.value)}
                    className="w-full p-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold"
                  >
                    <option value="">All Reg Status</option>
                    <option value="REGISTERED">Registered</option>
                    <option value="WITHDRAWN">Withdrawn</option>
                  </select>
                </div>

                {/* Placement Status */}
                <div>
                  <select
                    value={regPlacementStatus}
                    onChange={(e) => setRegPlacementStatus(e.target.value)}
                    className="w-full p-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold"
                  >
                    <option value="">All Placement Status</option>
                    <option value="PLACED">Placed</option>
                    <option value="YET_TO_BE_PLACED">Yet to be Placed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Registrations Table */}
            <div className="flex-1 overflow-y-auto border border-[#E2E8F0] rounded-xl">
              {loadingRegistrations ? (
                <div className="py-16 text-center text-xs text-[#64748B]">
                  <div className="animate-spin h-5 w-5 border-2 border-[#3B82F6] border-t-transparent rounded-full mx-auto mb-2"></div>
                  Loading registered candidates...
                </div>
              ) : processedRegistrations.length === 0 ? (
                <div className="py-16 text-center text-[#64748B]">
                  <GraduationCap className="h-8 w-8 text-[#94A3B8] mx-auto mb-2" />
                  <p className="font-semibold text-xs text-[#1E293B]">No registered students found</p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">Share the registration link with students to collect applications.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#EFF6FF] text-[#1E293B] font-semibold border-b border-[#E2E8F0] sticky top-0">
                      <th className="py-2.5 px-3 text-center w-12">S.No</th>
                      <th className="py-2.5 px-3">Reg No</th>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">Dept</th>
                      <th className="py-2.5 px-3">Gender</th>
                      <th className="py-2.5 px-3">Student Type</th>
                      <th className="py-2.5 px-3">Email &amp; Mobile</th>
                      <th className="py-2.5 px-3">Registration Date</th>
                      <th className="py-2.5 px-3 text-center">Reg Status</th>
                      <th className="py-2.5 px-3 text-center">Placement Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] text-[#1E293B]">
                    {processedRegistrations.map((reg, idx) => {
                      const isPlaced = (reg.placement_status || '').toUpperCase() === 'PLACED';

                      return (
                        <tr key={reg.id} className="hover:bg-[#EFF6FF]/60 transition">
                          <td className="py-2.5 px-3 text-center text-[#64748B] font-medium">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#3B82F6]">
                            {reg.student_reg_no}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-[#1E293B]">
                            {reg.student_name}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 bg-[#F8FAFC] text-[#64748B] rounded border border-[#E2E8F0] font-medium">
                              {reg.student_department}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-[#64748B]">
                            {reg.student_gender}
                          </td>
                          <td className="py-2.5 px-3 text-[#64748B]">
                            {reg.student_type || 'Day Scholar'}
                          </td>
                          <td className="py-2.5 px-3 text-[#64748B]">
                            <div>{reg.registered_email || '-'}</div>
                            <div className="text-[11px] text-[#94A3B8]">{reg.registered_mobile || '-'}</div>
                          </td>
                          <td className="py-2.5 px-3 text-[#64748B] text-[11px] whitespace-nowrap">
                            {reg.registered_at || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${
                              reg.registration_status === 'REGISTERED' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}>
                              {reg.registration_status === 'REGISTERED' ? 'Registered' : 'Withdrawn'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {isPlaced ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 inline-flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Placed
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-300 inline-flex items-center gap-1">
                                <Clock className="h-3 w-3 text-amber-500" /> Yet to be Placed
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="pt-2 flex justify-between items-center text-xs text-[#64748B]">
              <span>Showing {processedRegistrations.length} of {registrations.length} registered candidates</span>
              <button
                onClick={() => setSelectedCompanyForRegistrations(null)}
                className="px-4 py-2 bg-[#1E293B] hover:bg-slate-800 text-white font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE STATUS MODAL */}
      {editingCompany && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 border border-[#E2E8F0]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h3 className="font-bold text-[#1E293B] text-sm">
                Update Relationship: {editingCompany.company_name || editingCompany.name}
              </h3>
              <button onClick={() => setEditingCompany(null)} className="p-1 text-[#64748B] hover:text-[#1E293B]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {statusEditError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium">
                {statusEditError}
              </div>
            )}

            <form onSubmit={handleUpdateStatus} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#1E293B] mb-1">Select Relationship Status</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as CompanyStatus)}
                  className="w-full p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#3B82F6]"
                >
                  <option value="Cold">Cold</option>
                  <option value="Warm">Warm</option>
                  <option value="Hot">Hot</option>
                  <option value="Drive Completed">Drive Completed</option>
                </select>
              </div>

              {newStatus === 'Drive Completed' && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-300 rounded-lg">
                  <label className="block font-bold text-emerald-900 mb-1">
                    No. of Placed Students * (Max: {editingCompany.no_of_hirings ?? editingCompany.employee_count ?? 0})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={editingCompany.no_of_hirings ?? editingCompany.employee_count ?? 0}
                    required
                    value={editPlacedStudents}
                    onChange={e => setEditPlacedStudents(parseInt(e.target.value) || 0)}
                    className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-emerald-900"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setEditingCompany(null)}
                  className="px-3.5 py-1.5 bg-white text-[#64748B] font-semibold rounded-lg hover:bg-[#F8FAFC] border border-[#E2E8F0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-1.5 bg-[#3B82F6] text-white font-bold rounded-lg hover:bg-[#2563EB] disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Save Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT COMPANY & JOB DESCRIPTION (JD) MODAL */}
      {fullEditModalCompany && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 border border-[#E2E8F0] max-h-[90vh] overflow-y-auto space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#EFF6FF] text-[#3B82F6] rounded-xl border border-blue-100">
                  <Edit className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1E293B]">
                    Edit Company Details — {fullEditModalCompany.company_name || fullEditModalCompany.name}
                  </h3>
                  <p className="text-xs text-[#64748B]">Update recruiter information and attach Job Description (JD) PDF</p>
                </div>
              </div>
              <button
                onClick={() => setFullEditModalCompany(null)}
                className="p-1.5 text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC] rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error / Success Notifications */}
            {fullEditError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{fullEditError}</span>
              </div>
            )}
            {fullEditSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{fullEditSuccess}</span>
              </div>
            )}

            <form onSubmit={handleFullEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Company Name */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#1E293B] mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={fullEditForm.company_name}
                    onChange={e => setFullEditForm({ ...fullEditForm, company_name: e.target.value })}
                    className="w-full p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#3B82F6]"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block font-semibold text-[#1E293B] mb-1">Location *</label>
                  <input
                    type="text"
                    required
                    value={fullEditForm.location}
                    onChange={e => setFullEditForm({ ...fullEditForm, location: e.target.value })}
                    className="w-full p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs focus:ring-2 focus:ring-[#3B82F6]"
                  />
                </div>

                {/* Website */}
                <div>
                  <label className="block font-semibold text-[#1E293B] mb-1">Website URL</label>
                  <input
                    type="text"
                    value={fullEditForm.website}
                    onChange={e => setFullEditForm({ ...fullEditForm, website: e.target.value })}
                    placeholder="https://company.com"
                    className="w-full p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs focus:ring-2 focus:ring-[#3B82F6]"
                  />
                </div>

                {/* Contact Phone */}
                <div>
                  <label className="block font-semibold text-[#1E293B] mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={fullEditForm.contact_person_number}
                    onChange={e => setFullEditForm({ ...fullEditForm, contact_person_number: e.target.value })}
                    placeholder="e.g. +91 9876543210"
                    className="w-full p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs focus:ring-2 focus:ring-[#3B82F6]"
                  />
                </div>

                {/* Contact Email */}
                <div>
                  <label className="block font-semibold text-[#1E293B] mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={fullEditForm.contact_person_email}
                    onChange={e => setFullEditForm({ ...fullEditForm, contact_person_email: e.target.value })}
                    placeholder="hr@company.com"
                    className="w-full p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs focus:ring-2 focus:ring-[#3B82F6]"
                  />
                </div>

                {/* No. of Hirings */}
                <div>
                  <label className="block font-semibold text-[#1E293B] mb-1">No. of Hirings *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={fullEditForm.no_of_hirings}
                    onChange={e => setFullEditForm({ ...fullEditForm, no_of_hirings: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#3B82F6]"
                  />
                </div>

                {/* CTC (LPA) */}
                <div>
                  <label className="block font-semibold text-[#1E293B] mb-1">CTC (LPA) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={fullEditForm.ctc_lpa}
                    onChange={e => setFullEditForm({ ...fullEditForm, ctc_lpa: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#3B82F6]"
                  />
                </div>

                {/* Relationship Status */}
                <div>
                  <label className="block font-semibold text-[#1E293B] mb-1">Relationship Status *</label>
                  <select
                    value={fullEditForm.status}
                    onChange={e => setFullEditForm({ ...fullEditForm, status: e.target.value as CompanyStatus })}
                    className="w-full p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#3B82F6]"
                  >
                    <option value="Cold">Cold</option>
                    <option value="Warm">Warm</option>
                    <option value="Hot">Hot</option>
                    <option value="Drive Completed">Drive Completed</option>
                  </select>
                </div>

                {/* Placed Candidates (Drive Completed only) */}
                {fullEditForm.status === 'Drive Completed' && (
                  <div className="p-2.5 bg-emerald-50/80 border border-emerald-300 rounded-lg">
                    <label className="block font-bold text-emerald-900 mb-1">
                      No. of Placed Students * (Max: {fullEditForm.no_of_hirings})
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={fullEditForm.no_of_hirings}
                      required
                      value={fullEditForm.placed_students}
                      onChange={e => setFullEditForm({ ...fullEditForm, placed_students: parseInt(e.target.value) || 0 })}
                      className="w-full p-1.5 bg-white border border-emerald-300 rounded-md text-xs font-bold text-emerald-900"
                    />
                  </div>
                )}

                {/* Google Maps Link */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#1E293B] mb-1">Google Maps Location Link *</label>
                  <input
                    type="text"
                    required
                    value={fullEditForm.google_maps_link}
                    onChange={e => setFullEditForm({ ...fullEditForm, google_maps_link: e.target.value })}
                    placeholder="https://maps.google.com/..."
                    className="w-full p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs focus:ring-2 focus:ring-[#3B82F6]"
                  />
                </div>

                {/* JOB DESCRIPTION (JD) SECTION */}
                <div className="sm:col-span-2 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-[#1E293B] flex items-center gap-1.5 text-xs">
                      <FileText className="h-4 w-4 text-[#3B82F6]" />
                      Job Description (JD)
                    </label>
                    <span className="text-[11px] text-[#64748B] font-medium">PDF Only &bull; Max 10 MB</span>
                  </div>

                  {/* Hidden PDF file input */}
                  <input
                    type="file"
                    ref={jdFileInputRef}
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
                          setFullEditError('Please upload a PDF file.');
                          if (jdFileInputRef.current) jdFileInputRef.current.value = '';
                          return;
                        }
                        if (file.size > 10 * 1024 * 1024) {
                          setFullEditError('File size must be less than 10 MB.');
                          if (jdFileInputRef.current) jdFileInputRef.current.value = '';
                          return;
                        }
                        setFullEditError(null);
                        setEditJdFile(file);
                        setRemoveJd(false);
                      }
                    }}
                  />

                  {/* Case A: Newly selected JD file */}
                  {editJdFile ? (
                    <div className="flex items-center justify-between p-3 bg-blue-50/80 border border-blue-200 rounded-xl">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="p-2 bg-blue-100 text-[#3B82F6] rounded-lg shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="truncate">
                          <p className="font-bold text-[#1E293B] text-xs truncate">📄 {editJdFile.name}</p>
                          <p className="text-[10px] text-[#64748B]">{(editJdFile.size / (1024 * 1024)).toFixed(2)} MB &bull; Ready to save</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => jdFileInputRef.current?.click()}
                          className="px-2.5 py-1 bg-white hover:bg-blue-100 text-[#3B82F6] text-xs font-semibold border border-blue-200 rounded-lg transition"
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditJdFile(null);
                            if (jdFileInputRef.current) jdFileInputRef.current.value = '';
                          }}
                          className="px-2 py-1 text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-semibold rounded-lg transition"
                          title="Remove selected file"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : existingJdName && !removeJd ? (
                    /* Case B: Existing JD file from previous save */
                    <div className="flex items-center justify-between p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="truncate">
                          <p className="font-bold text-emerald-950 text-xs truncate">📄 {existingJdName}</p>
                          <p className="text-[10px] text-emerald-700 font-medium">Currently attached JD PDF</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={api.getCompanyJDUrl(fullEditModalCompany.id, false)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-300 rounded-lg transition inline-flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>View JD</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => jdFileInputRef.current?.click()}
                          className="px-2.5 py-1 bg-white hover:bg-blue-50 text-[#3B82F6] text-xs font-semibold border border-blue-200 rounded-lg transition"
                        >
                          Replace JD
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRemoveJd(true);
                            setEditJdFile(null);
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-600 text-xs font-semibold border border-rose-200 rounded-lg transition"
                          title="Remove JD from company"
                        >
                          Remove JD
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Case C: No JD / Removed -> Upload button */
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white border border-dashed border-[#CBD5E1] rounded-xl">
                      <div className="text-xs text-[#64748B]">
                        {removeJd ? (
                          <span className="text-amber-700 font-semibold">JD will be removed upon saving.</span>
                        ) : (
                          <span>Job Description: No JD uploaded</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => jdFileInputRef.current?.click()}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold rounded-xl transition shrink-0 shadow-sm"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Upload JD PDF</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 flex justify-end gap-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setFullEditModalCompany(null)}
                  className="px-4 py-2 bg-white text-[#64748B] font-semibold rounded-xl hover:bg-[#F8FAFC] border border-[#E2E8F0] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={fullEditSubmitting}
                  className="px-5 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold rounded-xl disabled:opacity-50 transition shadow-sm"
                >
                  {fullEditSubmitting ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTRATION LINK MODAL */}
      {registrationModalCompany && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-[#E2E8F0] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                  <Link2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1E293B]">
                    Student Registration — {registrationModalCompany.name || registrationModalCompany.company_name}
                  </h3>
                  <p className="text-xs text-[#64748B]">Official campus drive candidate registration link</p>
                </div>
              </div>
              <button
                onClick={() => setRegistrationModalCompany(null)}
                className="p-1 text-[#64748B] hover:text-[#1E293B]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between">
                <span className="text-[#64748B] font-medium">Drive Role:</span>
                <span className="font-bold text-[#1E293B]">
                  {registrationModalCompany.job_title || registrationModalCompany.industry || 'Software Engineer'} ({registrationModalCompany.ctc_lpa ? `${registrationModalCompany.ctc_lpa} LPA` : 'Standard Package'})
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
                  Registration Form Link:
                </label>
                <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-[#1E293B] break-all">
                  <span className="truncate">
                    {`${window.location.origin}/company/register/${registrationModalCompany.registration_token}`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleCopyRegistrationLink(registrationModalCompany.registration_token)}
                  className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-[#3B82F6] font-bold text-xs rounded-xl border border-blue-200 transition flex items-center justify-center gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>{copyFeedback || 'Copy Link'}</span>
                </button>

                <button
                  onClick={() => handleOpenRegistrationForm(registrationModalCompany.registration_token)}
                  className="flex-1 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Open Form</span>
                </button>
              </div>

              <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-indigo-950 block">Registered Students</span>
                  <span className="text-[11px] text-indigo-700">Total candidates applied through this link</span>
                </div>
                <span className="text-lg font-black text-indigo-700">
                  {registrationModalCompany.registered_students_count ?? 0}
                </span>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    const comp = registrationModalCompany;
                    setRegistrationModalCompany(null);
                    handleOpenRegistrations(comp);
                  }}
                  className="w-full py-2.5 bg-[#1E293B] hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <Users className="h-4 w-4 text-indigo-400" />
                  <span>View Registered Students ({registrationModalCompany.registered_students_count ?? 0})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PLACED STUDENTS MODAL */}
      {placedModalCompany && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPlacedModalCompany(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-[#E2E8F0] space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1E293B] text-base">Placed Students</h3>
                  <p className="text-xs text-[#64748B]">
                    {placedModalCompany.name} &bull; {placedModalCompany.ctc_lpa ? `${placedModalCompany.ctc_lpa} LPA` : (placedModalCompany.package_offered || 'N/A')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPlacedModalCompany(null)}
                className="p-1 text-[#64748B] hover:text-[#1E293B] rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {placedStudentsError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{placedStudentsError}</span>
              </div>
            )}

            {/* Total Placed Summary Banner */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-950">
                  Total Placed: {placedStudentsList.length}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                Capacity: {placedStudentsList.length} / {placedModalCompany.no_of_hirings ?? placedModalCompany.employee_count ?? 0}
              </span>
            </div>

            {loadingPlacedStudents ? (
              <div className="py-12 text-center text-xs text-[#64748B]">
                <div className="animate-spin h-5 w-5 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                Loading verified placement records from database...
              </div>
            ) : placedStudentsList.length === 0 ? (
              <div className="py-10 text-center text-[#64748B] space-y-1.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] p-4">
                <GraduationCap className="h-8 w-8 text-[#94A3B8] mx-auto mb-1" />
                <p className="font-bold text-xs text-[#1E293B]">No students placed yet</p>
                <p className="text-[11px] text-[#64748B]">
                  Candidates placed into {placedModalCompany.name} via the placement workflow will automatically appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {placedStudentsList.map((student, sIdx) => (
                  <div
                    key={student.id || sIdx}
                    className="p-3 bg-[#F8FAFC] hover:bg-[#EFF6FF]/60 border border-[#E2E8F0] rounded-xl transition flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="font-bold text-[#1E293B] truncate">{student.name}</p>
                        <p className="font-mono text-[11px] font-semibold text-[#3B82F6]">{student.reg_no}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="px-2 py-0.5 bg-white text-[#1E293B] font-bold rounded-md border border-[#E2E8F0] text-[11px]">
                        {student.department}
                      </span>
                      {student.placement_date && (
                        <p className="text-[10px] text-[#64748B] mt-1">{student.placement_date}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-[#E2E8F0] flex justify-end">
              <button
                type="button"
                onClick={() => setPlacedModalCompany(null)}
                className="px-4 py-2 bg-[#1E293B] hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
