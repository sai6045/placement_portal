import re
import io
import traceback
import pandas as pd
from flask import Blueprint, request, jsonify, send_file
from app.extensions import db
from app.models import Student

students_bp = Blueprint('students', __name__)

def parse_float_safe(val, default=None):
    if val is None:
        return default
    if isinstance(val, (int, float)):
        return float(val)
    val_str = str(val).strip()
    if not val_str or val_str.lower() in ('none', 'null', 'nan', 'n/a', ''):
        return default
    try:
        return float(val_str)
    except (ValueError, TypeError):
        return default

def parse_int_safe(val, default=None):
    if val is None:
        return default
    if isinstance(val, int):
        return val
    if isinstance(val, float):
        return int(val)
    val_str = str(val).strip()
    if not val_str or val_str.lower() in ('none', 'null', 'nan', 'n/a', ''):
        return default
    try:
        return int(float(val_str))
    except (ValueError, TypeError):
        return default

@students_bp.route('/', methods=['GET'])
def get_students():
    try:
        department = request.args.get('department')
        gender = request.args.get('gender')
        hosteller = request.args.get('hosteller_status')
        search = request.args.get('search')

        query = Student.query
        if department:
            query = query.filter(Student.department.ilike(f'%{department}%'))
        if gender:
            query = query.filter(Student.gender == gender)
        if hosteller:
            query = query.filter(Student.hosteller_status == hosteller)
        if search:
            query = query.filter(
                (Student.name.ilike(f'%{search}%')) |
                (Student.reg_no.ilike(f'%{search}%'))
            )

        students = query.order_by(Student.s_no.asc(), Student.id.asc()).all()
        return jsonify([s.to_summary_dict() for s in students]), 200
    except Exception as e:
        print(f"[ERROR] get_students failed: {traceback.format_exc()}")
        return jsonify({'error': 'Failed to retrieve students', 'details': str(e)}), 500

@students_bp.route('/<int:student_id>', methods=['GET'])
def get_student_details(student_id):
    try:
        student = db.session.get(Student, student_id)
        if not student:
            return jsonify({'error': 'Student not found'}), 404
        return jsonify(student.to_full_dict()), 200
    except Exception as e:
        print(f"[ERROR] get_student_details failed: {traceback.format_exc()}")
        return jsonify({'error': 'Failed to retrieve student details', 'details': str(e)}), 500

@students_bp.route('/', methods=['POST'])
def add_student():
    try:
        data = request.get_json() or {}
        
        # 1. Reg No & Name Validation
        reg_no = str(data.get('reg_no') or '').strip()
        name = str(data.get('name') or '').strip()
        
        if not reg_no:
            return jsonify({'error': 'Registration number is required', 'details': 'reg_no field cannot be empty'}), 400
        if not name:
            return jsonify({'error': 'Student name is required', 'details': 'name field cannot be empty'}), 400

        # Check duplicate
        existing = Student.query.filter(Student.reg_no.ilike(reg_no)).first()
        if existing:
            return jsonify({
                'error': 'Student with this registration number already exists.',
                'details': f'Registration number {reg_no} is already registered to {existing.name}.'
            }), 409

        # 2. Percentage validations (0 to 100)
        sslc_pct = parse_float_safe(data.get('sslc_percentage') if data.get('sslc_percentage') is not None else data.get('tenth_percentage'), default=0.0)
        hsc_pct = parse_float_safe(data.get('hsc_percentage') if data.get('hsc_percentage') is not None else data.get('twelfth_percentage'), default=0.0)
        ug_pct = parse_float_safe(data.get('ug_percentage') if data.get('ug_percentage') is not None else data.get('cgpa'), default=0.0)
        
        # Optional PG percentage (can be null/empty)
        pg_pct = parse_float_safe(data.get('pg_percentage'), default=None)

        if sslc_pct is not None and (sslc_pct < 0 or sslc_pct > 100):
            return jsonify({'error': 'SSLC percentage must be between 0 and 100.', 'details': f'Received {sslc_pct}'}), 400
        if hsc_pct is not None and (hsc_pct < 0 or hsc_pct > 100):
            return jsonify({'error': 'HSC percentage must be between 0 and 100.', 'details': f'Received {hsc_pct}'}), 400
        if ug_pct is not None and (ug_pct < 0 or ug_pct > 100):
            return jsonify({'error': 'UG percentage / CGPA must be between 0 and 100.', 'details': f'Received {ug_pct}'}), 400
        if pg_pct is not None and (pg_pct < 0 or pg_pct > 100):
            return jsonify({'error': 'PG percentage must be between 0 and 100.', 'details': f'Received {pg_pct}'}), 400

        # 3. Email validation if provided
        email = str(data.get('email') or '').strip()
        if email:
            email_pattern = r'^[^@\s]+@[^@\s]+\.[^@\s]+$'
            if not re.match(email_pattern, email):
                return jsonify({'error': 'Please enter a valid email address.', 'details': f'Invalid email: {email}'}), 400

        # 4. Mobile / Phone validation if provided
        phone = str(data.get('mobile_no') or data.get('phone') or '').strip()
        
        # 5. Extract remaining fields with fallback aliases
        dept = str(data.get('dept') or data.get('department') or 'CSE').strip()
        gender = str(data.get('gender') or 'Male').strip()
        hosteller = str(data.get('hosteller/day_scholar') or data.get('hosteller_day_scholar') or data.get('hosteller_status') or 'Day Scholar').strip()
        
        diploma_pct = parse_float_safe(data.get('diploma_percentage'), default=0.0)
        curr_arrears = parse_int_safe(data.get('current_arrears'), default=0)
        hist_arrears = parse_int_safe(data.get('history_arrears'), default=0)
        grad_year = parse_int_safe(data.get('graduation_year'), default=None)
        
        github_id = str(data.get('github_id') or '').strip()
        linkedin_id = str(data.get('linkedin_id') or '').strip()
        resume_link = str(data.get('resume_link') or '').strip()
        self_intro_link = str(data.get('self_intro_link') or '').strip()
        photo_link = str(data.get('photo_link') or '').strip()
        portfolio_link = str(data.get('portfolio_link') or '').strip()
        
        placement_status = str(data.get('placement_status') or 'Unplaced').strip()
        placed_company = str(data.get('placed_company') or '').strip()
        salary_package = str(data.get('salary_package') or '').strip()
        remarks = str(data.get('remarks') or '').strip()

        # Generate S.No
        max_sno = db.session.query(db.func.max(Student.s_no)).scalar() or 0

        student = Student(
            s_no=max_sno + 1,
            reg_no=reg_no,
            name=name,
            department=dept,
            gender=gender,
            hosteller_status=hosteller,
            sslc_percentage=sslc_pct if sslc_pct is not None else 0.0,
            hsc_percentage=hsc_pct if hsc_pct is not None else 0.0,
            ug_percentage=ug_pct if ug_pct is not None else 0.0,
            pg_percentage=pg_pct,
            diploma_percentage=diploma_pct if diploma_pct is not None else 0.0,
            current_arrears=curr_arrears if curr_arrears is not None else 0,
            history_arrears=hist_arrears if hist_arrears is not None else 0,
            graduation_year=grad_year,
            github_id=github_id,
            linkedin_id=linkedin_id,
            resume_link=resume_link,
            self_intro_link=self_intro_link,
            photo_link=photo_link,
            portfolio_link=portfolio_link,
            email=email,
            phone=phone,
            placement_status=placement_status,
            placed_company=placed_company,
            salary_package=salary_package,
            remarks=remarks
        )

        db.session.add(student)
        db.session.commit()
        return jsonify({'message': 'Student added successfully', 'student': student.to_full_dict()}), 201

    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] add_student failed: {traceback.format_exc()}")
        return jsonify({
            'error': 'Unable to save student. Please try again.',
            'details': str(e)
        }), 500

@students_bp.route('/upload', methods=['POST'])
def upload_excel():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded', 'details': 'file field is missing in request'}), 400

    file = request.files['file']
    filename = file.filename.lower()

    if not (filename.endswith('.xlsx') or filename.endswith('.xls') or filename.endswith('.csv')):
        return jsonify({'error': 'Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV file.'}), 400

    try:
        if filename.endswith('.csv'):
            df = pd.read_csv(file)
        else:
            df = pd.read_excel(file)

        df.columns = [str(c).strip() for c in df.columns]

        def get_val(row, possible_keys, default=None):
            for key in possible_keys:
                for col in row.index:
                    if str(col).strip().lower() == str(key).strip().lower():
                        val = row[col]
                        if pd.notna(val):
                            return val
            return default

        added_count = 0
        updated_count = 0
        max_sno = db.session.query(db.func.max(Student.s_no)).scalar() or 0

        for idx, row in df.iterrows():
            reg_no = str(get_val(row, ['Reg No', 'Register No', 'Registration Number', 'reg_no'], '') or '').strip()
            name = str(get_val(row, ['Name', 'Student Name', 'name'], '') or '').strip()

            if not reg_no or not name:
                continue

            student = Student.query.filter(Student.reg_no.ilike(reg_no)).first()

            dept = str(get_val(row, ['Dept', 'Department', 'department'], 'CSE')).strip()
            gender = str(get_val(row, ['Gender', 'gender'], 'Male')).strip()
            hosteller = str(get_val(row, ['Hosteller/Day Scholar', 'Hosteller / Day Scholar', 'hosteller/day_scholar', 'Residence', 'Hosteller Status', 'hosteller_status'], 'Day Scholar')).strip()
            
            sslc_pct = parse_float_safe(get_val(row, ['SSLC %', '10th %', 'SSLC Percentage', '10th Percentage', 'sslc_percentage', 'tenth_percentage']), 0.0)
            hsc_pct = parse_float_safe(get_val(row, ['HSC %', '12th %', 'HSC Percentage', '12th Percentage', 'hsc_percentage', 'twelfth_percentage']), 0.0)
            ug_pct = parse_float_safe(get_val(row, ['UG %', 'CGPA', 'UG Percentage', 'ug_percentage', 'cgpa']), 0.0)
            pg_pct = parse_float_safe(get_val(row, ['PG %', 'PG Percentage', 'pg_percentage']), None)
            diploma_pct = parse_float_safe(get_val(row, ['Diploma %', 'Diploma Percentage', 'diploma_percentage']), 0.0)
            
            curr_arr = parse_int_safe(get_val(row, ['Current Arrears', 'Arrears', 'current_arrears']), 0)
            hist_arr = parse_int_safe(get_val(row, ['History of Arrears', 'History Arrears', 'history_arrears']), 0)
            grad_year = parse_int_safe(get_val(row, ['Graduation Year', 'Batch', 'Year of Passing', 'graduation_year']), None)

            github_id = str(get_val(row, ['GitHub ID', 'GitHub', 'github_id'], '') or '').strip()
            linkedin_id = str(get_val(row, ['LinkedIn ID', 'LinkedIn', 'linkedin_id'], '') or '').strip()
            resume_link = str(get_val(row, ['Resume Link', 'Resume', 'resume_link'], '') or '').strip()
            self_intro_link = str(get_val(row, ['Self Intro Link', 'Self Intro Video', 'self_intro_link'], '') or '').strip()
            photo_link = str(get_val(row, ['Photo Link', 'Photo', 'photo_link'], '') or '').strip()
            portfolio_link = str(get_val(row, ['Portfolio Link', 'Portfolio', 'portfolio_link'], '') or '').strip()
            
            email = str(get_val(row, ['Email', 'Email Address', 'email'], '') or '').strip()
            phone = str(get_val(row, ['Mobile No', 'Mobile', 'Phone', 'Contact', 'mobile_no', 'phone'], '') or '').strip()

            placement_status = str(get_val(row, ['Placement Status', 'Status', 'placement_status'], 'Unplaced')).strip()
            placed_company = str(get_val(row, ['Placed Company', 'Company', 'placed_company'], '') or '').strip()
            salary_package = str(get_val(row, ['CTC (LPA)', 'Salary Package', 'CTC', 'salary_package'], '') or '').strip()
            remarks = str(get_val(row, ['Remarks', 'Notes', 'remarks'], '') or '').strip()

            if student:
                student.name = name
                student.department = dept
                student.gender = gender
                student.hosteller_status = hosteller
                student.sslc_percentage = sslc_pct
                student.hsc_percentage = hsc_pct
                student.ug_percentage = ug_pct
                student.pg_percentage = pg_pct
                student.diploma_percentage = diploma_pct
                student.current_arrears = curr_arr
                student.history_arrears = hist_arr
                student.graduation_year = grad_year
                student.github_id = github_id
                student.linkedin_id = linkedin_id
                student.resume_link = resume_link
                student.self_intro_link = self_intro_link
                student.photo_link = photo_link
                student.portfolio_link = portfolio_link
                student.email = email
                student.phone = phone
                student.placement_status = placement_status
                student.placed_company = placed_company
                student.salary_package = salary_package
                student.remarks = remarks
                updated_count += 1
            else:
                student = Student(
                    s_no=max_sno + added_count + 1,
                    reg_no=reg_no,
                    name=name,
                    department=dept,
                    gender=gender,
                    hosteller_status=hosteller,
                    sslc_percentage=sslc_pct,
                    hsc_percentage=hsc_pct,
                    ug_percentage=ug_pct,
                    pg_percentage=pg_pct,
                    diploma_percentage=diploma_pct,
                    current_arrears=curr_arr,
                    history_arrears=hist_arr,
                    graduation_year=grad_year,
                    github_id=github_id,
                    linkedin_id=linkedin_id,
                    resume_link=resume_link,
                    self_intro_link=self_intro_link,
                    photo_link=photo_link,
                    portfolio_link=portfolio_link,
                    email=email,
                    phone=phone,
                    placement_status=placement_status,
                    placed_company=placed_company,
                    salary_package=salary_package,
                    remarks=remarks
                )
                db.session.add(student)
                added_count += 1

        db.session.commit()
        return jsonify({
            'message': f'Successfully processed. Added {added_count} new records, updated {updated_count} existing records.',
            'added': added_count,
            'updated': updated_count
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] upload_excel failed: {traceback.format_exc()}")
        return jsonify({'error': 'Failed to process spreadsheet file', 'details': str(e)}), 500

@students_bp.route('/template', methods=['GET'])
def download_template():
    headers = [
        'S.No', 'Reg No', 'Name', 'Dept', 'Gender', 'Hosteller/Day Scholar',
        'SSLC %', 'HSC %', 'UG %', 'PG % (Optional)', 'Diploma %',
        'Current Arrears', 'History of Arrears', 'Graduation Year',
        'GitHub ID', 'LinkedIn ID', 'Resume Link', 'Self Intro Link',
        'Photo Link', 'Portfolio Link', 'Email', 'Mobile No',
        'Placement Status', 'Placed Company', 'CTC (LPA)', 'Remarks'
    ]
    df = pd.DataFrame(columns=headers)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Students')
    output.seek(0)

    return send_file(
        output,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name='Student_Upload_Template.xlsx'
    )
