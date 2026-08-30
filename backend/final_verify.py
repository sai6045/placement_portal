import requests

BASE = 'http://localhost:5000/api'
print('=== FINAL VERIFICATION: ALL ACCOUNTS + EDGE CASES ===')

tests = [
    ('admin@placement.in', 'admin@123', 'ADMIN', True),
    ('manager@placement.in', 'manager@123', 'MANAGER', True),
    ('member1@placement.in', 'member@123', 'MEMBER', True),
    ('member10@placement.in', 'member@123', 'MEMBER', True),
    ('ADMIN@PLACEMENT.IN', 'admin@123', 'ADMIN', True),  # case-insensitive
    ('admin@placement.in', 'wrongpass', None, False),
    ('nobody@test.com', 'admin@123', None, False),
]

all_ok = True
for email, pwd, exp_role, should_pass in tests:
    r = requests.post(BASE + '/auth/login', json={'email': email, 'password': pwd}, timeout=5)
    d = r.json()
    if should_pass:
        got_role = d.get('user', {}).get('role', '')
        has_token = bool(d.get('token'))
        ok = r.status_code == 200 and got_role == exp_role and has_token
        label = 'OK' if ok else 'FAIL'
        print(f'  [{label}] {email} -> HTTP {r.status_code}, role={got_role}, token_ok={has_token}')
        if not ok:
            all_ok = False
    else:
        ok = r.status_code == 401
        label = 'OK' if ok else 'FAIL'
        print(f'  [{label}] {email} (wrong cred) -> HTTP {r.status_code} (expected 401)')
        if not ok:
            all_ok = False

print()
result = 'ALL TESTS PASSED' if all_ok else 'SOME TESTS FAILED'
print('=== ' + result + ' ===')
