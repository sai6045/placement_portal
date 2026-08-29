from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User

auth_bp = Blueprint('auth', __name__)

def seed_users_if_needed():
    """Seed 1 Admin, 1 Manager, and 10 Members if database is empty"""
    if User.query.first() is None:
        users_to_seed = []
        
        # 1 Admin
        admin = User(
            username='admin',
            role='Admin',
            full_name='Dr. K. Placement Director (Admin)',
            email='admin@placement.edu'
        )
        admin.set_password('admin123')
        users_to_seed.append(admin)
        
        # 1 Manager
        manager = User(
            username='manager',
            role='Manager',
            full_name='Prof. R. Placement Manager',
            email='manager@placement.edu'
        )
        manager.set_password('manager123')
        users_to_seed.append(manager)
        
        # 10 Members (Faculty / Coordinators)
        for i in range(1, 11):
            member = User(
                username=f'member{i}',
                role='Member',
                full_name=f'Faculty Member {i}',
                email=f'member{i}@placement.edu'
            )
            member.set_password(f'member123')
            users_to_seed.append(member)
            
        db.session.add_all(users_to_seed)
        db.session.commit()

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
        
    user = User.query.filter_by(username=username).first()
    
    if user and user.check_password(password):
        access_token = create_access_token(identity={'id': user.id, 'username': user.username, 'role': user.role})
        return jsonify({
            'message': 'Login successful',
            'token': access_token,
            'user': user.to_dict()
        }), 200
        
    return jsonify({'error': 'Invalid credentials'}), 401

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    identity = get_jwt_identity()
    user = User.query.get(identity['id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict()), 200

@auth_bp.route('/users', methods=['GET'])
def get_all_users():
    """List seeded users for easy toggle in demo"""
    seed_users_if_needed()
    users = User.query.order_by(User.id).all()
    return jsonify([u.to_dict() for u in users]), 200
