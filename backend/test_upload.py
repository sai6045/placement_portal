"""
Test the new student Excel upload endpoint:
1. Simulate an Excel file with the new column headers (same as 100_Students_List.xlsx sheet 1)
2. Include a fake title row before the headers
3. Include a second sheet (which must be ignored)
4. Verify: correct columns mapped, Hostel→Hosteller, status normalized, second sheet ignored
"""
import sys, io
sys.path.insert(0, '.')

import pandas as pd
import requests

BASE = 'http://localhost:5000/api'

def make_test_excel():
    """Build a test Excel that mimics 100_Students_List.xlsx"""
    # SHEET 1: Students Directory with a title row + header row + data rows
    sheet1_title = pd.DataFrame([
        ['Students Directory (100)', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ])
    sheet1_headers = ['Roll No', 'Name', 'Department', 'Gender', 'Student Type',
                      'SSLC %', 'HSC %', 'UG %', 'PG %', 'GitHub ID', 'Resume Link',
                      'LinkedIn ID', 'Graduation Date', 'Portfolio', 'Personal Email ID',
                      'College Email ID', 'Mobile No', 'Student Photo', 'Placement Status']
    sheet1_data = pd.DataFrame([
        ['TEST001', 'Alice Test',     'CSE', 'Female', 'Hostel',    82.5, 79.0, 88.5, '', 'github.com/alice', '', 'linkedin.com/alice', '2024', '', 'alice@gmail.com', 'alice@rathinam.in', '9876543210', '', 'Yet to be Placed'],
        ['TEST002', 'Bob Test',       'IT',  'Male',   'Day Scholar', 77.0, 80.5, 75.0, '', '', '', '', 'May 2024', '', 'bob@gmail.com', '', '9876543211', '', 'YET TO BE PLACED'],
        ['TEST003', 'Charlie Test',   'ECE', 'Male',   'Hostel',    88.0, 91.0, 85.0, None, '', '', '', '2024-05-15', '', '', 'charlie@rathinam.in', '', '', 'PLACED'],
        # Blank row (should be skipped)
        ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['TEST004', 'Diana Test',     'EEE', 'Female', 'HOSTELITE', 70.0, 72.0, 78.0, 83.5, '', '', '', '2025', '', 'diana@gmail.com', '', '9876543213', '', ''],
    ], columns=sheet1_headers)

    # SHEET 2: Placements & Drives (must be IGNORED by the importer)
    sheet2_data = pd.DataFrame([
        {'Student': 'Alice Test', 'Company': 'Microsoft', 'CTC': '18 LPA', 'Date': '2024-01-01'},
    ])

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        # Write title row and header+data with no pandas header (manual)
        ws_name = 'Students Directory (100)'
        # Write title
        empty_row = pd.DataFrame([['']*len(sheet1_headers)])
        empty_row.to_excel(writer, sheet_name=ws_name, index=False, header=False, startrow=0)
        # Write header + data
        sheet1_data.to_excel(writer, sheet_name=ws_name, index=False, header=True, startrow=1)
        # Write second sheet
        sheet2_data.to_excel(writer, sheet_name='Placements & Drives (100)', index=False)

    output.seek(0)
    return output.getvalue()

print("=== STUDENT UPLOAD ENDPOINT TEST ===\n")

# 1. Get pre-import student count
r = requests.post(BASE + '/auth/login', json={'email': 'admin@placement.in', 'password': 'admin@123'})
token = r.json().get('token', '')
headers_auth = {'Authorization': f'Bearer {token}'}

r = requests.get(BASE + '/students/', headers=headers_auth)
pre_count = len(r.json())
print(f"Pre-import student count: {pre_count}")

# 2. Build and send test Excel
excel_bytes = make_test_excel()
files = {'file': ('100_Students_Test.xlsx', excel_bytes, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
r = requests.post(BASE + '/students/upload', files=files, headers=headers_auth)

print(f"\nUpload HTTP status: {r.status_code}")
data = r.json()
print(f"Response: {data}")

if r.status_code == 200:
    print(f"\n  Added: {data.get('added')}")
    print(f"  Updated: {data.get('updated')}")
    print(f"  Skipped: {data.get('skipped')}")
    print(f"  Errors: {data.get('errors')}")
    stats = data.get('stats', {})
    print(f"  Stats: {stats}")

# 3. Post-import: verify student data
r2 = requests.get(BASE + '/students/', headers=headers_auth)
all_students = r2.json()
post_count = len(all_students)
print(f"\nPost-import student count: {post_count} (added {post_count - pre_count} net)")

# Verify the test students
test_students = [s for s in all_students if s.get('reg_no', '').startswith('TEST')]
print(f"\nTest students found: {len(test_students)}")
for s in test_students:
    print(f"  {s['reg_no']} | {s['name']} | hosteller={s.get('hosteller_status')} | status={s.get('placement_status')}")

# 4. Verify second sheet was NOT imported as placement records
# (TEST001 was marked 'Yet to be Placed' in Excel -- and sheet 2 says she's placed at Microsoft)
# She should be YET_TO_BE_PLACED, not PLACED
alice = next((s for s in test_students if s.get('reg_no') == 'TEST001'), None)
if alice:
    expected_status = 'YET_TO_BE_PLACED'
    actual_status = alice.get('placement_status', '')
    status_ok = actual_status == expected_status
    print(f"\n  Alice status check: expected={expected_status}, got={actual_status} -> {'PASS' if status_ok else 'FAIL'}")

# TEST003 said PLACED in Excel but has no company_id -- should be PLACED (explicitly said PLACED)
charlie = next((s for s in test_students if s.get('reg_no') == 'TEST003'), None)
if charlie:
    actual = charlie.get('placement_status', '')
    print(f"  Charlie status (PLACED in Excel): got={actual} (PLACED=safe since explicitly marked)")

# 5. Verify Hostel → Hosteller normalization
hostel_students = [s for s in test_students if s.get('reg_no') in ('TEST001', 'TEST003', 'TEST004')]
for s in hostel_students:
    hs = s.get('hosteller_status', '')
    ok = hs == 'Hosteller'
    print(f"  {s['reg_no']} hosteller_status={hs} -> {'PASS' if ok else 'FAIL (expected Hosteller)'}")

print("\n=== TEMPLATE DOWNLOAD TEST ===")
r3 = requests.get(BASE + '/students/template')
print(f"Template HTTP status: {r3.status_code}")
print(f"Content-Disposition: {r3.headers.get('Content-Disposition', 'N/A')}")
print(f"Content-Type: {r3.headers.get('Content-Type', 'N/A')}")
if r3.status_code == 200:
    tpl = pd.read_excel(io.BytesIO(r3.content), sheet_name=0)
    print(f"Template columns: {list(tpl.columns)}")
    print(f"Template rows (should be 0): {len(tpl)}")

print("\n=== DONE ===")
