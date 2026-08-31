from app.extensions import db
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # Allowed: 'ADMIN', 'MANAGER', 'MEMBER'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Student(db.Model):
    __tablename__ = 'students'
    
    id = db.Column(db.Integer, primary_key=True)
    s_no = db.Column(db.Integer, nullable=True)
    reg_no = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    department = db.Column(db.String(80), nullable=False)
    gender = db.Column(db.String(20), nullable=False)
    hosteller_status = db.Column(db.String(30), nullable=False)  # Hosteller / Day Scholar
    
    # Academic Percentages & Scores
    sslc_percentage = db.Column(db.Float, nullable=True, default=0.0)      # 10th %
    hsc_percentage = db.Column(db.Float, nullable=True, default=0.0)       # 12th %
    ug_percentage = db.Column(db.Float, nullable=True, default=0.0)        # UG % / CGPA
    pg_percentage = db.Column(db.Float, nullable=True)                     # PG % (Optional / Nullable)
    diploma_percentage = db.Column(db.Float, nullable=True, default=0.0)
    current_arrears = db.Column(db.Integer, nullable=True, default=0)
    history_arrears = db.Column(db.Integer, nullable=True, default=0)
    graduation_year = db.Column(db.Integer, nullable=True)
    
    # Profiles & Links
    github_id = db.Column(db.String(255), nullable=True)
    linkedin_id = db.Column(db.String(255), nullable=True)
    resume_link = db.Column(db.String(500), nullable=True)
    self_intro_link = db.Column(db.String(500), nullable=True)
    photo_link = db.Column(db.String(500), nullable=True)
    portfolio_link = db.Column(db.String(500), nullable=True)
    
    # Contact Info
    email = db.Column(db.String(120), nullable=True)
    phone = db.Column(db.String(30), nullable=True)
    
    # Placement Status & Details
    placement_status = db.Column(db.String(50), nullable=True, default='YET_TO_BE_PLACED')
    placed_company_id = db.Column(db.Integer, nullable=True)
    placed_company = db.Column(db.String(120), nullable=True)
    placed_ctc_lpa = db.Column(db.Float, nullable=True)
    placement_date = db.Column(db.String(50), nullable=True)
    salary_package = db.Column(db.String(50), nullable=True)
    remarks = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def tenth_percentage(self):
        return self.sslc_percentage or 0.0

    @property
    def twelfth_percentage(self):
        return self.hsc_percentage or 0.0

    @property
    def cgpa(self):
        return self.ug_percentage or 0.0

    @property
    def mobile_no(self):
        return self.phone or ''

    @property
    def dept(self):
        return self.department

    def get_norm_placement_status(self):
        """Return normalized placement status: 'PLACED' or 'YET_TO_BE_PLACED'"""
        st = str(self.placement_status or '').strip().upper()
        if st in ('PLACED', 'YES'):
            return 'PLACED'
        return 'YET_TO_BE_PLACED'

    @staticmethod
    def display_placement_status(norm_status: str) -> str:
        """Convert internal status to user-facing display text"""
        if norm_status == 'PLACED':
            return 'Placed'
        return 'Yet to be Placed'

    def to_summary_dict(self):
        norm_status = self.get_norm_placement_status()
        return {
            'id': self.id,
            's_no': self.s_no or self.id,
            'reg_no': self.reg_no,
            'name': self.name,
            'department': self.department,
            'dept': self.department,
            'gender': self.gender,
            'hosteller_status': self.hosteller_status,
            'hosteller_day_scholar': self.hosteller_status,
            'placement_status': norm_status,
            'placed_company_id': self.placed_company_id,
            'placed_company': self.placed_company or 'N/A'
        }

    def to_full_dict(self):
        norm_status = self.get_norm_placement_status()
        ctc_str = f"{self.placed_ctc_lpa} LPA" if self.placed_ctc_lpa is not None else (self.salary_package or 'N/A')
        return {
            'id': self.id,
            's_no': self.s_no or self.id,
            'reg_no': self.reg_no,
            'name': self.name,
            'department': self.department,
            'dept': self.department,
            'gender': self.gender,
            'hosteller_status': self.hosteller_status,
            'hosteller_day_scholar': self.hosteller_status,
            'sslc_percentage': self.sslc_percentage if self.sslc_percentage is not None else 0.0,
            'tenth_percentage': self.sslc_percentage if self.sslc_percentage is not None else 0.0,
            'hsc_percentage': self.hsc_percentage if self.hsc_percentage is not None else 0.0,
            'twelfth_percentage': self.hsc_percentage if self.hsc_percentage is not None else 0.0,
            'ug_percentage': self.ug_percentage if self.ug_percentage is not None else 0.0,
            'cgpa': self.ug_percentage if self.ug_percentage is not None else 0.0,
            'pg_percentage': self.pg_percentage,
            'diploma_percentage': self.diploma_percentage if self.diploma_percentage is not None else 0.0,
            'current_arrears': self.current_arrears if self.current_arrears is not None else 0,
            'history_arrears': self.history_arrears if self.history_arrears is not None else 0,
            'graduation_year': self.graduation_year,
            'github_id': self.github_id or '',
            'linkedin_id': self.linkedin_id or '',
            'resume_link': self.resume_link or '',
            'self_intro_link': self.self_intro_link or '',
            'photo_link': self.photo_link or '',
            'portfolio_link': self.portfolio_link or '',
            'email': self.email or '',
            'phone': self.phone or '',
            'mobile_no': self.phone or '',
            'placement_status': norm_status,
            'placed_company_id': self.placed_company_id,
            'placed_company': self.placed_company or 'N/A',
            'placed_company_name': self.placed_company or 'N/A',
            'placed_ctc_lpa': round(self.placed_ctc_lpa, 2) if self.placed_ctc_lpa is not None else None,
            'salary_package': ctc_str,
            'placement_date': self.placement_date or '',
            'remarks': self.remarks or ''
        }

class Company(db.Model):
    __tablename__ = 'companies'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False) # Company Name
    location = db.Column(db.String(120), nullable=True) # Location (e.g. Chennai, Bangalore)
    website = db.Column(db.String(255), nullable=True) # Website
    contact_person_number = db.Column(db.String(30), nullable=True) # Contact Person Number
    contact_person_email = db.Column(db.String(120), nullable=True) # Contact Person Mail
    no_of_hirings = db.Column(db.Integer, nullable=True, default=0) # No. of Hirings
    ctc_lpa = db.Column(db.Float, nullable=True) # CTC in LPA (e.g. 12.0)
    placed_students = db.Column(db.Integer, nullable=True, default=0) # No. of Placed Students
    google_maps_link = db.Column(db.Text, nullable=True) # Google Maps Location Link
    jd_file_path = db.Column(db.String(500), nullable=True) # Storage path or reference for JD document
    jd_file_name = db.Column(db.String(255), nullable=True) # Original uploaded JD filename
    status = db.Column(db.String(30), nullable=False, default='Cold') # 'Cold', 'Warm', 'Hot', 'Drive Completed'
    approval_status = db.Column(db.String(30), nullable=False, default='PENDING') # 'PENDING', 'APPROVED', 'REJECTED'
    
    # Registration Link Token and Status
    registration_token = db.Column(db.String(64), unique=True, nullable=True)
    registration_link_status = db.Column(db.String(20), nullable=False, default='INACTIVE') # 'ACTIVE', 'INACTIVE'

    # Extended fields from Companies_List template
    job_title = db.Column(db.Text, nullable=True) # Job Title / Role
    job_status = db.Column(db.String(50), nullable=True) # Job Status
    jd_summary = db.Column(db.Text, nullable=True) # Job Description Summary
    jd_pdf_link = db.Column(db.Text, nullable=True) # JD PDF Link
    
    # Backward compatibility fields
    employee_count = db.Column(db.Integer, nullable=True, default=0)
    company_address = db.Column(db.Text, nullable=True)
    industry = db.Column(db.String(80), nullable=True)
    contact_person = db.Column(db.String(120), nullable=True)
    package_offered = db.Column(db.String(50), nullable=True)
    drive_date = db.Column(db.String(50), nullable=True)
    remarks = db.Column(db.Text, nullable=True)
    faculty_in_charge = db.Column(db.String(120), nullable=True)
    created_by_user = db.Column(db.String(80), nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Aliases
    @property
    def company_name(self):
        return self.name

    @property
    def contact_phone(self):
        return self.contact_person_number or ''

    @property
    def contact_email(self):
        return self.contact_person_email or ''

    @property
    def no_of_employees(self):
        return self.no_of_hirings or self.employee_count or 0

    def get_real_placed_count(self):
        """
        Authoritative calculation of placed students for this specific company:
        Counts registered students for this company who are placed in this company.
        """
        try:
            return db.session.query(db.func.count(CompanyRegistration.id))\
                .join(Student, CompanyRegistration.student_id == Student.id)\
                .filter(
                    CompanyRegistration.company_id == self.id,
                    CompanyRegistration.registration_status == 'REGISTERED',
                    (Student.placed_company_id == self.id) | (Student.placed_company == self.name),
                    (Student.placement_status == 'PLACED') | (Student.placement_status == 'Placed') | (Student.placement_status == 'YES')
                ).scalar() or 0
        except Exception:
            return 0

    def get_registered_students_count(self):
        """Count of students registered for this company drive"""
        try:
            return db.session.query(db.func.count(CompanyRegistration.id)).filter(
                CompanyRegistration.company_id == self.id,
                CompanyRegistration.registration_status == 'REGISTERED'
            ).scalar() or 0
        except Exception:
            return 0

    def to_dict(self, placed_count=None, registered_count=None):
        maps_link = self.google_maps_link or self.company_address or ''
        hirings = self.no_of_hirings if self.no_of_hirings is not None else (self.employee_count or 0)
        actual_placed = placed_count if placed_count is not None else self.get_real_placed_count()
        actual_reg = registered_count if registered_count is not None else self.get_registered_students_count()
        
        return {
            'id': self.id,
            'name': self.name,
            'company_name': self.name,
            'job_title': self.job_title or self.industry or '',
            'job_role': self.job_title or self.industry or '',
            'job_status': self.job_status or '',
            'jd_summary': self.jd_summary or '',
            'jd_pdf_link': self.jd_pdf_link or '',
            'location': self.location or 'N/A',
            'website': self.website or '',
            'contact_person_number': self.contact_person_number or self.contact_phone or '',
            'contact_phone': self.contact_person_number or self.contact_phone or '',
            'contact_person_email': self.contact_person_email or self.contact_email or '',
            'contact_email': self.contact_person_email or self.contact_email or '',
            'no_of_hirings': hirings,
            'employee_count': hirings,
            'no_of_employees': hirings,
            'ctc_lpa': round(self.ctc_lpa, 2) if self.ctc_lpa is not None else None,
            'package_offered': f"{self.ctc_lpa} LPA" if self.ctc_lpa is not None else (self.package_offered or 'N/A'),
            'placed_students': actual_placed,
            'registered_students_count': actual_reg,
            'registration_token': self.registration_token,
            'registration_link_status': self.registration_link_status or ('ACTIVE' if self.approval_status == 'APPROVED' else 'INACTIVE'),
            'google_maps_link': maps_link,
            'company_address': maps_link,
            'jd_file_path': self.jd_file_path,
            'jd_file_name': self.jd_file_name,
            'has_jd': bool(self.jd_file_path or self.jd_pdf_link),
            'status': self.status,
            'approval_status': self.approval_status or 'PENDING',
            'industry': self.industry or 'Technology',
            'contact_person': self.contact_person or '',
            'drive_date': self.drive_date or 'TBD',
            'remarks': self.remarks or '',
            'faculty_in_charge': self.faculty_in_charge or 'Unassigned',
            'created_by_user': self.created_by_user or 'Faculty User',
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class CompanyRegistration(db.Model):
    __tablename__ = 'company_registrations'

    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    registration_status = db.Column(db.String(30), nullable=False, default='REGISTERED') # 'REGISTERED', 'WITHDRAWN'
    resume_link = db.Column(db.Text, nullable=True)
    registered_email = db.Column(db.String(120), nullable=True)
    registered_mobile = db.Column(db.String(30), nullable=True)
    registered_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('company_id', 'student_id', name='uq_company_student'),
    )

    company = db.relationship('Company', backref=db.backref('registrations', cascade='all, delete-orphan'))
    student = db.relationship('Student', backref=db.backref('company_registrations', cascade='all, delete-orphan'))

    def to_dict(self):
        s = self.student
        comp = self.company
        is_placed_here = (
            s is not None and
            (s.placed_company_id == self.company_id or (s.placed_company and comp and s.placed_company.strip().lower() == comp.name.strip().lower())) and
            (str(s.placement_status or '').strip().upper() in ('PLACED', 'YES'))
        )
        return {
            'id': self.id,
            'company_id': self.company_id,
            'student_id': self.student_id,
            'registration_status': self.registration_status,
            'resume_link': self.resume_link or (s.resume_link if s else ''),
            'registered_email': self.registered_email or (s.email if s else ''),
            'registered_mobile': self.registered_mobile or (s.phone if s else ''),
            'registered_at': self.registered_at.strftime('%Y-%m-%d %H:%M:%S') if self.registered_at else '',
            'student_reg_no': s.reg_no if s else '',
            'student_name': s.name if s else '',
            'student_department': s.department or s.dept if s else '',
            'student_gender': s.gender if s else '',
            'student_type': s.hosteller_status or s.hosteller_day_scholar if s else '',
            'placement_status': 'PLACED' if is_placed_here else 'YET_TO_BE_PLACED',
            'global_placement_status': s.get_norm_placement_status() if s else 'YET_TO_BE_PLACED',
            'is_placed_in_company': is_placed_here,
            'placed_company_id': s.placed_company_id if s else None,
            'placed_company_name': s.placed_company if s else None,
            'placed_ctc_lpa': s.placed_ctc_lpa if s else None
        }

class Faculty(db.Model):
    __tablename__ = 'faculties'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    department = db.Column(db.String(80), nullable=False)
    designation = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(30), nullable=True)
    role_in_placement = db.Column(db.String(80), default='Placement Coordinator')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'department': self.department,
            'designation': self.designation,
            'email': self.email,
            'phone': self.phone or '',
            'role_in_placement': self.role_in_placement
        }
