import requests
import json

URL = "http://localhost:8000/api/careers/recruiters/search"
HEADERS = {
    "x-pebel-user-id": "test-user-id",
    "x-pebel-user-email": "test@example.com",
    "x-internal-service-key": "change-me",
    "Content-Type": "application/json"
}
PAYLOAD = {
    "query_terms": ["hiring"],
    "limit": 1
}

try:
    print(f"Connecting to {URL}...")
    response = requests.post(URL, headers=HEADERS, json=PAYLOAD, timeout=60)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
