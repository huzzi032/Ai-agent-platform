import requests

print(requests.get('http://localhost:8000/api/health').json())

resp = requests.post('http://localhost:8000/api/auth/register', json={
    'email': 'test@example.com',
    'username': 'testuser',
    'password': 'password',
    'full_name': 'Test User'
})
print(resp.status_code, resp.text)
