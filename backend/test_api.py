import unittest
import json
import io
import pandas as pd
from app import create_app
from models import db, Student, Company, User

class PlacementPortalTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_seed_users(self):
        res = self.client.get('/api/auth/users')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        
        admins = [u for u in data if u['role'] == 'Admin']
        managers = [u for u in data if u['role'] == 'Manager']
        members = [u for u in data if u['role'] == 'Member']
        
        self.assertEqual(len(admins), 1)
        self.assertEqual(len(managers), 1)
        self.assertEqual(len(members), 10)

    def test_student_routes(self):
        # GET students (Main 6 columns table)
        res = self.client.get('/api/students/')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(len(data) > 0)
        
        first = data[0]
        # Verify main table summary columns present
        self.assertIn('s_no', first)
        self.assertIn('reg_no', first)
        self.assertIn('name', first)
        self.assertIn('department', first)
        self.assertIn('gender', first)
        self.assertIn('hosteller_status', first)

        # GET Full 18 Student fields via 'More'
        student_id = first['id']
        res_full = self.client.get(f'/api/students/{student_id}')
        self.assertEqual(res_full.status_code, 200)
        full_data = json.loads(res_full.data)
        self.assertIn('cgpa', full_data)
        self.assertIn('tenth_percentage', full_data)
        self.assertIn('placement_status', full_data)
        self.assertIn('salary_package', full_data)

    def test_excel_upload(self):
        # Generate test excel in memory
        df = pd.DataFrame([{
            'S.No': 99,
            'Reg No': 'TEST99999',
            'Name': 'Test Candidate',
            'Dept': 'CSE',
            'Gender': 'Female',
            'Hosteller/Day Scholar': 'Hosteller',
            'Email': 'test@example.com',
            'Phone': '9999999999',
            'CGPA': 9.0,
            '10th %': 90.0,
            '12th %': 90.0,
            'Diploma %': 0.0,
            'Current Arrears': 0,
            'History of Arrears': 0,
            'Placement Status': 'Placed',
            'Placed Company': 'Microsoft',
            'CTC (LPA)': '22.0 LPA',
            'Remarks': 'Test excel upload'
        }])
        
        file_bytes = io.BytesIO()
        with pd.ExcelWriter(file_bytes, engine='openpyxl') as writer:
            df.to_excel(writer, index=False)
        file_bytes.seek(0)
        
        data = {'file': (file_bytes, 'test_students.xlsx')}
        res = self.client.post('/api/students/upload', data=data, content_type='multipart/form-data')
        self.assertEqual(res.status_code, 200)
        
        # Verify student exists in DB
        res_search = self.client.get('/api/students/?search=TEST99999')
        search_data = json.loads(res_search.data)
        self.assertEqual(len(search_data), 1)

    def test_company_routes(self):
        # Add company from Faculty Members
        company_payload = {
            'name': 'Test Tech Corp',
            'industry': 'Artificial Intelligence',
            'status': 'Hot', # Cold / Warm / Hot / Drive Completed
            'contact_person': 'Jane Doe',
            'contact_email': 'jane@testtech.com',
            'package_offered': '15 LPA',
            'faculty_in_charge': 'Dr. M. Ramanathan'
        }
        res = self.client.post('/api/companies/', json=company_payload)
        self.assertEqual(res.status_code, 201)
        
        # Filter company by status
        res_list = self.client.get('/api/companies/?status=Hot')
        self.assertEqual(res_list.status_code, 200)
        companies = json.loads(res_list.data)
        self.assertTrue(any(c['name'] == 'Test Tech Corp' for c in companies))

if __name__ == '__main__':
    unittest.main()
