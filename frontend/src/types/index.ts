export type Role = 'ADMIN' | 'MANAGER' | 'MEMBER';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  created_at?: string;
}

export type TabType = 'dashboard' | 'students' | 'faculties' | 'companies' | 'reports';

// Main Table Student format (6 required columns + aliases + placement status)
export interface StudentSummary {
  id: number;
  s_no: number;
  reg_no: string;
  name: string;
  department: string;
  dept?: string;
  gender: string;
  hosteller_status: string;
  hosteller_day_scholar?: string;
  placement_status?: string;
  placed_company_id?: number;
  placed_company?: string;
}

// Complete 18 Student Fields + Placement details
export interface StudentFull extends StudentSummary {
  sslc_percentage?: number;
  tenth_percentage?: number;
  hsc_percentage?: number;
  twelfth_percentage?: number;
  ug_percentage?: number;
  cgpa?: number;
  pg_percentage?: number | null;
  diploma_percentage?: number;
  current_arrears?: number;
  history_arrears?: number;
  graduation_year?: number | null;
  github_id?: string;
  linkedin_id?: string;
  resume_link?: string;
  self_intro_link?: string;
  photo_link?: string;
  portfolio_link?: string;
  email?: string;
  phone?: string;
  mobile_no?: string;
  placement_status?: string;
  placed_company_id?: number;
  placed_company?: string;
  placed_company_name?: string;
  placed_ctc_lpa?: number;
  placement_date?: string;
  salary_package?: string;
  remarks?: string;
}

export type CompanyStatus = 'Cold' | 'Warm' | 'Hot' | 'Drive Completed';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Company {
  id: number;
  name: string;
  company_name?: string;
  location: string;
  website?: string;
  contact_person_number?: string;
  contact_phone?: string;
  contact_person_email?: string;
  contact_email?: string;
  no_of_hirings?: number;
  employee_count?: number;
  no_of_employees?: number;
  ctc_lpa?: number;
  placed_students?: number;
  google_maps_link?: string;
  company_address?: string;
  jd_file_path?: string | null;
  jd_file_name?: string | null;
  has_jd?: boolean;
  status: CompanyStatus;
  approval_status?: ApprovalStatus;
  
  // Registration Link & Counts
  registration_token?: string | null;
  registration_link_status?: 'ACTIVE' | 'INACTIVE';
  registered_students_count?: number;

  // Optional extra metadata
  job_title?: string;
  job_status?: string;
  jd_summary?: string;
  jd_pdf_link?: string;
  industry?: string;
  contact_person?: string;
  package_offered?: string;
  drive_date?: string;
  remarks?: string;
  faculty_in_charge?: string;
  created_by_user?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CompanyRegistration {
  id: number;
  company_id: number;
  student_id: number;
  s_no?: number;
  registration_status: 'REGISTERED' | 'WITHDRAWN';
  resume_link?: string;
  registered_email?: string;
  registered_mobile?: string;
  registered_at?: string;
  student_reg_no?: string;
  student_name?: string;
  student_department?: string;
  student_gender?: string;
  student_type?: string;
  placement_status?: string;
  placed_company_id?: number | null;
  placed_company_name?: string | null;
  placed_ctc_lpa?: number | null;
}

export interface Faculty {
  id: number;
  name: string;
  department: string;
  designation: string;
  email: string;
  phone: string;
  role_in_placement: string;
}

export interface ReportSummary {
  overview: {
    total_students: number;
    placed_students: number;
    unplaced_students: number;
    higher_studies?: number;
    entrepreneur?: number;
    placement_percentage: number;
    total_companies: number;
    drives_completed: number;
    total_hiring_capacity?: number;
    total_actual_placements?: number;
    average_ctc?: number;
    highest_ctc?: number;
  };
  company_status_counts: Record<CompanyStatus, number>;
  department_statistics: Array<{
    department: string;
    total: number;
    placed: number;
    unplaced: number;
    placement_percentage: number;
    avg_ctc?: number;
    highest_ctc?: number;
  }>;
  demographics: {
    gender: Record<string, number>;
    residence: Record<string, number>;
  };
  students?: StudentFull[];
}
