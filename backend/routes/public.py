import traceback
from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import Company, Student, CompanyRegistration

public_bp = Blueprint('public', __name__)

@public_bp.route('/company-registration/<token>', methods=['GET'])
def get_public_registration_info(token):
    """
    Public endpoint to get basic company details for registration.
    Accessible by students without login.
    Validates token exists, company is APPROVED, and registration is ACTIVE.
    """
    try:
        if not token or not token.strip():
            return jsonify({'error': 'Registration token is required.'}), 400

        company = Company.query.filter_by(registration_token=token.strip()).first()
        if not company:
            return jsonify({'error': 'Invalid or expired company registration link.'}), 404

        if company.approval_status != 'APPROVED':
            return jsonify({'error': 'Registration unavailable until company is approved.'}), 403

        if company.registration_link_status != 'ACTIVE':
            return jsonify({'error': 'Registration link is currently inactive for this company.'}), 403

        return jsonify({
            'valid': True,
            'company': {
                'id': company.id,
                'name': company.name,
                'job_title': company.job_title or company.industry or 'Software Engineer',
                'ctc_lpa': company.ctc_lpa,
                'location': company.location or 'N/A',
                'status': company.status,
                'jd_summary': company.jd_summary or company.remarks or '',
                'has_jd': bool(company.jd_file_path or company.jd_pdf_link),
                'website': company.website or '',
                'registered_count': company.get_registered_students_count()
            }
        }), 200

    except Exception as e:
        print(f"[ERROR] get_public_registration_info failed: {traceback.format_exc()}")
        return jsonify({'error': 'Failed to retrieve company details', 'details': str(e)}), 500


@public_bp.route('/company-registration/<token>/lookup', methods=['POST'])
def lookup_student_for_registration(token):
    """
    Public endpoint to verify student existence and pre-fill form.
    Checks whether student already exists in the Student database.
    If found: returns student info.
    If already registered: returns 'You have already registered for this company.'
    If NOT found: returns 'Student record not found. Please contact the Placement Team.'
    """
    try:
        company = Company.query.filter_by(registration_token=token.strip()).first()
        if not company:
            return jsonify({'error': 'Invalid or expired company registration link.'}), 404

        if company.approval_status != 'APPROVED' or company.registration_link_status != 'ACTIVE':
            return jsonify({'error': 'Registration is currently inactive for this company.'}), 403

        data = request.get_json() or {}
        reg_no = str(data.get('reg_no') or '').strip()

        if not reg_no:
            return jsonify({'error': 'Please enter your Registration Number / Roll No.'}), 400

        # Exact / case-insensitive search in existing students database
        student = Student.query.filter(Student.reg_no.ilike(reg_no)).first()
        if not student:
            return jsonify({
                'error': 'Student record not found. Please contact the Placement Team.',
                'not_found': True
            }), 404

        # Check duplicate registration for this company
        existing_reg = CompanyRegistration.query.filter_by(
            company_id=company.id,
            student_id=student.id
        ).first()

        if existing_reg:
            return jsonify({
                'error': 'You have already registered for this company.',
                'already_registered': True,
                'student_name': student.name,
                'registered_at': existing_reg.registered_at.strftime('%Y-%m-%d %H:%M:%S') if existing_reg.registered_at else ''
            }), 400

        # Return student profile for pre-filling
        return jsonify({
            'found': True,
            'student': {
                'id': student.id,
                'reg_no': student.reg_no,
                'name': student.name,
                'department': student.department or student.dept or '',
                'gender': student.gender or '',
                'student_type': student.hosteller_status or student.hosteller_day_scholar or 'Day Scholar',
                'email': student.email or '',
                'phone': student.phone or '',
                'resume_link': student.resume_link or '',
                'linkedin_id': student.linkedin_id or '',
                'github_id': student.github_id or '',
                'portfolio_link': student.portfolio_link or '',
                'placement_status': student.get_norm_placement_status()
            }
        }), 200

    except Exception as e:
        print(f"[ERROR] lookup_student_for_registration failed: {traceback.format_exc()}")
        return jsonify({'error': 'Failed to verify student', 'details': str(e)}), 500


@public_bp.route('/company-registration/<token>', methods=['POST'])
def submit_company_registration(token):
    """
    Public endpoint for a student to submit their company drive registration.
    Saves registration in company_registrations table.
    Enforces unique constraint (1 registration per student per company).
    Does NOT modify student placement status (remains YET TO BE PLACED).
    """
    try:
        company = Company.query.filter_by(registration_token=token.strip()).first()
        if not company:
            return jsonify({'error': 'Invalid or expired company registration link.'}), 404

        if company.approval_status != 'APPROVED' or company.registration_link_status != 'ACTIVE':
            return jsonify({'error': 'Registration is currently inactive for this company.'}), 403

        data = request.get_json() or {}
        reg_no = str(data.get('reg_no') or '').strip()

        if not reg_no:
            return jsonify({'error': 'Registration Number is required.'}), 400

        student = Student.query.filter(Student.reg_no.ilike(reg_no)).first()
        if not student:
            return jsonify({
                'error': 'Student record not found. Please contact the Placement Team.',
                'not_found': True
            }), 404

        # Duplicate registration check
        existing_reg = CompanyRegistration.query.filter_by(
            company_id=company.id,
            student_id=student.id
        ).first()

        if existing_reg:
            return jsonify({
                'error': 'You have already registered for this company.',
                'already_registered': True
            }), 400

        # Optional updated contact / resume information
        resume_link = str(data.get('resume_link') or student.resume_link or '').strip()
        email = str(data.get('email') or student.email or '').strip()
        mobile = str(data.get('phone') or data.get('mobile') or student.phone or '').strip()

        # Update student record contact details if provided
        if resume_link and not student.resume_link:
            student.resume_link = resume_link
        if email and not student.email:
            student.email = email
        if mobile and not student.phone:
            student.phone = mobile

        registration = CompanyRegistration(
            company_id=company.id,
            student_id=student.id,
            registration_status='REGISTERED',
            resume_link=resume_link,
            registered_email=email,
            registered_mobile=mobile
        )

        db.session.add(registration)
        db.session.commit()

        return jsonify({
            'message': 'Registration successful!',
            'company_name': company.name,
            'student_name': student.name,
            'reg_no': student.reg_no,
            'registered_at': registration.registered_at.strftime('%Y-%m-%d %H:%M:%S')
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] submit_company_registration failed: {traceback.format_exc()}")
        return jsonify({'error': 'Failed to complete registration. Please try again.', 'details': str(e)}), 500
