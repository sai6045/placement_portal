import sys
sys.path.insert(0, '.')

from app import create_app
from app.extensions import db, bcrypt
from app.models import User

app = create_app()

print("=== LOGIN DIAGNOSIS ===")

with app.app_context():
    total = User.query.count()
    print(f"\nTotal users in Supabase: {total}")
    users = User.query.order_by(User.id).all()
    
    for u in users:
        prefix = u.password_hash[:20] if u.password_hash else "NULL"
        is_bcrypt = u.password_hash.startswith("$2") if u.password_hash else False
        print(f"  [{u.id}] {u.email} | role={u.role} | bcrypt={is_bcrypt} | hash_start={prefix}")

    print("\n=== PASSWORD VERIFICATION TEST ===")
    test_cases = [
        ("admin@placement.in", "admin@123"),
        ("manager@placement.in", "manager@123"),
        ("member1@placement.in", "member@123"),
        ("member10@placement.in", "member@123"),
    ]
    all_pass = True
    for email, pwd in test_cases:
        user = User.query.filter_by(email=email).first()
        if user is None:
            print(f"  FAIL: {email} -> USER NOT FOUND")
            all_pass = False
            continue
        try:
            result = bcrypt.check_password_hash(user.password_hash, pwd)
        except Exception as ex:
            result = False
            print(f"  ERROR checking {email}: {ex}")
        status = "PASS" if result else "FAIL (hash mismatch)"
        print(f"  {status}: {email} / {pwd}")
        if not result:
            all_pass = False
    
    print(f"\n=== RESULT: {'ALL PASS' if all_pass else 'SOME FAILED — FIX NEEDED'} ===")
