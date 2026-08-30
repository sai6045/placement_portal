from flask import Blueprint, jsonify, request
from app.extensions import db
from app.models import Student, Company, Faculty

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/summary', methods=['GET'])
def get_summary():
    try:
        # Load all students and companies in just 2 queries instead of 35+ sequential queries
        all_students = Student.query.order_by(Student.s_no.asc(), Student.id.asc()).all()
        all_comps = Company.query.all()

        total_students = len(all_students)
        placed_records = [s for s in all_students if s.get_norm_placement_status() == 'PLACED']
        placed_students = len(placed_records)
        unplaced_students = total_students - placed_students

        placement_percentage = round((placed_students / total_students * 100), 1) if total_students > 0 else 0.0

        # CTC list from placed records
        ctc_list = []
        for s in placed_records:
            if s.placed_ctc_lpa is not None and s.placed_ctc_lpa > 0:
                ctc_list.append(s.placed_ctc_lpa)
            elif s.salary_package and 'LPA' in s.salary_package.upper():
                try:
                    val = float(s.salary_package.upper().replace('LPA', '').replace('L', '').strip())
                    if val > 0:
                        ctc_list.append(val)
                except Exception:
                    pass

        avg_ctc = round(sum(ctc_list) / len(ctc_list), 2) if ctc_list else 0.0
        highest_ctc = round(max(ctc_list), 2) if ctc_list else 0.0

        # Company counts
        total_companies = len(all_comps)
        status_counts = {'Cold': 0, 'Warm': 0, 'Hot': 0, 'Drive Completed': 0}
        total_hiring_capacity = 0
        for c in all_comps:
            st = c.status or 'Cold'
            status_counts[st] = status_counts.get(st, 0) + 1
            total_hiring_capacity += (c.no_of_hirings or c.employee_count or 0)

        # Department statistics
        dept_dict = {}
        male_count = 0
        female_count = 0
        hosteller_count = 0
        day_scholar_count = 0

        for s in all_students:
            # Demographics
            if s.gender == 'Male':
                male_count += 1
            elif s.gender == 'Female':
                female_count += 1

            h_status = (s.hosteller_status or s.hosteller_day_scholar or '').strip()
            if h_status == 'Hosteller':
                hosteller_count += 1
            elif h_status == 'Day Scholar':
                day_scholar_count += 1

            # Dept aggregation
            d = (s.department or s.dept or '').strip()
            if not d:
                continue
            if d not in dept_dict:
                dept_dict[d] = {'total': 0, 'placed': 0, 'ctcs': []}
            dept_dict[d]['total'] += 1
            if s.get_norm_placement_status() == 'PLACED':
                dept_dict[d]['placed'] += 1
                if s.placed_ctc_lpa is not None and s.placed_ctc_lpa > 0:
                    dept_dict[d]['ctcs'].append(s.placed_ctc_lpa)

        dept_stats = []
        for dept_name, val in sorted(dept_dict.items()):
            d_total = val['total']
            d_placed = val['placed']
            d_pct = round((d_placed / d_total * 100), 1) if d_total > 0 else 0.0
            d_ctcs = val['ctcs']
            d_avg = round(sum(d_ctcs) / len(d_ctcs), 2) if d_ctcs else 0.0
            d_max = round(max(d_ctcs), 2) if d_ctcs else 0.0

            dept_stats.append({
                'department': dept_name,
                'total': d_total,
                'placed': d_placed,
                'unplaced': d_total - d_placed,
                'placement_percentage': d_pct,
                'avg_ctc': d_avg,
                'highest_ctc': d_max
            })

        student_records = [s.to_full_dict() for s in all_students]

        return jsonify({
            'overview': {
                'total_students': total_students,
                'placed_students': placed_students,
                'unplaced_students': unplaced_students,
                'placement_percentage': placement_percentage,
                'total_companies': total_companies,
                'drives_completed': status_counts.get('Drive Completed', 0),
                'total_hiring_capacity': total_hiring_capacity,
                'total_actual_placements': placed_students,
                'average_ctc': avg_ctc,
                'highest_ctc': highest_ctc
            },
            'company_status_counts': {
                'Cold': status_counts.get('Cold', 0),
                'Warm': status_counts.get('Warm', 0),
                'Hot': status_counts.get('Hot', 0),
                'Drive Completed': status_counts.get('Drive Completed', 0)
            },
            'department_statistics': dept_stats,
            'demographics': {
                'gender': {'Male': male_count, 'Female': female_count},
                'residence': {'Hosteller': hosteller_count, 'Day Scholar': day_scholar_count}
            },
            'students': student_records
        }), 200

    except Exception as e:
        return jsonify({'error': 'Failed to calculate live report statistics', 'details': str(e)}), 500
