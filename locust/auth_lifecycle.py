import time
from locust import HttpUser, between, task
from common import PASSWORD, ProductionTrafficShape, auth_headers


class AuthLifecycle(HttpUser):
    wait_time = between(1, 3)

    @task
    def lifecycle(self):
        email = f"perf-{id(self)}-{time.time_ns()}@example.test"
        payload = {"email": email, "password": PASSWORD, "firstName": "Load", "lastName": "User"}
        with self.client.post("/api/auth/register", json=payload, headers=auth_headers(), name="POST /api/auth/register", catch_response=True) as response:
            if response.status_code != 201: response.failure(f"expected 201, got {response.status_code}")
        with self.client.post("/api/auth/login", json={"email": email, "password": PASSWORD}, headers=auth_headers(), name="POST /api/auth/login", catch_response=True) as response:
            if response.status_code != 200: response.failure(f"expected 200, got {response.status_code}")
            data = response.json() if response.status_code == 200 else {}
        refresh = data.get("tokens", {}).get("refreshToken")
        with self.client.post("/api/auth/refresh", json={"email": email, "password": PASSWORD, "refreshToken": refresh}, headers=auth_headers(), name="POST /api/auth/refresh", catch_response=True) as response:
            if response.status_code != 200: response.failure(f"expected 200, got {response.status_code}")
            elif response.json().get("tokens", {}).get("refreshToken"): refresh = response.json()["tokens"]["refreshToken"]
        with self.client.post("/api/auth/logout", json={"email": email, "password": PASSWORD, "refreshToken": refresh}, headers=auth_headers(), name="POST /api/auth/logout", catch_response=True) as response:
            if response.status_code != 200: response.failure(f"expected 200, got {response.status_code}")


class AuthShape(ProductionTrafficShape):
    peak_rate = 22
    production_users = 201
