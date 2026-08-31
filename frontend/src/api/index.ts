import axios from 'axios';
import { StudentSummary, StudentFull, Company, Faculty, ReportSummary, User, CompanyRegistration } from '../types';

// Resolve Base API URL:
// In production (Vercel): uses VITE_API_URL env variable (e.g. https://your-backend.onrender.com)
// In local development: defaults to '' so Vite's dev proxy /api -> http://localhost:5000 handles it seamlessly,
// or uses VITE_API_URL if explicitly specified in .env / .env.local.
const RAW_API_URL = (import.meta.env.VITE_API_URL || '').trim();
export const API_HOST = RAW_API_URL.replace(/\/+$/, '');
export const API_BASE = API_HOST ? `${API_HOST}/api` : '/api';

// Attach JWT token from localStorage if present
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('placement_portal_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response interceptor for helpful error reporting and token expiry handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (import.meta.env.DEV) {
      console.warn('[Placement Portal API Error]', error.config?.url, error.response?.status, error.message);
    }
    // If 401 Unauthorized occurs on a protected route, clean stale token
    if (error.response && error.response.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('placement_portal_token');
      localStorage.removeItem('placement_portal_user');
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Auth APIs
  login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
    const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
    if (!res.data || !res.data.token || !res.data.user) {
      throw new Error('Invalid authentication response from server.');
    }
    return res.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const res = await axios.get(`${API_BASE}/auth/me`);
    return res.data;
  },

  // Students
  getStudents: async (params?: { department?: string; gender?: string; hosteller_status?: string; placement_status?: string; search?: string }): Promise<StudentSummary[]> => {
    const res = await axios.get(`${API_BASE}/students/`, { params });
    return res.data;
  },
  getStudentDetails: async (id: number): Promise<StudentFull> => {
    const res = await axios.get(`${API_BASE}/students/${id}`);
    return res.data;
  },
  addStudent: async (data: Partial<StudentFull>): Promise<StudentFull> => {
    const res = await axios.post(`${API_BASE}/students/`, data);
    return res.data.student;
  },
  updateStudent: async (id: number, data: Partial<StudentFull>): Promise<StudentFull> => {
    const res = await axios.put(`${API_BASE}/students/${id}`, data);
    return res.data.student;
  },
  getEligiblePlacementCompanies: async (studentId: number): Promise<Company[]> => {
    const res = await axios.get(`${API_BASE}/students/${studentId}/eligible-placement-companies`);
    return res.data;
  },
  placeStudent: async (studentId: number, companyId: number): Promise<{ message: string; student: StudentFull; company: Company }> => {
    const res = await axios.post(`${API_BASE}/students/${studentId}/placement`, { company_id: companyId });
    return res.data;
  },
  terminateStudentPlacement: async (studentId: number): Promise<{ message: string; student: StudentFull }> => {
    const res = await axios.delete(`${API_BASE}/students/${studentId}/placement`);
    return res.data;
  },
  uploadStudentExcel: async (file: File): Promise<{ message: string; added: number; updated: number; skipped: number; errors: any[]; stats?: { total_students: number; placed: number; yet_to_be_placed: number } }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axios.post(`${API_BASE}/students/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  deleteStudent: async (id: number): Promise<{ message: string }> => {
    const res = await axios.delete(`${API_BASE}/students/${id}`);
    return res.data;
  },

  bulkDeleteStudents: async (studentIds: number[]): Promise<{ message: string; deleted_count: number }> => {
    const res = await axios.delete(`${API_BASE}/students/bulk`, { data: { student_ids: studentIds } });
    return res.data;
  },

  // Companies
  getCompanies: async (params?: { status?: string; approval_status?: string; search?: string }): Promise<Company[]> => {
    const res = await axios.get(`${API_BASE}/companies/`, { params });
    return res.data;
  },
  getCompany: async (id: number): Promise<Company> => {
    const res = await axios.get(`${API_BASE}/companies/${id}`);
    return res.data;
  },
  getCompanyPlacedStudents: async (companyId: number): Promise<{
    company_id: number;
    company_name: string;
    total_placed: number;
    students: Array<{
      id: number;
      reg_no: string;
      name: string;
      department: string;
      gender?: string;
      email?: string;
      phone?: string;
      salary_package?: string;
      placed_ctc_lpa?: number;
      placement_date?: string;
    }>;
  }> => {
    const res = await axios.get(`${API_BASE}/companies/${companyId}/placed-students`);
    return res.data;
  },
  addCompany: async (companyData: Partial<Company> | FormData): Promise<{ message: string; company: Company }> => {
    const isFormData = companyData instanceof FormData;
    const res = await axios.post(`${API_BASE}/companies/`, companyData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined
    });
    return res.data;
  },
  updateCompany: async (id: number, companyData: Partial<Company> | FormData): Promise<Company> => {
    const isFormData = companyData instanceof FormData;
    const res = await axios.put(`${API_BASE}/companies/${id}`, companyData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined
    });
    return res.data.company;
  },
  downloadCompanyJD: async (id: number, download: boolean = true): Promise<Blob> => {
    const res = await axios.get(`${API_BASE}/companies/${id}/jd`, {
      params: { download: download ? '1' : undefined },
      responseType: 'blob'
    });
    return res.data;
  },
  getCompanyJDUrl: (id: number, download: boolean = false): string => {
    return `${API_BASE}/companies/${id}/jd${download ? '?download=1' : ''}`;
  },
  uploadCompanyJD: async (id: number, file: File): Promise<{ success: boolean; message: string; jd_url: string; jd_filename: string; company: Company }> => {
    const formData = new FormData();
    formData.append('jd_file', file);
    const res = await axios.post(`${API_BASE}/companies/${id}/jd`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  deleteCompanyJD: async (id: number): Promise<{ success: boolean; message: string; company: Company }> => {
    const res = await axios.delete(`${API_BASE}/companies/${id}/jd`);
    return res.data;
  },
  approveCompany: async (id: number): Promise<{ message: string; company: Company }> => {
    const res = await axios.patch(`${API_BASE}/companies/${id}/approve`);
    return res.data;
  },
  rejectCompany: async (id: number): Promise<{ message: string; company: Company }> => {
    const res = await axios.patch(`${API_BASE}/companies/${id}/reject`);
    return res.data;
  },
  deleteCompany: async (id: number): Promise<{ message: string }> => {
    const res = await axios.delete(`${API_BASE}/companies/${id}`);
    return res.data;
  },
  exportCompanies: async (params?: { status?: string; approval_status?: string; search?: string }): Promise<Blob> => {
    const res = await axios.get(`${API_BASE}/companies/export`, {
      params,
      responseType: 'blob'
    });
    return res.data;
  },
  downloadCompanyTemplate: async (): Promise<Blob> => {
    const res = await axios.get(`${API_BASE}/companies/template`, {
      responseType: 'blob'
    });
    return res.data;
  },
  importCompaniesExcel: async (file: File): Promise<{ message: string; count: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axios.post(`${API_BASE}/companies/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  // Company Registrations
  getCompanyRegistrations: async (
    companyId: number,
    params?: {
      search?: string;
      department?: string;
      gender?: string;
      student_type?: string;
      registration_status?: string;
      placement_status?: string;
    }
  ): Promise<{ company: Company; registrations: CompanyRegistration[]; total_registered: number }> => {
    const res = await axios.get(`${API_BASE}/companies/${companyId}/registrations`, { params });
    return res.data;
  },

  getCompanyRegistrationLink: async (companyId: number): Promise<{
    company_id: number;
    company_name: string;
    registration_token: string;
    registration_link_status: string;
    registered_students_count: number;
    is_active: boolean;
  }> => {
    const res = await axios.get(`${API_BASE}/companies/${companyId}/registration-link`);
    return res.data;
  },

  // Public Student Registration APIs
  getPublicRegistrationInfo: async (token: string): Promise<{ valid: boolean; company: any }> => {
    const res = await axios.get(`${API_BASE}/public/company-registration/${token}`);
    return res.data;
  },

  lookupStudentForRegistration: async (token: string, regNo: string): Promise<{ found: boolean; student: any }> => {
    const res = await axios.post(`${API_BASE}/public/company-registration/${token}/lookup`, { reg_no: regNo });
    return res.data;
  },

  submitCompanyRegistration: async (token: string, data: { reg_no: string; resume_link?: string; email?: string; phone?: string }): Promise<{ message: string; company_name: string; student_name: string; reg_no: string }> => {
    const res = await axios.post(`${API_BASE}/public/company-registration/${token}`, data);
    return res.data;
  },

  // Faculties
  getFaculties: async (): Promise<Faculty[]> => {
    const res = await axios.get(`${API_BASE}/faculties/`);
    return res.data;
  },
  addFaculty: async (data: Partial<Faculty>): Promise<Faculty> => {
    const res = await axios.post(`${API_BASE}/faculties/`, data);
    return res.data.faculty;
  },

  // Reports
  getReportSummary: async (): Promise<ReportSummary> => {
    const res = await axios.get(`${API_BASE}/reports/summary`);
    return res.data;
  }
};
