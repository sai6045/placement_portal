import os
from flask import Flask, jsonify
from dotenv import load_dotenv
from config import Config
from app.extensions import db, jwt, bcrypt, cors
from app.routes.auth import auth_bp, seed_initial_users
from routes.students import students_bp
from routes.companies import companies_bp
from routes.faculties import faculties_bp
from routes.reports import reports_bp
from routes.public import public_bp

# Load environment variables from .env file
load_dotenv()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)

    # CORS: allow all origins for both dev and production
    cors.init_app(app, resources={r"/api/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000", "*"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }})

    # Register Blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(students_bp, url_prefix='/api/students')
    app.register_blueprint(companies_bp, url_prefix='/api/companies')
    app.register_blueprint(faculties_bp, url_prefix='/api/faculties')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(public_bp, url_prefix='/api/public')

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'app': 'Placement Portal API',
            'database': app.config['SQLALCHEMY_DATABASE_URI'].split('://')[0]
        }), 200

    # Auto-create tables and seed initial accounts
    with app.app_context():
        try:
            db.create_all()
            seed_initial_users()
        except Exception as e:
            print(f"Database initialization warning: {e}")

    return app
