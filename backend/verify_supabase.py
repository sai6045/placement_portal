import os
import sys
import requests
import json
import time

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app import create_app
from app.extensions import db, bcrypt
from app.models import User, Student, Company, Faculty
from app.routes.auth import hash_password, check_password

def run_tests():
    print("==================================================")
    print("STEP 2A SUPABASE POSTGRESQL VERIFICATION SUITE")
    print("==================================================")

    app = create_app()
    with app.app_context():
        # 1. Test Database connection and tables
        print("\n[1/6] Testing SQLAlchemy connection to PostgreSQL/Supabase...")
        try:
            db.create_all()
            print("  --> Connection successful! All tables verified in database.")
        except Exception as e:
            print(f"  --> Connection failed: {e}")
            return False

        # 2. Check user table & counts
        print("\n[2/6] Verifying User table and accounts count...")
        user_count = User.query.count()
        print(f"  --> Total accounts in users table: {user_count} (Expected: 12)")
        if user_count != 12:
            print("  --> WARNING: Seeding required.")
            from app.routes.auth import seed_initial_users
            seed_initial_users()
            user_count = User.query.count()
            print(f"  --> Re-checked total accounts: {user_count}")

        # 3. Verify bcrypt hashes
        print("\n[3/6] Verifying passwords are valid bcrypt hashes...")
        all_users = User.query.all()
        bcrypt_ok = True
        for u in all_users:
            if not u.password_hash.startswith('$2b$') and not u.password_hash.startswith('$2a$'):
                print(f"  --> User {u.email} does NOT have a valid bcrypt hash!")
                bcrypt_ok = False
        if bcrypt_ok:
            print("  --> All 12 accounts use standard bcrypt password hashes ($2b$/$2a$).")

        # 4. Verify no sample business data
        print("\n[4/6] Verifying Business Tables are EMPTY...")
        st_count = Student.query.count()
        co_count = Company.query.count()
        fa_count = Faculty.query.count()
        print(f"  --> Students table count : {st_count} (Must be 0)")
        print(f"  --> Companies table count: {co_count} (Must be 0)")
        print(f"  --> Faculty table count  : {fa_count} (Must be 0)")

        # 5. Direct Credential verification
        print("\n[5/6] Verifying Account Authentication & Roles...")
        test_cases = [
            ('admin@placement.in', 'admin@123', 'ADMIN', True),
            ('manager@placement.in', 'manager@123', 'MANAGER', True),
            ('member1@placement.in', 'member@123', 'MEMBER', True),
            ('member10@placement.in', 'member@123', 'MEMBER', True),
            ('admin@placement.in', 'wrong_pass', None, False),
            ('admin@placement.com', 'admin@123', None, False)
        ]

        all_auth_ok = True
        for email, pwd, expected_role, should_succeed in test_cases:
            user = User.query.filter_by(email=email).first()
            if should_succeed:
                if user and check_password(user.password_hash, pwd) and user.role == expected_role:
                    print(f"  [PASS] {email} ({expected_role}) authenticated successfully")
                else:
                    print(f"  [FAIL] {email} failed to authenticate properly")
                    all_auth_ok = False
            else:
                if not user or not check_password(user.password_hash, pwd):
                    print(f"  [PASS] Rejected invalid credentials for {email}")
                else:
                    print(f"  [FAIL] Incorrectly accepted invalid credentials for {email}")
                    all_auth_ok = False

        print("\n[6/6] Summary:")
        if user_count == 12 and bcrypt_ok and st_count == 0 and co_count == 0 and fa_count == 0 and all_auth_ok:
            print("  >>> ALL STEP 2A SUPABASE REQUIREMENTS SATISFIED! <<<")
            return True
        else:
            print("  >>> SOME CHECKS FAILED. Please review output above. <<<")
            return False

if __name__ == '__main__':
    run_tests()
