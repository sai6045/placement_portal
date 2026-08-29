from app.extensions import bcrypt
from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt, jwt_required

def hash_password(password: str) -> str:
    """Hashes plain text password using bcrypt"""
    return bcrypt.generate_password_hash(password).decode('utf-8')

def check_password(password_hash: str, password: str) -> bool:
    """Verifies plain text password against bcrypt hash"""
    return bcrypt.check_password_hash(password_hash, password)

def role_required(*allowed_roles):
    """Decorator to enforce role authorization (ADMIN, MANAGER, MEMBER)"""
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            claims = get_jwt()
            user_role = claims.get('role', '')
            if user_role not in allowed_roles:
                return jsonify({'error': f'Access forbidden. Role must be one of: {allowed_roles}'}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator
