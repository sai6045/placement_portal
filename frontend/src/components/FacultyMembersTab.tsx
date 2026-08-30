import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Faculty, Company, CompanyStatus, ApprovalStatus, User, CompanyRegistration } from '../types';
import { api } from '../api';
import { Plus, UserCheck, Building2, Mail, Phone, MapPin, Globe, Edit, Trash2, X, Check, AlertCircle, CheckCircle, CheckCircle2, XCircle, Clock, ExternalLink, Upload, FileSpreadsheet, FileText, Download, Link2, Copy, Users, GraduationCap, Search } from 'lucide-react';

interface FacultyMembersTabProps {
  currentUser: User;
  onCompanyAdded?: () => void;
}

export const FacultyMembersTab: React.FC<FacultyMembersTabProps> = ({ currentUser, onCompanyAdded }) => {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  
  // Filter for Admin Approval Queue
  const [selectedApprovalFilter, setSelectedApprovalFilter] = useState<string>('ALL');

  // Registration Link Modal & Registered Students Modal states
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

  // Export Template & Import states
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Job Description (JD) states
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [existingJdName, setExistingJdName] = useState<string | null>(null);
  const [removeJd, setRemoveJd] = useState<boolean>(false);
  const jdFileInputRef = useRef<HTMLInputElement>(null);

  // Admin action states
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Delete Confirmation State
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // The Company Form State
  const initialCompanyForm = {
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
  };

  const [companyForm, setCompanyForm] = useState(initialCompanyForm);

  const fetchFaculties = () => {
    setLoading(true);
    api.getFaculties()
      .then(res => setFaculties(res))
      .catch(err => console.error('Failed to load faculties:', err))
      .finally(() => setLoading(false));
  };

  const fetchCompanies = () => {
    setLoadingCompanies(true);
    api.getCompanies()
      .then(res => setCompanies(res))
      .catch(err => console.error('Failed to load companies:', err))
      .finally(() => setLoadingCompanies(false));
  };

  useEffect(() => {
    fetchFaculties();
    fetchCompanies();
  }, []);

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

  // 1. Export Template Handler (Blank Excel with headers only)
  const handleExportTemplate = async () => {
    setDownloadingTemplate(true);
    setImportMessage(null);
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
      setImportMessage({
        type: 'error',
        text: 'Failed to download company template. Please try again.'
      });
      setTimeout(() => setImportMessage(null), 4000);
    } finally {
      setDownloadingTemplate(false);
    }
  };

  // 2. Import Excel Handler
  const handleImportButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportMessage(null);

    try {
      const res = await api.importCompaniesExcel(file);
      setImportMessage({
        type: 'success',
        text: res.message || 'Companies imported successfully and submitted for admin approval.'
      });
      fetchCompanies();
      if (onCompanyAdded) onCompanyAdded();
      setTimeout(() => setImportMessage(null), 5000);
    } catch (err: any) {
      console.error('Import failed:', err);
      const errMsg = err.response?.data?.error || err.response?.data?.details || 'Failed to import Excel file. Please verify columns and try again.';
      setImportMessage({
        type: 'error',
        text: errMsg
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setCompanyForm(initialCompanyForm);
    setJdFile(null);
    setExistingJdName(null);
    setRemoveJd(false);
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (comp: Company) => {
    setIsEditing(true);
    setEditingId(comp.id);
    setCompanyForm({
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
    setJdFile(null);
    setExistingJdName(comp.jd_file_name || (comp.jd_file_path ? 'Job_Description.pdf' : null));
    setRemoveJd(false);
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    // Basic checks
    if (!companyForm.company_name.trim()) {
      setFormError('Company Name is required.');
      setFormSubmitting(false);
      return;
    }
    if (!companyForm.location.trim()) {
      setFormError('Location is required.');
      setFormSubmitting(false);
      return;
    }
    if (!companyForm.google_maps_link.trim()) {
      setFormError('Google Maps Location Link is required.');
      setFormSubmitting(false);
      return;
    }

    // Hirings validation
    if (companyForm.no_of_hirings < 0) {
      setFormError('Number of hirings cannot be negative.');
      setFormSubmitting(false);
      return;
    }

    // CTC validation
    if (!companyForm.ctc_lpa || companyForm.ctc_lpa <= 0) {
      setFormError('CTC (LPA) must be greater than 0.');
      setFormSubmitting(false);
      return;
    }

    // Placed students validation (Drive Completed only)
    if (companyForm.status === 'Drive Completed') {
      if (companyForm.placed_students < 0) {
        setFormError('Number of placed students cannot be negative.');
        setFormSubmitting(false);
        return;
      }
      if (companyForm.placed_students > companyForm.no_of_hirings) {
        setFormError('Placed students cannot exceed the number of hirings.');
        setFormSubmitting(false);
        return;
      }
    }

    try {
      const formData = new FormData();
      formData.append('name', companyForm.company_name);
      formData.append('company_name', companyForm.company_name);
      formData.append('location', companyForm.location);
      formData.append('website', companyForm.website);
      formData.append('contact_person_number', companyForm.contact_person_number);
      formData.append('contact_phone', companyForm.contact_person_number);
      formData.append('contact_person_email', companyForm.contact_person_email);
      formData.append('contact_email', companyForm.contact_person_email);
      formData.append('no_of_hirings', String(companyForm.no_of_hirings));
      formData.append('ctc_lpa', String(companyForm.ctc_lpa));
      formData.append('placed_students', String(companyForm.status === 'Drive Completed' ? companyForm.placed_students : 0));
      formData.append('google_maps_link', companyForm.google_maps_link);
      formData.append('company_address', companyForm.google_maps_link);
      formData.append('status', companyForm.status);

      if (jdFile) {
        formData.append('jd_file', jdFile);
      }
      if (removeJd) {
        formData.append('remove_jd', 'true');
      }

      if (isEditing && editingId) {
        await api.updateCompany(editingId, formData);
        setFormSuccess('Company updated successfully!');
      } else {
        formData.append('created_by_user', `${currentUser.name} (${currentUser.role})`);
        const res = await api.addCompany(formData);
        setFormSuccess(res.message || 'Company submitted for admin approval.');
      }

      setTimeout(() => {
        setIsModalOpen(false);
        setFormSuccess(null);
        setCompanyForm(initialCompanyForm);
        setJdFile(null);
        setExistingJdName(null);
        setRemoveJd(false);
        fetchCompanies();
        if (onCompanyAdded) onCompanyAdded();
      }, 1200);
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.response?.data?.details || 'Unable to save company. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Admin exclusive approval handlers
  const handleApprove = async (companyId: number) => {
    setProcessingId(companyId);
    setActionMessage(null);
    try {
      const res = await api.approveCompany(companyId);
      setActionMessage({ type: 'success', text: res.message });
      fetchCompanies();
      if (onCompanyAdded) onCompanyAdded();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to approve company.'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (companyId: number) => {
    setProcessingId(companyId);
    setActionMessage(null);
    try {
      const res = await api.rejectCompany(companyId);
      setActionMessage({ type: 'success', text: res.message });
      fetchCompanies();
      if (onCompanyAdded) onCompanyAdded();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to reject company.'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCompany) return;
    setIsDeleting(true);
    try {
      await api.deleteCompany(deletingCompany.id);
      setDeletingCompany(null);
      fetchCompanies();
      if (onCompanyAdded) onCompanyAdded();
    } catch (err: any) {
      alert(err.response?.data?.error || err.response?.data?.details || 'Unable to delete company.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: CompanyStatus) => {
    switch (status) {
      case 'Cold':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'Warm':
        return 'bg-amber-50 text-amber-700 border-amber-300';
      case 'Hot':
        return 'bg-red-50 text-red-700 border-red-300';
      case 'Drive Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getApprovalBadge = (appStatus?: ApprovalStatus) => {
    const status = appStatus || 'PENDING';
    switch (status) {
      case 'APPROVED':
        return {
          style: 'bg-emerald-50 text-emerald-700 border-emerald-300',
          icon: CheckCircle,
          label: 'APPROVED'
        };
      case 'REJECTED':
        return {
          style: 'bg-rose-50 text-rose-700 border-rose-300',
          icon: XCircle,
          label: 'REJECTED'
        };
      case 'PENDING':
      default:
        return {
          style: 'bg-amber-50 text-amber-700 border-amber-300',
          icon: Clock,
          label: 'PENDING'
        };
    }
  };

  const filteredCompanies = companies.filter(comp => {
    if (selectedApprovalFilter === 'ALL') return true;
    return (comp.approval_status || 'PENDING') === selectedApprovalFilter;
  });

  const pendingCount = companies.filter(c => (c.approval_status || 'PENDING') === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Hidden File Input for Excel Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".xlsx, .xls"
        className="hidden"
      />

      {/* Top Header & Horizontal Action Area: [ Export Template ] [ Import ] [ + Add Company ] */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-[#1E293B] flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#3B82F6]" />
            Faculty Members &amp; Company Management
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Log hiring targets, CTC packages, and drive conclusions &bull; Enter into Admin Approval Workflow
          </p>
        </div>

        {/* TOP-RIGHT ACTIONS: [ Export Template ]  [ Import ]  [ + Add Company ] */}
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

          {/* Button 2: Import (Secondary / Outline with Upload Icon) */}
          <button
            onClick={handleImportButtonClick}
            disabled={importing}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#1E293B] bg-white hover:bg-[#EFF6FF] border border-[#E2E8F0] hover:border-[#3B82F6] rounded-lg transition shadow-sm disabled:opacity-50"
            title="Import company records from Excel (.xlsx)"
          >
            <Upload className="h-3.5 w-3.5 text-[#3B82F6]" />
            <span>{importing ? 'Importing...' : 'Import'}</span>
          </button>

          {/* Button 3: + Add Company (Primary Blue) */}
          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs rounded-lg shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            <span>+ Add Company</span>
          </button>
        </div>
      </div>

      {/* Import / Export Alert Message */}
      {importMessage && (
        <div className={`p-3.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
          importMessage.type === 'error'
            ? 'bg-rose-50 text-rose-800 border border-rose-200'
            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
        }`}>
          {importMessage.type === 'error' ? (
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
          )}
          <span>{importMessage.text}</span>
        </div>
      )}

      {/* Admin Toast Message */}
      {actionMessage && (
        <div className={`p-3.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
          actionMessage.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {actionMessage.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Section 1: Company Management List */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F8FAFC]">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#3B82F6]" />
            <h3 className="font-bold text-[#1E293B] text-xs">
              Recruiter Company Directory
            </h3>
            {currentUser.role === 'ADMIN' && pendingCount > 0 && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full border border-amber-300">
                {pendingCount} Pending Approval
              </span>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 text-[11px] font-medium">
            <span className="text-[#64748B] mr-1 hidden sm:inline">Filter:</span>
            <button
              onClick={() => setSelectedApprovalFilter('ALL')}
              className={`px-2.5 py-1 rounded-md transition ${
                selectedApprovalFilter === 'ALL'
                  ? 'bg-[#3B82F6] text-white font-bold'
                  : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:bg-[#F8FAFC]'
              }`}
            >
              All ({companies.length})
            </button>
            <button
              onClick={() => setSelectedApprovalFilter('PENDING')}
              className={`px-2.5 py-1 rounded-md transition ${
                selectedApprovalFilter === 'PENDING'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-white text-amber-700 border border-[#E2E8F0] hover:bg-amber-50'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setSelectedApprovalFilter('APPROVED')}
              className={`px-2.5 py-1 rounded-md transition ${
                selectedApprovalFilter === 'APPROVED'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-white text-emerald-700 border border-[#E2E8F0] hover:bg-emerald-50'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setSelectedApprovalFilter('REJECTED')}
              className={`px-2.5 py-1 rounded-md transition ${
                selectedApprovalFilter === 'REJECTED'
                  ? 'bg-rose-600 text-white font-bold'
                  : 'bg-white text-rose-700 border border-[#E2E8F0] hover:bg-rose-50'
              }`}
            >
              Rejected
            </button>
          </div>
        </div>

        {loadingCompanies ? (
          <div className="py-16 text-center text-[#64748B] text-xs">
            <div className="animate-spin h-5 w-5 border-2 border-[#3B82F6] border-t-transparent rounded-full mx-auto mb-2"></div>
            Loading company records...
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="py-16 text-center text-[#64748B]">
            <Building2 className="h-8 w-8 text-[#94A3B8] mx-auto mb-2" />
            <p className="font-semibold text-xs text-[#1E293B]">
              {selectedApprovalFilter === 'ALL' ? 'No companies added yet.' : `No companies with approval status "${selectedApprovalFilter}".`}
            </p>
            <p className="text-[11px] text-[#64748B] mt-0.5 mb-3">Click "+ Add Company" or "Import" from Excel to register recruiters.</p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={handleImportButtonClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#EFF6FF] border border-[#E2E8F0] text-[#1E293B] text-xs font-semibold rounded-lg transition"
              >
                <Upload className="h-3.5 w-3.5 text-[#3B82F6]" />
                <span>Import Excel</span>
              </button>
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-semibold rounded-lg transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Add Company</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#EFF6FF] text-[#1E293B] font-semibold border-b border-[#E2E8F0]">
                  <th className="py-3 px-4">Company Name</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4 text-center">No. of Hirings</th>
                  <th className="py-3 px-4 text-center">CTC (LPA)</th>
                  <th className="py-3 px-4 text-center">Relationship Status</th>
                  <th className="py-3 px-4 text-center">Placed Students</th>
                  <th className="py-3 px-4 text-center">Approval Status</th>
                  <th className="py-3 px-4 text-center w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#1E293B]">
                {filteredCompanies.map((comp) => {
                  const appBadge = getApprovalBadge(comp.approval_status);
                  const AppIcon = appBadge.icon;
                  const isPending = (comp.approval_status || 'PENDING') === 'PENDING';
                  const isBusy = processingId === comp.id;
                  const mapsUrl = comp.google_maps_link || comp.company_address || '';
                  const isDriveCompleted = comp.status === 'Drive Completed';

                  return (
                    <tr key={comp.id} className="hover:bg-[#EFF6FF]/60 transition">
                      {/* Company Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#1E293B]">{comp.company_name || comp.name}</div>
                        {comp.website && (
                          <a
                            href={comp.website.startsWith('http') ? comp.website : `https://${comp.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-[#3B82F6] hover:underline inline-flex items-center gap-1 mt-0.5"
                          >
                            <Globe className="h-3 w-3" />
                            <span>{comp.website}</span>
                          </a>
                        )}
                      </td>

                      {/* Location & "View on Map" */}
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

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 text-[11px]">
                          {(comp.contact_person_number || comp.contact_phone) && (
                            <div className="flex items-center gap-1 text-[#1E293B] font-medium">
                              <Phone className="h-3 w-3 text-[#64748B]" />
                              <span>{comp.contact_person_number || comp.contact_phone}</span>
                            </div>
                          )}
                          {(comp.contact_person_email || comp.contact_email) && (
                            <div className="flex items-center gap-1 text-[#64748B]">
                              <Mail className="h-3 w-3 text-[#64748B]" />
                              <span>{comp.contact_person_email || comp.contact_email}</span>
                            </div>
                          )}
                          {!comp.contact_person_number && !comp.contact_phone && !comp.contact_person_email && !comp.contact_email && (
                            <span className="text-[#64748B]">N/A</span>
                          )}
                        </div>
                      </td>

                      {/* No. of Hirings */}
                      <td className="py-3.5 px-4 text-center font-bold text-[#1E293B]">
                        {comp.no_of_hirings ?? comp.employee_count ?? 0}
                      </td>

                      {/* CTC (LPA) */}
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-700">
                        {comp.ctc_lpa !== undefined && comp.ctc_lpa !== null ? `${comp.ctc_lpa} LPA` : (comp.package_offered || 'N/A')}
                      </td>

                      {/* Company Relationship Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border inline-block ${getStatusBadge(comp.status)}`}>
                          {comp.status}
                        </span>
                      </td>

                      {/* Placed Students (Drive Completed only) */}
                      <td className="py-3.5 px-4 text-center">
                        {isDriveCompleted ? (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-extrabold rounded-full border border-emerald-300">
                            {comp.placed_students ?? 0} Placed
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Approval Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border inline-flex items-center gap-1 ${appBadge.style}`}>
                          <AppIcon className="h-3 w-3" />
                          <span>{appBadge.label}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* ADMIN-ONLY APPROVAL BUTTONS */}
                          {currentUser.role === 'ADMIN' && isPending && (
                            <>
                              <button
                                onClick={() => handleApprove(comp.id)}
                                disabled={isBusy}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-md shadow-sm transition disabled:opacity-50"
                                title="Approve Company"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(comp.id)}
                                disabled={isBusy}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-md shadow-sm transition disabled:opacity-50"
                                title="Reject Company"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {/* REGISTRATION ACTION BUTTON */}
                          {comp.approval_status === 'APPROVED' ? (
                            <button
                              onClick={() => handleOpenRegistrationModal(comp)}
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-[11px] font-bold inline-flex items-center gap-1 transition shadow-xs"
                              title="Student Registration Link"
                            >
                              <Link2 className="h-3 w-3 text-indigo-600" />
                              <span>Registration</span>
                            </button>
                          ) : (
                            <span
                              className="px-2 py-1 text-slate-300 border border-slate-200 rounded-md text-[11px] font-medium inline-flex items-center gap-1 cursor-not-allowed"
                              title="Registration unavailable until company approval"
                            >
                              <Link2 className="h-3 w-3 opacity-40" />
                              <span className="opacity-60">Registration</span>
                            </span>
                          )}

                          {/* View JD Button */}
                          {comp.has_jd || comp.jd_file_path ? (
                            <a
                              href={api.getCompanyJDUrl(comp.id, false)}
                              target="_blank"
                              rel="noreferrer"
                              className="px-1.5 py-1 text-[#3B82F6] hover:bg-blue-50 border border-blue-200 rounded-md transition text-[11px] font-bold inline-flex items-center gap-1"
                              title={`View JD: ${comp.jd_file_name || 'Job Description'}`}
                            >
                              <FileText className="h-3.5 w-3.5" />
                              <span>JD</span>
                            </a>
                          ) : (
                            <span
                              className="px-1.5 py-1 text-slate-300 border border-slate-200 rounded-md text-[11px] font-medium inline-flex items-center gap-0.5 cursor-not-allowed"
                              title="JD Not Available"
                            >
                              <FileText className="h-3.5 w-3.5 opacity-40" />
                            </span>
                          )}

                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEditModal(comp)}
                            className="p-1 text-[#3B82F6] hover:bg-blue-50 border border-blue-200 rounded-md transition"
                            title="Edit Details"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => setDeletingCompany(comp)}
                            className="p-1 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-md transition"
                            title="Delete Company"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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

      {/* Section 2: Placement Department Faculty Directory */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
        <h3 className="font-bold text-[#1E293B] text-xs mb-3 flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-[#3B82F6]" />
          Placement Department Leads &amp; Coordinators
        </h3>

        {loading ? (
          <div className="py-8 text-center text-[#64748B] text-xs">Loading faculty coordinators...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {faculties.map((fac) => (
              <div key={fac.id} className="p-3.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white transition space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-[#1E293B]">{fac.name}</h4>
                    <p className="text-[11px] text-[#3B82F6] font-medium">{fac.designation}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#3B82F6] text-[10px] font-bold rounded border border-blue-200">
                    {fac.department}
                  </span>
                </div>

                <div className="text-[11px] space-y-1 text-[#64748B]">
                  <p className="flex items-center gap-1.5">
                    <Mail className="h-3 w-3 text-[#64748B]" />
                    <span>{fac.email}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-[#64748B]" />
                    <span>{fac.phone || '+91 9443100000'}</span>
                  </p>
                </div>

                <div className="pt-2 border-t border-[#E2E8F0] text-[10px] text-[#64748B]">
                  Role: <span className="font-semibold text-[#1E293B]">{fac.role_in_placement}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EXACT COMPANY FORM MODAL (ADD / EDIT) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-xl w-full p-6 border border-[#E2E8F0] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div>
                <h3 className="font-bold text-[#1E293B] text-base flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#3B82F6]" />
                  {isEditing ? 'Edit Company Details' : 'Add New Company'}
                </h3>
                <p className="text-xs text-[#64748B]">
                  {isEditing
                    ? 'Update recruiter hiring target, CTC package, and relationship status'
                    : 'Company will be immediately saved to Supabase with PENDING approval status'}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-[#64748B] hover:text-[#1E293B]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="py-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Company Name */}
                <div className="sm:col-span-2">
                  <label className="font-semibold text-[#1E293B]">1. Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Microsoft India, TCS, Infosys"
                    value={companyForm.company_name}
                    onChange={e => setCompanyForm({...companyForm, company_name: e.target.value})}
                    className="w-full mt-1 p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6]"
                  />
                </div>

                {/* 2. Location (City / Region text) */}
                <div>
                  <label className="font-semibold text-[#1E293B]">2. Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chennai, Bangalore, Hyderabad"
                    value={companyForm.location}
                    onChange={e => setCompanyForm({...companyForm, location: e.target.value})}
                    className="w-full mt-1 p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs focus:ring-2 focus:ring-[#3B82F6]"
                  />
                </div>

                {/* 3. Website */}
                <div>
                  <label className="font-semibold text-[#1E293B]">3. Website</label>
                  <input
                    type="text"
                    placeholder="e.g. https://www.company.com"
                    value={companyForm.website}
                    onChange={e => setCompanyForm({...companyForm, website: e.target.value})}
                    className="w-full mt-1 p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs focus:ring-2 focus:ring-[#3B82F6]"
                  />
                </div>

                {/* 4. Contact Person Number */}
                <div>
                  <label className="font-semibold text-[#1E293B]">4. Contact Person Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 9876543210"
                    value={companyForm.contact_person_number}
                    onChange={e => setCompanyForm({...companyForm, contact_person_number: e.target.value})}
                    className="w-full mt-1 p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs focus:ring-2 focus:ring-[#3B82F6]"
                  />
                </div>

                {/* 5. Contact Person Mail */}
                <div>
                  <label className="font-semibold text-[#1E293B]">5. Contact Person Mail</label>
                  <input
                    type="email"
                    placeholder="e.g. hr@company.com"
                    value={companyForm.contact_person_email}
                    onChange={e => setCompanyForm({...companyForm, contact_person_email: e.target.value})}
                    className="w-full mt-1 p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs focus:ring-2 focus:ring-[#3B82F6]"
                  />
                </div>

                {/* 6. No. of Hirings (Required integer >= 0) */}
                <div>
                  <label className="font-semibold text-[#1E293B]">6. No. of Hirings *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="e.g. 25"
                    value={companyForm.no_of_hirings}
                    onChange={e => setCompanyForm({...companyForm, no_of_hirings: parseInt(e.target.value) || 0})}
                    className="w-full mt-1 p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs focus:ring-2 focus:ring-[#3B82F6]"
                  />
                </div>

                {/* 7. CTC (LPA) (Required numeric > 0) */}
                <div>
                  <label className="font-semibold text-[#1E293B]">7. CTC (LPA) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    placeholder="e.g. 6.5, 12.0"
                    value={companyForm.ctc_lpa || ''}
                    onChange={e => setCompanyForm({...companyForm, ctc_lpa: parseFloat(e.target.value) || 0})}
                    className="w-full mt-1 p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs focus:ring-2 focus:ring-[#3B82F6]"
                  />
                </div>

                {/* 8. Relationship Status */}
                <div className="sm:col-span-2">
                  <label className="font-semibold text-[#1E293B]">8. Relationship Status *</label>
                  <select
                    value={companyForm.status}
                    onChange={e => setCompanyForm({...companyForm, status: e.target.value as CompanyStatus})}
                    className="w-full mt-1 p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#3B82F6]"
                  >
                    <option value="Cold">Cold</option>
                    <option value="Warm">Warm</option>
                    <option value="Hot">Hot</option>
                    <option value="Drive Completed">Drive Completed</option>
                  </select>
                </div>

                {/* 9. Google Maps Location Link (Single line URL input) */}
                <div className="sm:col-span-2">
                  <label className="font-semibold text-[#1E293B]">9. Google Maps Location Link *</label>
                  <input
                    type="url"
                    required
                    placeholder="Paste Google Maps location link..."
                    value={companyForm.google_maps_link}
                    onChange={e => setCompanyForm({...companyForm, google_maps_link: e.target.value})}
                    className="w-full mt-1 p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs focus:ring-2 focus:ring-[#3B82F6]"
                  />
                </div>

                {/* 10. No. of Placed Students (Conditionally shown ONLY when Drive Completed) */}
                {companyForm.status === 'Drive Completed' && (
                  <div className="sm:col-span-2 p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg animate-in fade-in duration-200">
                    <label className="font-bold text-emerald-900 block mb-1">
                      10. No. of Placed Students * (Max: {companyForm.no_of_hirings} Hirings)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={companyForm.no_of_hirings}
                      required
                      placeholder={`0 - ${companyForm.no_of_hirings}`}
                      value={companyForm.placed_students}
                      onChange={e => setCompanyForm({...companyForm, placed_students: parseInt(e.target.value) || 0})}
                      className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-[11px] text-emerald-700 mt-1">
                      Must be non-negative and cannot exceed total hirings ({companyForm.no_of_hirings}).
                    </p>
                  </div>
                )}

                {/* 11. Job Description (JD) Document Upload */}
                <div className="sm:col-span-2 p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-[#1E293B] flex items-center gap-1.5 text-xs">
                      <FileText className="h-4 w-4 text-[#3B82F6]" />
                      Job Description (JD) <span className="font-normal text-[#64748B] text-[11px]">(Optional — PDF, DOC, DOCX)</span>
                    </label>
                  </div>

                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={jdFileInputRef}
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setJdFile(file);
                        setRemoveJd(false);
                      }
                    }}
                  />

                  {/* Case A: Newly selected JD file */}
                  {jdFile ? (
                    <div className="flex items-center justify-between p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="h-4 w-4 text-[#3B82F6] shrink-0" />
                        <div className="truncate">
                          <p className="font-bold text-[#1E293B] text-xs truncate">{jdFile.name}</p>
                          <p className="text-[10px] text-[#64748B]">{(jdFile.size / (1024 * 1024)).toFixed(2)} MB &bull; Ready to upload</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => jdFileInputRef.current?.click()}
                          className="px-2 py-1 bg-white hover:bg-blue-100 text-[#3B82F6] text-[11px] font-semibold border border-blue-200 rounded transition"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setJdFile(null);
                            if (jdFileInputRef.current) jdFileInputRef.current.value = '';
                          }}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded transition"
                          title="Remove file"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : existingJdName && !removeJd ? (
                    /* Case B: Existing JD file from previous save */
                    <div className="flex items-center justify-between p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="h-4 w-4 text-emerald-700 shrink-0" />
                        <div className="truncate">
                          <p className="font-bold text-emerald-950 text-xs truncate">{existingJdName}</p>
                          <p className="text-[10px] text-emerald-700 font-medium">Currently attached JD</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {editingId && (
                          <a
                            href={api.getCompanyJDUrl(editingId, false)}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 bg-white hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold border border-emerald-300 rounded transition"
                          >
                            View
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => jdFileInputRef.current?.click()}
                          className="px-2 py-1 bg-white hover:bg-blue-50 text-[#3B82F6] text-[11px] font-semibold border border-blue-200 rounded transition"
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRemoveJd(true);
                            setJdFile(null);
                          }}
                          className="px-2 py-1 bg-white hover:bg-rose-50 text-rose-600 text-[11px] font-semibold border border-rose-200 rounded transition"
                          title="Remove JD from company"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Case C: No JD / Removed -> Choose button */
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-white border border-dashed border-[#CBD5E1] rounded-lg">
                      <div className="text-[11px] text-[#64748B]">
                        {removeJd ? (
                          <span className="text-amber-700 font-semibold">JD will be removed upon saving.</span>
                        ) : (
                          <span>Attach Job Description document (Max 10 MB).</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => jdFileInputRef.current?.click()}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#EFF6FF] hover:bg-blue-100 text-[#3B82F6] text-xs font-semibold border border-blue-200 rounded-lg transition shrink-0"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>Choose JD File</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Visual Preview Badges */}
              <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#64748B]">Relationship Progress:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(companyForm.status)}`}>
                    {companyForm.status}
                  </span>
                </div>
                {!isEditing && (
                  <div className="flex items-center justify-between pt-1 border-t border-[#E2E8F0]">
                    <span className="text-[11px] font-medium text-[#64748B]">Initial Approval Status:</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold border bg-amber-50 text-amber-700 border-amber-300 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> PENDING
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 bg-white text-[#64748B] font-semibold rounded-lg hover:bg-[#F8FAFC] border border-[#E2E8F0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-[#3B82F6] text-white font-bold rounded-lg hover:bg-[#2563EB] disabled:opacity-50 transition flex items-center gap-1.5"
                >
                  {formSubmitting ? 'Saving...' : isEditing ? 'Update Company' : 'Save & Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingCompany && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 border border-[#E2E8F0]">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2 bg-rose-50 rounded-lg">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#1E293B] text-base">Delete Company</h3>
                <p className="text-xs text-[#64748B]">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-[#64748B] py-2">
              Are you sure you want to delete <strong className="text-[#1E293B]">{deletingCompany.company_name || deletingCompany.name}</strong> from the database?
            </p>

            <div className="pt-3 flex justify-end gap-2 border-t border-[#E2E8F0]">
              <button
                onClick={() => setDeletingCompany(null)}
                className="px-3.5 py-1.5 bg-white text-[#64748B] text-xs font-semibold rounded-lg hover:bg-[#F8FAFC] border border-[#E2E8F0]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg disabled:opacity-50 transition flex items-center gap-1"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
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
    </div>
  );
};
