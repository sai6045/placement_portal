import os
import sys

# Ensure backend directory is in path
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app import create_app
from app.extensions import db
from app.models import User, Student, Company, Faculty
from app.routes.auth import seed_initial_users

def seed_database():
    app = create_app()
    with app.app_context():
        print("Connecting to database...")
        db_uri = app.config['SQLALCHEMY_DATABASE_URI']
        # Mask password in log
        masked_uri = db_uri
        if '@' in db_uri and ':' in db_uri:
            prefix = db_uri.split('@')[0]
            host_part = db_uri.split('@')[1]
            if ':' in prefix:
                scheme_user = prefix.rsplit(':', 1)[0]
                masked_uri = f"{scheme_user}:****@{host_part}"
        print(f"Database URI: {masked_uri}")

        print("Creating all tables in database...")
        db.create_all()

        print("Seeding 12 authentication accounts...")
        seed_initial_users()

        # Ensure no sample business data exists
        student_count = Student.query.count()
        company_count = Company.query.count()
        faculty_count = Faculty.query.count()
        user_count = User.query.count()

        print("\n=== DATABASE SUMMARY ===")
        print(f"Users table: {user_count} accounts (Target: 12)")
        print(f"Students table: {student_count} records (Target: 0)")
        print(f"Companies table: {company_count} records (Target: 0)")
        print(f"Faculties table: {faculty_count} records (Target: 0)")

        print("\n=== SEEDED ACCOUNTS ===")
        for u in User.query.order_by(User.id).all():
            print(f"  [{u.role}] {u.email} ({u.name})")

        print("\nDatabase initialization and seeding completed successfully!")

if __name__ == '__main__':
    seed_database()
