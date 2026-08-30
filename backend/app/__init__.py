import os
from flask import Flask, jsonify, send_from_directory
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
    # Determine absolute path to frontend/dist
    BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    FRONTEND_DIST = os.path.abspath(os.path.join(BACKEND_DIR, "..", "frontend", "dist"))

    app = Flask(__name__, static_folder=None)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)

    # CORS: allow origins for both dev (localhost:3000, 5173) and production
    cors.init_app(app, resources={r"/api/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173", "*"],
        "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
    }})

    # Register API Blueprints
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

    @app.route('/api/test/extract-pdf', methods=['POST'])
    def test_extract_pdf():
        """Development endpoint to test PDF text extraction"""
        from flask import request
        from services.pdf_extractor import extract_pdf_text

        source = None
        if 'file' in request.files:
            source = request.files['file']
        elif 'pdf' in request.files:
            source = request.files['pdf']
        elif request.is_json:
            data = request.get_json() or {}
            source = data.get('path') or data.get('url') or data.get('file_path')

        if not source:
            return jsonify({
                'success': False,
                'page_count': 0,
                'error': 'Please provide a PDF file via multipart form or JSON path/url.'
            }), 400

        result = extract_pdf_text(source)
        if not result.get('success'):
            return jsonify({
                'success': False,
                'page_count': result.get('page_count', 0),
                'error': result.get('error', 'Unable to extract text from this PDF.')
            }), 400

        preview_len = min(500, len(result['text']))
        return jsonify({
            'success': True,
            'page_count': result.get('page_count', 0),
            'character_count': result.get('character_count', 0),
            'word_count': result.get('word_count', 0),
            'preview': result['text'][:preview_len]
        }), 200

    # Serve React SPA and static assets from frontend/dist
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        # Never intercept API routes with SPA fallback
        if path.startswith('api') or path.startswith('api/'):
            return jsonify({'error': 'API endpoint not found'}), 404

        # Serve static file if it exists in frontend/dist (e.g. assets/*, logo.jpg, favicon.ico)
        if path and os.path.exists(os.path.join(FRONTEND_DIST, path)):
            return send_from_directory(FRONTEND_DIST, path)

        # Fallback to index.html for React SPA client-side routing
        if os.path.exists(os.path.join(FRONTEND_DIST, 'index.html')):
            return send_from_directory(FRONTEND_DIST, 'index.html')

        # Fallback if frontend has not been built yet
        return jsonify({
            "status": "ok",
            "message": "Placement Portal API is running"
        }), 200

    # Auto-create tables and seed initial accounts
    with app.app_context():
        try:
            db.create_all()
            seed_initial_users()
        except Exception as e:
            print(f"Database initialization warning: {e}")

    return app
