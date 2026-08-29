import unittest
import json
from app import create_app
from app.extensions import db, bcrypt
from app.models import User
from app.routes.auth import seed_initial_users

class Step2CorrectionAuthTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()
            seed_initial_users()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_exact_12_initial_accounts(self):
        with self.app.app_context():
            users = User.query.all()
            self.assertEqual(len(users), 12)

            admins = [u for u in users if u.role == 'ADMIN']
            managers = [u for u in users if u.role == 'MANAGER']
            members = [u for u in users if u.role == 'MEMBER']

            self.assertEqual(len(admins), 1)
            self.assertEqual(len(managers), 1)
            self.assertEqual(len(members), 10)

            self.assertEqual(admins[0].email, 'admin@placement.in')
            self.assertEqual(managers[0].email, 'manager@placement.in')
            self.assertEqual(members[0].email, 'member1@placement.in')
            self.assertEqual(members[9].email, 'member10@placement.in')

    def test_bcrypt_password_storage(self):
        with self.app.app_context():
            admin = User.query.filter_by(email='admin@placement.in').first()
            self.assertIsNotNone(admin)
            self.assertNotEqual(admin.password_hash, 'admin@123')
            self.assertTrue(bcrypt.check_password_hash(admin.password_hash, 'admin@123'))

    def test_admin_login_success(self):
        res = self.client.post('/api/auth/login', json={
            'email': 'admin@placement.in',
            'password': 'admin@123'
        })
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn('token', data)
        self.assertEqual(data['user']['role'], 'ADMIN')
        self.assertEqual(data['user']['email'], 'admin@placement.in')

    def test_manager_login_success(self):
        res = self.client.post('/api/auth/login', json={
            'email': 'manager@placement.in',
            'password': 'manager@123'
        })
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn('token', data)
        self.assertEqual(data['user']['role'], 'MANAGER')

    def test_member1_login_success(self):
        res = self.client.post('/api/auth/login', json={
            'email': 'member1@placement.in',
            'password': 'member@123'
        })
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn('token', data)
        self.assertEqual(data['user']['role'], 'MEMBER')

    def test_member10_login_success(self):
        res = self.client.post('/api/auth/login', json={
            'email': 'member10@placement.in',
            'password': 'member@123'
        })
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn('token', data)
        self.assertEqual(data['user']['role'], 'MEMBER')

    def test_wrong_password_fail(self):
        res = self.client.post('/api/auth/login', json={
            'email': 'admin@placement.in',
            'password': 'wrongpassword'
        })
        self.assertEqual(res.status_code, 401)
        data = json.loads(res.data)
        self.assertEqual(data['error'], 'Invalid email or password.')

    def test_unknown_email_fail(self):
        res = self.client.post('/api/auth/login', json={
            'email': 'unknown@placement.in',
            'password': 'admin@123'
        })
        self.assertEqual(res.status_code, 401)
        data = json.loads(res.data)
        self.assertEqual(data['error'], 'Invalid email or password.')

    def test_old_placement_com_email_fail(self):
        res = self.client.post('/api/auth/login', json={
            'email': 'admin@placement.com',
            'password': 'admin@123'
        })
        self.assertEqual(res.status_code, 401)

if __name__ == '__main__':
    unittest.main()
