from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False) # 'Admin', 'Manager', 'Member'
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role,
            'full_name': self.full_name,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Student(db.Model):
    __tablename__ = 'students'
    
    id = db.Column(db.Integer, primary_key=True)
    s_no = db.Column(db.Integer, nullable=True) # 1. S.No
    reg_no = db.Column(db.String(50), unique=True, nullable=False) # 2. Reg No
    name = db.Column(db.String(120), nullable=False) # 3. Name
    department = db.Column(db.String(80), nullable=False) # 4. Dept
    gender = db.Column(db.String(20), nullable=False) # 5. Gender
    hosteller_status = db.Column(db.String(30), nullable=False) # 6. Hosteller/Day Scholar
    
    # Remaining of 18 fields
    email = db.Column(db.String(120), nullable=True) # 7
    phone = db.Column(db.String(30), nullable=True) # 8
    cgpa = db.Column(db.Float, nullable=True, default=0.0) # 9
    tenth_percentage = db.Column(db.Float, nullable=True, default=0.0) # 10
    twelfth_percentage = db.Column(db.Float, nullable=True, default=0.0) # 11
    diploma_percentage = db.Column(db.Float, nullable=True, default=0.0) # 12
    current_arrears = db.Column(db.Integer, nullable=True, default=0) # 13
    history_arrears = db.Column(db.Integer, nullable=True, default=0) # 14
    placement_status = db.Column(db.String(50), nullable=True, default='Unplaced') # 15: Placed / Unplaced / Higher Studies / Entrepreneur
    placed_company = db.Column(db.String(120), nullable=True) # 16
    salary_package = db.Column(db.String(50), nullable=True) # 17 (CTC in LPA)
    remarks = db.Column(db.Text, nullable=True) # 18
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_summary_dict(self):
        """Returns main table required 6 columns + id"""
        return {
            'id': self.id,
            's_no': self.s_no or self.id,
            'reg_no': self.reg_no,
            'name': self.name,
            'department': self.department,
            'gender': self.gender,
            'hosteller_status': self.hosteller_status
        }

    def to_full_dict(self):
        """Returns complete 18 student fields"""
        return {
            'id': self.id,
            's_no': self.s_no or self.id, # 1
            'reg_no': self.reg_no, # 2
            'name': self.name, # 3
            'department': self.department, # 4
            'gender': self.gender, # 5
            'hosteller_status': self.hosteller_status, # 6
            'email': self.email or '', # 7
            'phone': self.phone or '', # 8
            'cgpa': self.cgpa or 0.0, # 9
            'tenth_percentage': self.tenth_percentage or 0.0, # 10
            'twelfth_percentage': self.twelfth_percentage or 0.0, # 11
            'diploma_percentage': self.diploma_percentage or 0.0, # 12
            'current_arrears': self.current_arrears or 0, # 13
            'history_arrears': self.history_arrears or 0, # 14
            'placement_status': self.placement_status or 'Unplaced', # 15
            'placed_company': self.placed_company or 'N/A', # 16
            'salary_package': self.salary_package or 'N/A', # 17
            'remarks': self.remarks or '' # 18
        }

class Company(db.Model):
    __tablename__ = 'companies'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    industry = db.Column(db.String(80), nullable=True)
    status = db.Column(db.String(30), nullable=False, default='Cold') # 'Cold', 'Warm', 'Hot', 'Drive Completed'
    contact_person = db.Column(db.String(120), nullable=True)
    contact_email = db.Column(db.String(120), nullable=True)
    contact_phone = db.Column(db.String(30), nullable=True)
    package_offered = db.Column(db.String(50), nullable=True)
    drive_date = db.Column(db.String(50), nullable=True)
    remarks = db.Column(db.Text, nullable=True)
    faculty_in_charge = db.Column(db.String(120), nullable=True)
    created_by_user = db.Column(db.String(80), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'industry': self.industry or 'N/A',
            'status': self.status, # Cold / Warm / Hot / Drive Completed
            'contact_person': self.contact_person or 'N/A',
            'contact_email': self.contact_email or 'N/A',
            'contact_phone': self.contact_phone or 'N/A',
            'package_offered': self.package_offered or 'N/A',
            'drive_date': self.drive_date or 'TBD',
            'remarks': self.remarks or '',
            'faculty_in_charge': self.faculty_in_charge or 'Unassigned',
            'created_by_user': self.created_by_user or 'System',
            'created_at': self.created_at.isoformat() if self.created_at else None
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
