import re
import io
from datetime import datetime
import traceback
import pandas as pd
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.extensions import db
from app.models import Company, User

companies_bp = Blueprint('companies', __name__)

COMPANY_STATUSES = ['Cold', 'Warm', 'Hot', 'Drive Completed']
APPROVAL_STATUSES = ['PENDING', 'APPROVED', 'REJECTED']

def get_current_user_role():
    """Helper to get authenticated user role from JWT claims or Database"""
    try:
        claims = get_jwt()
        if claims and 'role' in claims:
            return claims['role']
    except Exception:
        pass

    try:
        user_id = get_jwt_identity()
        if user_id:
            user = db.session.get(User, int(user_id))
            if user:
                return user.role
    except Exception:
        pass

    return None

def get_current_user_display():
    """Helper to get authenticated user display string (Name (ROLE))"""
    try:
        user_id = get_jwt_identity()
        if user_id:
            user = db.session.get(User, int(user_id))
            if user:
                return f"{user.name} ({user.role})"
    except Exception:
        pass
    return "Faculty Member"

def validate_company_payload(data, is_update=False):
    errors = {}
    
    # 1. Company Name
    name = str(data.get('company_name') or data.get('name') or '').strip()
    if not is_update or ('company_name' in data or 'name' in data):
        if not name:
            errors['company_name'] = 'Company name is required.'

    # 2. Location (City / Region text)
    location = str(data.get('location') or '').strip()
    if not is_update or 'location' in data:
        if not location:
            errors['location'] = 'Location is required.'

    # 3. Google Maps Location Link (Required URL)
    maps_link = str(data.get('google_maps_link') or data.get('company_address') or data.get('maps_link') or '').strip()
    if not is_update or ('google_maps_link' in data or 'company_address' in data or 'maps_link' in data):
        if not maps_link:
            errors['google_maps_link'] = 'Google Maps Location Link is required.'
        else:
            url_pattern = r'^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?(\?.*)?$'
            is_valid_url = bool(re.match(url_pattern, maps_link, re.IGNORECASE)) or maps_link.startswith('http://') or maps_link.startswith('https://') or 'maps.google' in maps_link or 'goo.gl' in maps_link or 'maps.app.goo.gl' in maps_link
            if not is_valid_url:
                errors['google_maps_link'] = 'Please enter a valid Google Maps location URL (e.g. https://maps.google.com/...).'

    # 4. Relationship Status
    status = str(data.get('status') or 'Cold').strip()
    if not is_update or 'status' in data:
        if status not in COMPANY_STATUSES:
            errors['status'] = f'Status must be one of: {", ".join(COMPANY_STATUSES)}.'

    # 5. Website validation if provided
    website = str(data.get('website') or '').strip()
    if website:
        if not (website.startswith('http://') or website.startswith('https://') or '.' in website):
            errors['website'] = 'Please enter a valid website URL.'

    # 6. Contact Person Email validation if provided
    email = str(data.get('contact_person_email') or data.get('contact_person_mail') or data.get('contact_email') or '').strip()
    if email:
        email_pattern = r'^[^@\s]+@[^@\s]+\.[^@\s]+$'
        if not re.match(email_pattern, email):
            errors['contact_person_email'] = 'Please enter a valid contact email address.'

    # 7. Contact Person Phone validation if provided
    phone = str(data.get('contact_person_number') or data.get('contact_phone') or '').strip()
    if phone:
        digits_only = re.sub(r'\D', '', phone)
        if len(digits_only) < 7 or len(digits_only) > 15:
            errors['contact_person_number'] = 'Please enter a valid contact phone number (7-15 digits).'

    # 8. No. of Hirings (Required integer >= 0)
    hirings_raw = data.get('no_of_hirings') if data.get('no_of_hirings') is not None else data.get('employee_count')
    hirings_val = 0
    if not is_update or ('no_of_hirings' in data or 'employee_count' in data):
        if hirings_raw is None or str(hirings_raw).strip() == '':
            errors['no_of_hirings'] = 'Number of hirings is required.'
        else:
            try:
                hirings_val = int(hirings_raw)
                if hirings_val < 0:
                    errors['no_of_hirings'] = 'Number of hirings cannot be negative.'
            except (ValueError, TypeError):
                errors['no_of_hirings'] = 'Number of hirings must be a valid integer.'

    # 9. CTC (LPA) (Required numeric > 0)
    ctc_raw = data.get('ctc_lpa') if data.get('ctc_lpa') is not None else data.get('ctc')
    if not is_update or ('ctc_lpa' in data or 'ctc' in data):
        if ctc_raw is None or str(ctc_raw).strip() == '':
            errors['ctc_lpa'] = 'CTC (LPA) is required.'
        else:
            try:
                ctc_val = float(ctc_raw)
                if ctc_val <= 0:
                    errors['ctc_lpa'] = 'CTC (LPA) must be greater than 0.'
            except (ValueError, TypeError):
                errors['ctc_lpa'] = 'CTC (LPA) must be a valid number (e.g. 4.5, 6.0, 12.0).'

    # 10. No. of Placed Students (Required ONLY when status == 'Drive Completed')
    if status == 'Drive Completed':
        placed_raw = data.get('placed_students')
        if not is_update or 'placed_students' in data or status == 'Drive Completed':
            if placed_raw is None or str(placed_raw).strip() == '':
                errors['placed_students'] = 'Number of placed students is required for Drive Completed.'
            else:
                try:
                    placed_val = int(placed_raw)
                    if placed_val < 0:
                        errors['placed_students'] = 'Placed students cannot be negative.'
                    elif 'no_of_hirings' not in errors and placed_val > hirings_val:
                        errors['placed_students'] = 'Placed students cannot exceed the number of hirings.'
                except (ValueError, TypeError):
                    errors['placed_students'] = 'Placed students must be a valid integer.'

    return errors

@companies_bp.route('/', methods=['GET'])
def get_companies():
    try:
        status = request.args.get('status')
        approval_status = request.args.get('approval_status')
        search = request.args.get('search')

        query = Company.query
        if status:
            query = query.filter(Company.status == status)
        if approval_status:
            query = query.filter(Company.approval_status == approval_status.upper())
        if search:
            query = query.filter(
                (Company.name.ilike(f'%{search}%')) |
                (Company.location.ilike(f'%{search}%')) |
                (Company.google_maps_link.ilike(f'%{search}%')) |
                (Company.contact_person_number.ilike(f'%{search}%')) |
                (Company.contact_person_email.ilike(f'%{search}%'))
            )

        companies = query.order_by(Company.created_at.desc(), Company.id.desc()).all()
        return jsonify([c.to_dict() for c in companies]), 200
    except Exception as e:
        print(f"[ERROR] get_companies failed: {traceback.format_exc()}")
        return jsonify({'error': 'Failed to retrieve companies', 'details': str(e)}), 500

@companies_bp.route('/template', methods=['GET'])
def download_company_template():
    """Download blank Excel template for Company Details"""
    try:
        headers = [
            'S.No', 'Company Name', 'Location', 'Website', 'Contact Person Number',
            'Contact Person Mail', 'No. of Hirings', 'CTC (LPA)', 'Relationship Status',
            'Approval Status', 'Google Maps Location Link', 'No. of Placed Students', 'Created Date'
        ]
        df = pd.DataFrame(columns=headers)
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Companies')
        output.seek(0)

        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name='Company_Details_Template.xlsx'
        )
    except Exception as e:
        print(f"[ERROR] download_company_template failed: {traceback.format_exc()}")
        return jsonify({'error': 'Failed to generate company template', 'details': str(e)}), 500

@companies_bp.route('/export', methods=['GET'])
@jwt_required()
def export_companies():
    """Export filtered company details to Excel (.xlsx)"""
    try:
        status = request.args.get('status')
        approval_status = request.args.get('approval_status')
        search = request.args.get('search')

        query = Company.query
        if status and status.strip() and status != 'ALL':
            query = query.filter(Company.status == status.strip())
        if approval_status and approval_status.strip() and approval_status != 'ALL':
            query = query.filter(Company.approval_status == approval_status.strip().upper())
        if search and search.strip():
            query = query.filter(
                (Company.name.ilike(f'%{search.strip()}%')) |
                (Company.location.ilike(f'%{search.strip()}%')) |
                (Company.google_maps_link.ilike(f'%{search.strip()}%')) |
                (Company.contact_person_number.ilike(f'%{search.strip()}%')) |
                (Company.contact_person_email.ilike(f'%{search.strip()}%'))
            )

        companies = query.order_by(Company.created_at.desc(), Company.id.desc()).all()

        if not companies:
            return jsonify({'error': 'No company data available to export.'}), 404

        # Prepare 13 columns
        rows = []
        for idx, comp in enumerate(companies, start=1):
            created_str = comp.created_at.strftime('%Y-%m-%d') if comp.created_at else ''
            is_completed = (comp.status == 'Drive Completed')
            placed_val = comp.placed_students if is_completed and comp.placed_students is not None else ''

            rows.append({
                'S.No': idx,
                'Company Name': comp.name,
                'Location': comp.location or 'N/A',
                'Website': comp.website or '',
                'Contact Person Number': comp.contact_person_number or comp.contact_phone or '',
                'Contact Person Mail': comp.contact_person_email or comp.contact_email or '',
                'No. of Hirings': comp.no_of_hirings if comp.no_of_hirings is not None else (comp.employee_count or 0),
                'CTC (LPA)': comp.ctc_lpa if comp.ctc_lpa is not None else '',
                'Relationship Status': comp.status,
                'Approval Status': comp.approval_status or 'PENDING',
                'Google Maps Location Link': comp.google_maps_link or comp.company_address or '',
                'No. of Placed Students': placed_val,
                'Created Date': created_str
            })

        df = pd.DataFrame(rows)
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Companies')
        output.seek(0)

        filename = f"Company_Details_{datetime.utcnow().strftime('%Y-%m-%d')}.xlsx"
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=filename
        )

    except Exception as e:
        print(f"[ERROR] export_companies failed: {traceback.format_exc()}")
        return jsonify({'error': 'Failed to export company details', 'details': str(e)}), 500

@companies_bp.route('/import', methods=['POST'])
@jwt_required()
def import_companies():
    """Import company details from Excel (.xlsx) file with full validation"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded. Please provide an Excel (.xlsx) file.'}), 400

    file = request.files['file']
    filename = file.filename.lower()

    if not (filename.endswith('.xlsx') or filename.endswith('.xls')):
        return jsonify({'error': 'Invalid file format. Please upload an Excel (.xlsx) file.'}), 400

    try:
        df = pd.read_excel(file)
        if df.empty:
            return jsonify({'error': 'The uploaded Excel file is empty.'}), 400

        df.columns = [str(c).strip() for c in df.columns]

        def get_val(row, possible_keys, default=None):
            for key in possible_keys:
                for col in row.index:
                    if str(col).strip().lower() == str(key).strip().lower():
                        val = row[col]
                        if pd.notna(val):
                            return val
            return default

        companies_to_insert = []
        user_display = get_current_user_display()

        for idx, row in df.iterrows():
            row_num = idx + 2 # Excel row number considering header is row 1

            # 1. Company Name
            name = str(get_val(row, ['Company Name', 'Company', 'Name', 'company_name'], '') or '').strip()
            if not name:
                return jsonify({'error': f"Row {row_num}: Company Name is required."}), 400

            # 2. Location
            location = str(get_val(row, ['Location', 'City', 'location'], '') or '').strip()
            if not location:
                return jsonify({'error': f"Row {row_num}: Location is required."}), 400

            # 3. Google Maps Link
            maps_link = str(get_val(row, ['Google Maps Location Link', 'Google Maps Link', 'Maps Link', 'google_maps_link', 'company_address'], '') or '').strip()
            if not maps_link:
                return jsonify({'error': f"Row {row_num}: Google Maps Location Link is required."}), 400
            
            url_pattern = r'^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?(\?.*)?$'
            is_valid_map = bool(re.match(url_pattern, maps_link, re.IGNORECASE)) or maps_link.startswith('http://') or maps_link.startswith('https://') or 'maps.google' in maps_link or 'goo.gl' in maps_link or 'maps.app.goo.gl' in maps_link
            if not is_valid_map:
                return jsonify({'error': f"Row {row_num}: Please provide a valid Google Maps URL."}), 400

            # 4. Website
            website = str(get_val(row, ['Website', 'Website URL', 'website'], '') or '').strip()
            if website and not (website.startswith('http://') or website.startswith('https://') or '.' in website):
                return jsonify({'error': f"Row {row_num}: Invalid website URL."}), 400

            # 5. Contact Person Number
            phone = str(get_val(row, ['Contact Person Number', 'Contact Number', 'Contact Phone', 'Phone', 'contact_person_number', 'contact_phone'], '') or '').strip()
            if phone:
                digits_only = re.sub(r'\D', '', phone)
                if len(digits_only) < 7 or len(digits_only) > 15:
                    return jsonify({'error': f"Row {row_num}: Contact Person Number must be 7-15 digits."}), 400

            # 6. Contact Person Mail
            email = str(get_val(row, ['Contact Person Mail', 'Contact Email', 'Email', 'contact_person_email', 'contact_email'], '') or '').strip()
            if email:
                email_pattern = r'^[^@\s]+@[^@\s]+\.[^@\s]+$'
                if not re.match(email_pattern, email):
                    return jsonify({'error': f"Row {row_num}: Invalid contact email address."}), 400

            # 7. No. of Hirings
            hirings_raw = get_val(row, ['No. of Hirings', 'No of Hirings', 'Hirings', 'Hiring Target', 'no_of_hirings', 'employee_count'], None)
            if hirings_raw is None or str(hirings_raw).strip() == '':
                return jsonify({'error': f"Row {row_num}: Number of Hirings is required."}), 400
            try:
                hirings_val = int(float(str(hirings_raw).strip()))
                if hirings_val < 0:
                    return jsonify({'error': f"Row {row_num}: Number of Hirings cannot be negative."}), 400
            except (ValueError, TypeError):
                return jsonify({'error': f"Row {row_num}: Number of Hirings must be an integer."}), 400

            # 8. CTC (LPA)
            ctc_raw = get_val(row, ['CTC (LPA)', 'CTC', 'CTC LPA', 'Package', 'ctc_lpa', 'package_offered'], None)
            if ctc_raw is None or str(ctc_raw).strip() == '':
                return jsonify({'error': f"Row {row_num}: CTC (LPA) is required."}), 400
            try:
                ctc_clean = str(ctc_raw).upper().replace('LPA', '').replace('L', '').strip()
                ctc_val = float(ctc_clean)
                if ctc_val <= 0:
                    return jsonify({'error': f"Row {row_num}: CTC must be greater than 0."}), 400
            except (ValueError, TypeError):
                return jsonify({'error': f"Row {row_num}: CTC (LPA) must be a valid number (e.g. 6.5, 12.0)."}), 400

            # 9. Relationship Status
            status_raw = str(get_val(row, ['Relationship Status', 'Status', 'status'], 'Cold') or 'Cold').strip()
            # Normalize casing
            matched_status = None
            for valid_s in COMPANY_STATUSES:
                if valid_s.lower() == status_raw.lower():
                    matched_status = valid_s
                    break
            if not matched_status:
                return jsonify({'error': f"Row {row_num}: Invalid Relationship Status '{status_raw}'. Allowed: {', '.join(COMPANY_STATUSES)}."}), 400

            # 10. No. of Placed Students
            placed_val = 0
            if matched_status == 'Drive Completed':
                placed_raw = get_val(row, ['No. of Placed Students', 'No of Placed Students', 'Placed Students', 'Placed', 'placed_students'], None)
                if placed_raw is None or str(placed_raw).strip() == '':
                    return jsonify({'error': f"Row {row_num}: No. of Placed Students is required for Drive Completed."}), 400
                try:
                    placed_val = int(float(str(placed_raw).strip()))
                    if placed_val < 0:
                        return jsonify({'error': f"Row {row_num}: Placed students cannot be negative."}), 400
                    if placed_val > hirings_val:
                        return jsonify({'error': f"Row {row_num}: Placed students ({placed_val}) cannot exceed the number of hirings ({hirings_val})."}), 400
                except (ValueError, TypeError):
                    return jsonify({'error': f"Row {row_num}: Placed students must be an integer."}), 400
            else:
                placed_val = 0

            # Security: Always assign PENDING approval status, ignoring uploaded status
            approval_status = 'PENDING'

            comp = Company(
                name=name,
                location=location,
                website=website,
                contact_person_number=phone,
                contact_person_email=email,
                no_of_hirings=hirings_val,
                employee_count=hirings_val,
                ctc_lpa=ctc_val,
                package_offered=f"{ctc_val} LPA",
                placed_students=placed_val,
                google_maps_link=maps_link,
                company_address=maps_link,
                status=matched_status,
                approval_status=approval_status,
                created_by_user=user_display
            )
            companies_to_insert.append(comp)

        # Batch insert all verified rows
        for comp in companies_to_insert:
            db.session.add(comp)

        db.session.commit()
        count = len(companies_to_insert)
        return jsonify({
            'message': f"{count} companies imported successfully and submitted for admin approval.",
            'count': count
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] import_companies failed: {traceback.format_exc()}")
        return jsonify({'error': f"Failed to import Excel file: {str(e)}"}), 500

@companies_bp.route('/<int:company_id>', methods=['GET'])
def get_company(company_id):
    try:
        company = db.session.get(Company, company_id)
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        return jsonify(company.to_dict()), 200
    except Exception as e:
        print(f"[ERROR] get_company failed: {traceback.format_exc()}")
        return jsonify({'error': 'Failed to retrieve company', 'details': str(e)}), 500

@companies_bp.route('/', methods=['POST'])
def add_company():
    try:
        data = request.get_json() or {}
        
        # Validation
        errors = validate_company_payload(data, is_update=False)
        if errors:
            first_err = next(iter(errors.values()))
            return jsonify({'error': first_err, 'validation_errors': errors}), 400

        name = str(data.get('company_name') or data.get('name') or '').strip()
        location = str(data.get('location') or '').strip()
        website = str(data.get('website') or '').strip()
        phone = str(data.get('contact_person_number') or data.get('contact_phone') or '').strip()
        email = str(data.get('contact_person_email') or data.get('contact_person_mail') or data.get('contact_email') or '').strip()
        
        hirings_raw = data.get('no_of_hirings') if data.get('no_of_hirings') is not None else data.get('employee_count')
        no_of_hirings = int(hirings_raw) if (hirings_raw is not None and str(hirings_raw).strip() != '') else 0
        
        ctc_raw = data.get('ctc_lpa') if data.get('ctc_lpa') is not None else data.get('ctc')
        ctc_lpa = float(ctc_raw) if (ctc_raw is not None and str(ctc_raw).strip() != '') else None
        
        maps_link = str(data.get('google_maps_link') or data.get('company_address') or data.get('maps_link') or '').strip()
        status = str(data.get('status') or 'Cold').strip()
        
        placed_raw = data.get('placed_students')
        placed_students = int(placed_raw) if (status == 'Drive Completed' and placed_raw is not None and str(placed_raw).strip() != '') else 0
        
        # All new company submissions MUST default to PENDING approval
        approval_status = 'PENDING'
        
        # Metadata
        industry = str(data.get('industry') or 'Technology').strip()
        contact_person = str(data.get('contact_person') or '').strip()
        package_offered = f"{ctc_lpa} LPA" if ctc_lpa is not None else str(data.get('package_offered') or '').strip()
        drive_date = str(data.get('drive_date') or '').strip()
        remarks = str(data.get('remarks') or '').strip()
        faculty_in_charge = str(data.get('faculty_in_charge') or 'Unassigned').strip()
        created_by_user = str(data.get('created_by_user') or 'Faculty User').strip()

        company = Company(
            name=name,
            location=location,
            website=website,
            contact_person_number=phone,
            contact_person_email=email,
            no_of_hirings=no_of_hirings,
            employee_count=no_of_hirings,
            ctc_lpa=ctc_lpa,
            placed_students=placed_students,
            google_maps_link=maps_link,
            company_address=maps_link,
            status=status,
            approval_status=approval_status,
            industry=industry,
            contact_person=contact_person,
            package_offered=package_offered,
            drive_date=drive_date,
            remarks=remarks,
            faculty_in_charge=faculty_in_charge,
            created_by_user=created_by_user
        )

        db.session.add(company)
        db.session.commit()
        return jsonify({
            'message': 'Company submitted for admin approval.',
            'company': company.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] add_company failed: {traceback.format_exc()}")
        return jsonify({'error': 'Unable to save company. Please try again.', 'details': str(e)}), 500

@companies_bp.route('/<int:company_id>', methods=['PUT'])
def update_company(company_id):
    try:
        company = db.session.get(Company, company_id)
        if not company:
            return jsonify({'error': 'Company not found'}), 404

        data = request.get_json() or {}
        
        # Merge existing fields with incoming data for cross-field validation
        merged = company.to_dict()
        merged.update(data)
        
        # Validation
        errors = validate_company_payload(merged, is_update=True)
        if errors:
            first_err = next(iter(errors.values()))
            return jsonify({'error': first_err, 'validation_errors': errors}), 400

        if 'company_name' in data or 'name' in data:
            company.name = str(data.get('company_name') or data.get('name')).strip()
        if 'location' in data:
            company.location = str(data['location']).strip()
        if 'website' in data:
            company.website = str(data['website']).strip()
        if 'contact_person_number' in data or 'contact_phone' in data:
            company.contact_person_number = str(data.get('contact_person_number') or data.get('contact_phone')).strip()
        if 'contact_person_email' in data or 'contact_person_mail' in data or 'contact_email' in data:
            company.contact_person_email = str(data.get('contact_person_email') or data.get('contact_person_mail') or data.get('contact_email')).strip()
        if 'no_of_hirings' in data or 'employee_count' in data:
            hirings_raw = data.get('no_of_hirings') if data.get('no_of_hirings') is not None else data.get('employee_count')
            company.no_of_hirings = int(hirings_raw) if (hirings_raw is not None and str(hirings_raw).strip() != '') else 0
            company.employee_count = company.no_of_hirings
        if 'ctc_lpa' in data or 'ctc' in data:
            ctc_raw = data.get('ctc_lpa') if data.get('ctc_lpa') is not None else data.get('ctc')
            company.ctc_lpa = float(ctc_raw) if (ctc_raw is not None and str(ctc_raw).strip() != '') else None
            company.package_offered = f"{company.ctc_lpa} LPA" if company.ctc_lpa is not None else 'N/A'
        if 'google_maps_link' in data or 'company_address' in data or 'maps_link' in data:
            maps_link = str(data.get('google_maps_link') or data.get('company_address') or data.get('maps_link')).strip()
            company.google_maps_link = maps_link
            company.company_address = maps_link
        if 'status' in data:
            company.status = str(data['status']).strip()
        if 'placed_students' in data:
            if company.status == 'Drive Completed':
                placed_raw = data.get('placed_students')
                company.placed_students = int(placed_raw) if (placed_raw is not None and str(placed_raw).strip() != '') else 0
            else:
                company.placed_students = 0
        elif 'status' in data and company.status != 'Drive Completed':
            company.placed_students = 0
            
        if 'industry' in data:
            company.industry = str(data['industry']).strip()
        if 'contact_person' in data:
            company.contact_person = str(data['contact_person']).strip()
        if 'package_offered' in data and 'ctc_lpa' not in data:
            company.package_offered = str(data['package_offered']).strip()
        if 'drive_date' in data:
            company.drive_date = str(data['drive_date']).strip()
        if 'remarks' in data:
            company.remarks = str(data['remarks']).strip()
        if 'faculty_in_charge' in data:
            company.faculty_in_charge = str(data['faculty_in_charge']).strip()

        db.session.commit()
        return jsonify({'message': 'Company updated successfully', 'company': company.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] update_company failed: {traceback.format_exc()}")
        return jsonify({'error': 'Unable to update company. Please try again.', 'details': str(e)}), 500

@companies_bp.route('/<int:company_id>/approve', methods=['PATCH', 'PUT'])
@jwt_required()
def approve_company(company_id):
    """Admin exclusive endpoint to approve a company"""
    role = get_current_user_role()
    if role != 'ADMIN':
        return jsonify({'error': 'Forbidden: Only Admin has authority to approve companies.'}), 403

    try:
        company = db.session.get(Company, company_id)
        if not company:
            return jsonify({'error': 'Company not found'}), 404

        company.approval_status = 'APPROVED'
        db.session.commit()
        return jsonify({
            'message': f'Company "{company.name}" has been approved successfully.',
            'company': company.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] approve_company failed: {traceback.format_exc()}")
        return jsonify({'error': 'Unable to approve company. Please try again.', 'details': str(e)}), 500

@companies_bp.route('/<int:company_id>/reject', methods=['PATCH', 'PUT'])
@jwt_required()
def reject_company(company_id):
    """Admin exclusive endpoint to reject a company"""
    role = get_current_user_role()
    if role != 'ADMIN':
        return jsonify({'error': 'Forbidden: Only Admin has authority to reject companies.'}), 403

    try:
        company = db.session.get(Company, company_id)
        if not company:
            return jsonify({'error': 'Company not found'}), 404

        company.approval_status = 'REJECTED'
        db.session.commit()
        return jsonify({
            'message': f'Company "{company.name}" has been rejected.',
            'company': company.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] reject_company failed: {traceback.format_exc()}")
        return jsonify({'error': 'Unable to reject company. Please try again.', 'details': str(e)}), 500

@companies_bp.route('/<int:company_id>', methods=['DELETE'])
def delete_company(company_id):
    try:
        company = db.session.get(Company, company_id)
        if not company:
            return jsonify({'error': 'Company not found'}), 404
            
        db.session.delete(company)
        db.session.commit()
        return jsonify({'message': 'Company deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] delete_company failed: {traceback.format_exc()}")
        return jsonify({'error': 'Unable to delete company. Please try again.', 'details': str(e)}), 500
