import os
from datetime import timedelta
from dotenv import load_dotenv

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(BASE_DIR, '.env'))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'placement-portal-secret-key-2026')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'placement-portal-jwt-secret-2026')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    
    # Database Configuration - PostgreSQL / Supabase
    database_url = os.environ.get('DATABASE_URL')
    
    if database_url:
        # Supabase / cloud providers often use 'postgres://', fix for SQLAlchemy 1.4+ / 2.0+
        if database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
    else:
        # Fallback to postgres variables if set
        db_user = os.environ.get('POSTGRES_USER', 'postgres')
        db_pass = os.environ.get('POSTGRES_PASSWORD', 'postgres')
        db_host = os.environ.get('POSTGRES_HOST', 'localhost')
        db_port = os.environ.get('POSTGRES_PORT', '5432')
        db_name = os.environ.get('POSTGRES_DB', 'placement_portal')
        database_url = f"postgresql://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"
            
    SQLALCHEMY_DATABASE_URI = database_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
