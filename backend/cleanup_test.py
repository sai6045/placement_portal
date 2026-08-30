import sys
sys.path.insert(0, '.')
from app import create_app
from app.extensions import db
from app.models import Student

app = create_app()
with app.app_context():
    test_students = Student.query.filter(Student.reg_no.like('TEST%')).all()
    count = len(test_students)
    for s in test_students:
        db.session.delete(s)
    db.session.commit()
    print(f"Deleted {count} test students (TEST001-TEST004).")
    remaining = Student.query.count()
    print(f"Remaining students in DB: {remaining}")
