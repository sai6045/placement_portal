from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from app.extensions import db
from app.models import User
from app.utils.auth import hash_password, check_password

auth_bp = Blueprint('auth', __name__)

def seed_initial_users():
    """Seed exactly 12 initial accounts with @placement.in emails and bcrypt hashed passwords"""
    # Clean up old testing accounts if any exist with @placement.com
    old_users = User.query.filter(User.email.like('%@placement.com')).all()
    if old_users:
        for u in old_users:
            db.session.delete(u)
        db.session.commit()

    # Ensure the 12 required accounts exist
    target_users = [
        {'name': 'Placement Director', 'email': 'admin@placement.in', 'password': 'admin@123', 'role': 'ADMIN'},
        {'name': 'Placement Manager', 'email': 'manager@placement.in', 'password': 'manager@123', 'role': 'MANAGER'},
    ]

    for i in range(1, 11):
        target_users.append({
            'name': f'Faculty Member {i}',
            'email': f'member{i}@placement.in',
            'password': 'member@123',
            'role': 'MEMBER'
        })

    for u_info in target_users:
        existing = User.query.filter_by(email=u_info['email']).first()
        if not existing:
            new_user = User(
                name=u_info['name'],
                email=u_info['email'],
                password_hash=hash_password(u_info['password']),
                role=u_info['role']
            )
            db.session.add(new_user)
        else:
            # Update password hash and role to guarantee exact credentials match
            existing.name = u_info['name']
            existing.password_hash = hash_password(u_info['password'])
            existing.role = u_info['role']

    db.session.commit()

@auth_bp.route('/login', methods=['POST'])
def login():
    """POST /api/auth/login: Authenticates user email & password, returns JWT token & user profile"""
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Invalid email or password.'}), 401

    user = User.query.filter_by(email=email).first()

    if not user or not check_password(user.password_hash, password):
        return jsonify({'error': 'Invalid email or password.'}), 401

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={
            'role': user.role,
            'email': user.email,
            'name': user.name
        }
    )

    return jsonify({
        'token': access_token,
        'user': {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role
        }
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict()), 200
