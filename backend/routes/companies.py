import re
import traceback
from flask import Blueprint, request, jsonify
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
            # Validate URL format
            url_pattern = r'^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?(\?.*)?$'
            is_valid_url = bool(re.match(url_pattern, maps_link, re.IGNORECASE)) or maps_link.startswith('http://') or maps_link.startswith('https://') or 'maps.google' in maps_link or 'goo.gl' in maps_link or 'maps.app.goo.gl' in maps_link
            if not is_valid_url:
                errors['google_maps_link'] = 'Please enter a valid Google Maps location URL (e.g. https://maps.google.com/...).'

    # 4. Status (Engagement status)
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

    # 8. Employee Count
    emp_count_raw = data.get('employee_count') if data.get('employee_count') is not None else data.get('no_of_employees')
    if emp_count_raw is not None and str(emp_count_raw).strip() != '':
        try:
            emp_count = int(emp_count_raw)
            if emp_count < 0:
                errors['employee_count'] = 'Number of employees cannot be negative.'
        except (ValueError, TypeError):
            errors['employee_count'] = 'Number of employees must be a valid integer.'

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
                (Company.company_address.ilike(f'%{search}%')) |
                (Company.contact_person_number.ilike(f'%{search}%')) |
                (Company.contact_person_email.ilike(f'%{search}%'))
            )

        companies = query.order_by(Company.created_at.desc(), Company.id.desc()).all()
        return jsonify([c.to_dict() for c in companies]), 200
    except Exception as e:
        print(f"[ERROR] get_companies failed: {traceback.format_exc()}")
        return jsonify({'error': 'Failed to retrieve companies', 'details': str(e)}), 500

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
        
        emp_raw = data.get('employee_count') if data.get('employee_count') is not None else data.get('no_of_employees')
        emp_count = int(emp_raw) if (emp_raw is not None and str(emp_raw).strip() != '') else 0
        
        maps_link = str(data.get('google_maps_link') or data.get('company_address') or data.get('maps_link') or '').strip()
        status = str(data.get('status') or 'Cold').strip()
        
        # All new company submissions MUST default to PENDING approval
        approval_status = 'PENDING'
        
        # Metadata
        industry = str(data.get('industry') or 'Technology').strip()
        contact_person = str(data.get('contact_person') or '').strip()
        package = str(data.get('package_offered') or '').strip()
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
            employee_count=emp_count,
            google_maps_link=maps_link,
            company_address=maps_link,
            status=status,
            approval_status=approval_status,
            industry=industry,
            contact_person=contact_person,
            package_offered=package,
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
        
        # Validation
        errors = validate_company_payload(data, is_update=True)
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
        if 'employee_count' in data or 'no_of_employees' in data:
            emp_raw = data.get('employee_count') if data.get('employee_count') is not None else data.get('no_of_employees')
            company.employee_count = int(emp_raw) if (emp_raw is not None and str(emp_raw).strip() != '') else 0
        if 'google_maps_link' in data or 'company_address' in data or 'maps_link' in data:
            maps_link = str(data.get('google_maps_link') or data.get('company_address') or data.get('maps_link')).strip()
            company.google_maps_link = maps_link
            company.company_address = maps_link
        if 'status' in data:
            company.status = str(data['status']).strip()
        if 'industry' in data:
            company.industry = str(data['industry']).strip()
        if 'contact_person' in data:
            company.contact_person = str(data['contact_person']).strip()
        if 'package_offered' in data:
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
