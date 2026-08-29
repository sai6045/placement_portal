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
    
    # Placement Status
    placement_status = db.Column(db.String(50), nullable=True, default='Unplaced')
    placed_company = db.Column(db.String(120), nullable=True)
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

    def to_summary_dict(self):
        return {
            'id': self.id,
            's_no': self.s_no or self.id,
            'reg_no': self.reg_no,
            'name': self.name,
            'department': self.department,
            'dept': self.department,
            'gender': self.gender,
            'hosteller_status': self.hosteller_status,
            'hosteller_day_scholar': self.hosteller_status
        }

    def to_full_dict(self):
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
            'placement_status': self.placement_status or 'Unplaced',
            'placed_company': self.placed_company or 'N/A',
            'salary_package': self.salary_package or 'N/A',
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
    employee_count = db.Column(db.Integer, nullable=True, default=0) # No. of Employees
    google_maps_link = db.Column(db.Text, nullable=True) # Google Maps Location Link
    company_address = db.Column(db.Text, nullable=True) # Backward compatibility
    status = db.Column(db.String(30), nullable=False, default='Cold') # 'Cold', 'Warm', 'Hot', 'Drive Completed'
    approval_status = db.Column(db.String(30), nullable=False, default='PENDING') # 'PENDING', 'APPROVED', 'REJECTED'
    
    # Additional metadata fields for backward compatibility
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
        return self.employee_count or 0

    def to_dict(self):
        maps_link = self.google_maps_link or self.company_address or ''
        return {
            'id': self.id,
            'name': self.name,
            'company_name': self.name,
            'location': self.location or 'N/A',
            'website': self.website or '',
            'contact_person_number': self.contact_person_number or self.contact_phone or '',
            'contact_phone': self.contact_person_number or self.contact_phone or '',
            'contact_person_email': self.contact_person_email or self.contact_email or '',
            'contact_email': self.contact_person_email or self.contact_email or '',
            'employee_count': self.employee_count if self.employee_count is not None else 0,
            'no_of_employees': self.employee_count if self.employee_count is not None else 0,
            'google_maps_link': maps_link,
            'company_address': maps_link,
            'status': self.status,
            'approval_status': self.approval_status or 'PENDING',
            'industry': self.industry or 'Technology',
            'contact_person': self.contact_person or '',
            'package_offered': self.package_offered or 'N/A',
            'drive_date': self.drive_date or 'TBD',
            'remarks': self.remarks or '',
            'faculty_in_charge': self.faculty_in_charge or 'Unassigned',
            'created_by_user': self.created_by_user or 'Faculty User',
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
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
