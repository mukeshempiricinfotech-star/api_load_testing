from locust import HttpUser, between, task
from common import ProductionTrafficShape, SEARCH_QUERY, auth_headers, find_product


class BrowseDiscovery(HttpUser):
    wait_time = between(2, 5)

    @task
    def browse(self):
        self.client.get("/health", name="GET /health")
        product_id = find_product(self.client)
        self.client.get("/api/products/search", params={"q": SEARCH_QUERY}, headers=auth_headers(), name="GET /api/products/search")
        if product_id:
            self.client.get(f"/api/products/{product_id}", headers=auth_headers(), name="GET /api/products/:id")
            self.client.get(f"/api/products/{product_id}/reviews", headers=auth_headers(), name="GET /api/products/:id/reviews")


class BrowseShape(ProductionTrafficShape):
    peak_rate = 33
    production_users = 515
