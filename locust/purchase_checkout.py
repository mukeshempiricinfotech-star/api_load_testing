from locust import HttpUser, between, task
from common import EMAIL, PASSWORD, PAYMENT_METHOD_ID, ProductionTrafficShape, SEARCH_QUERY, auth_headers, find_product


class PurchaseCheckout(HttpUser):
    wait_time = between(1, 3)

    @task
    def purchase(self):
        login = self.client.post("/api/auth/login", json={"email": EMAIL, "password": PASSWORD}, headers=auth_headers(), name="POST /api/auth/login")
        data = login.json() if login.status_code == 200 else {}
        token = data.get("tokens", {}).get("accessToken"); refresh = data.get("tokens", {}).get("refreshToken")
        search = self.client.get("/api/products/search", params={"q": SEARCH_QUERY}, headers=auth_headers(), name="GET /api/products/search")
        products = search.json().get("data", []) if search.status_code == 200 else []
        product_id = products[0].get("id") if products else find_product(self.client)
        if not product_id: return
        self.client.get(f"/api/products/{product_id}", headers=auth_headers(), name="GET /api/products/:id")
        self.client.post("/api/cart/items", json={"productId": product_id, "quantity": 1}, headers=auth_headers(token), name="POST /api/cart/items")
        self.client.get("/api/cart", headers=auth_headers(token), name="GET /api/cart")
        order = self.client.post("/api/orders", json={"items": [{"productId": product_id, "quantity": 1}], "shippingAddress": {"name": "Load User", "line1": "1 Performance Way", "city": "Bengaluru", "region": "KA", "postalCode": "560001", "country": "IN"}}, headers=auth_headers(token), name="POST /api/orders")
        order_id = order.json().get("data", {}).get("id") if order.status_code == 201 else None
        if order_id: self.client.post("/api/checkout/payment", json={"orderId": order_id, "paymentMethodId": PAYMENT_METHOD_ID}, headers=auth_headers(token), name="POST /api/checkout/payment")
        self.client.get("/api/orders", headers=auth_headers(token), name="GET /api/orders")
        if refresh: self.client.post("/api/auth/logout", json={"email": EMAIL, "password": PASSWORD, "refreshToken": refresh}, headers=auth_headers(), name="POST /api/auth/logout")


class PurchaseShape(ProductionTrafficShape):
    peak_rate = 29
    production_users = 905
