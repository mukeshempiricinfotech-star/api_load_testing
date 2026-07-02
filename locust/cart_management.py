from locust import HttpUser, between, task
from common import EMAIL, PASSWORD, ProductionTrafficShape, auth_headers, find_product


class CartManagement(HttpUser):
    wait_time = between(1, 3)

    @task
    def cart(self):
        login = self.client.post("/api/auth/login", json={"email": EMAIL, "password": PASSWORD}, headers=auth_headers(), name="POST /api/auth/login")
        data = login.json() if login.status_code == 200 else {}
        token = data.get("tokens", {}).get("accessToken")
        refresh = data.get("tokens", {}).get("refreshToken")
        product_id = find_product(self.client)
        if product_id:
            self.client.get(f"/api/products/{product_id}", headers=auth_headers(), name="GET /api/products/:id")
            self.client.get("/api/cart", headers=auth_headers(token), name="GET /api/cart")
            response = self.client.post("/api/cart/items", json={"productId": product_id, "quantity": 1}, headers=auth_headers(token), name="POST /api/cart/items")
            item_id = response.json().get("data", {}).get("id") if response.status_code == 201 else None
            if item_id: self.client.delete(f"/api/cart/items/{item_id}", headers=auth_headers(token), name="DELETE /api/cart/items/:id")
        if refresh: self.client.post("/api/auth/logout", json={"email": EMAIL, "password": PASSWORD, "refreshToken": refresh}, headers=auth_headers(), name="POST /api/auth/logout")


class CartShape(ProductionTrafficShape):
    peak_rate = 10
    production_users = 208
