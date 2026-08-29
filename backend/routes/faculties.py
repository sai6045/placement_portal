from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import Faculty

faculties_bp = Blueprint('faculties', __name__)

@faculties_bp.route('/', methods=['GET'])
def get_faculties():
    faculties = Faculty.query.all()
    return jsonify([f.to_dict() for f in faculties]), 200

@faculties_bp.route('/', methods=['POST'])
def add_faculty():
    data = request.get_json() or {}
    if not data.get('name') or not data.get('department'):
        return jsonify({'error': 'Name and Department are required'}), 400

    faculty = Faculty(
        name=data.get('name'),
        department=data.get('department'),
        designation=data.get('designation', 'Assistant Professor'),
        email=data.get('email', ''),
        phone=data.get('phone', ''),
        role_in_placement=data.get('role_in_placement', 'Coordinator')
    )
    db.session.add(faculty)
    db.session.commit()
    return jsonify({'message': 'Faculty added', 'faculty': faculty.to_dict()}), 201
