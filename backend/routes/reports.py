from flask import Blueprint, jsonify
from app.extensions import db
from app.models import Student, Company, Faculty

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/summary', methods=['GET'])
def get_summary():
    total_students = Student.query.count()
    placed_students = Student.query.filter(Student.placement_status == 'Placed').count()
    unplaced_students = Student.query.filter(Student.placement_status == 'Unplaced').count()
    higher_studies = Student.query.filter(Student.placement_status == 'Higher Studies').count()
    entrepreneur = Student.query.filter(Student.placement_status == 'Entrepreneur').count()
    
    placement_percentage = round((placed_students / total_students * 100), 1) if total_students > 0 else 0.0
    
    total_companies = Company.query.count()
    cold_companies = Company.query.filter_by(status='Cold').count()
    warm_companies = Company.query.filter_by(status='Warm').count()
    hot_companies = Company.query.filter_by(status='Hot').count()
    drives_completed = Company.query.filter_by(status='Drive Completed').count()
    
    dept_stats = []
    departments = db.session.query(Student.department).distinct().all()
    for d in departments:
        dept_name = d[0]
        dept_total = Student.query.filter_by(department=dept_name).count()
        dept_placed = Student.query.filter_by(department=dept_name, placement_status='Placed').count()
        dept_pct = round((dept_placed / dept_total * 100), 1) if dept_total > 0 else 0.0
        dept_stats.append({
            'department': dept_name,
            'total': dept_total,
            'placed': dept_placed,
            'unplaced': dept_total - dept_placed,
            'placement_percentage': dept_pct
        })
        
    male_count = Student.query.filter_by(gender='Male').count()
    female_count = Student.query.filter_by(gender='Female').count()
    
    hosteller_count = Student.query.filter_by(hosteller_status='Hosteller').count()
    day_scholar_count = Student.query.filter_by(hosteller_status='Day Scholar').count()

    return jsonify({
        'overview': {
            'total_students': total_students,
            'placed_students': placed_students,
            'unplaced_students': unplaced_students,
            'higher_studies': higher_studies,
            'entrepreneur': entrepreneur,
            'placement_percentage': placement_percentage,
            'total_companies': total_companies,
            'drives_completed': drives_completed
        },
        'company_status_counts': {
            'Cold': cold_companies,
            'Warm': warm_companies,
            'Hot': hot_companies,
            'Drive Completed': drives_completed
        },
        'department_statistics': dept_stats,
        'demographics': {
            'gender': {'Male': male_count, 'Female': female_count},
            'residence': {'Hosteller': hosteller_count, 'Day Scholar': day_scholar_count}
        }
    }), 200
