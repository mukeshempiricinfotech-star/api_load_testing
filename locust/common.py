import math
import os
from locust import LoadTestShape

EMAIL = os.getenv("EMAIL", "buyer@example.test")
PASSWORD = os.getenv("PASSWORD", "load-test-password")
PAYMENT_METHOD_ID = os.getenv("PAYMENT_METHOD_ID", "pm_card_visa")
SEARCH_QUERY = os.getenv("SEARCH_QUERY", "shoe")
TEST_TYPE = os.getenv("TEST_TYPE", "smoke").lower()


def auth_headers(token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def find_product(client):
    configured = os.getenv("PRODUCT_ID")
    if configured:
        return configured
    response = client.get("/api/products", name="GET /api/products")
    try:
        return response.json().get("data", [{}])[0].get("id")
    except (ValueError, IndexError, AttributeError):
        return None


class ProductionTrafficShape(LoadTestShape):
    """Locust user schedule equivalent to config/load-profiles.json and k6/common.js."""

    peak_rate = 1
    production_users = 1

    def tick(self):
        t = self.get_run_time()
        p = self.production_users
        if TEST_TYPE == "smoke":
            return (1, 1) if t < 60 else None
        if TEST_TYPE == "load":
            if t < 600: return (max(1, math.ceil(p * t / 600)), max(1, math.ceil(p / 60)))
            if t < 2400: return (p, max(1, math.ceil(p / 60)))
            if t < 2700: return (max(1, math.ceil(p * (2700 - t) / 300)), max(1, math.ceil(p / 60)))
            return None
        if TEST_TYPE == "stress":
            if t < 300: return (max(1, math.ceil(p * t / 300)), max(1, math.ceil(p / 60)))
            for end, factor in ((900, 1), (1500, 1.5), (2100, 2)):
                if t < end: return (math.ceil(p * factor), max(1, math.ceil(p / 30)))
            return (max(1, math.ceil(p * (2400 - t) / 300)), max(1, math.ceil(p / 30))) if t < 2400 else None
        if TEST_TYPE == "spike":
            if t < 120: return (p, max(1, math.ceil(p / 30)))
            if t < 150: return (2 * p, max(1, math.ceil(p / 5)))
            if t < 450: return (2 * p, max(1, math.ceil(p / 15)))
            return (max(1, math.ceil(2 * p * (570 - t) / 120)), max(1, math.ceil(p / 15))) if t < 570 else None
        if TEST_TYPE == "soak":
            target = max(1, math.ceil(0.6 * p))
            if t < 600: return (max(1, math.ceil(target * t / 600)), max(1, math.ceil(p / 60)))
            if t < 7800: return (target, max(1, math.ceil(p / 60)))
            return (max(1, math.ceil(target * (8400 - t) / 600)), max(1, math.ceil(p / 60))) if t < 8400 else None
        if TEST_TYPE == "breakpoint":
            factors = (0.5, 1, 1.5, 2, 3, 4)
            stage = int(t // 300)
            if stage < len(factors): return (max(1, math.ceil(p * factors[stage])), max(1, math.ceil(p / 20)))
            return (max(1, math.ceil(4 * p * (1920 - t) / 120)), max(1, math.ceil(p / 20))) if t < 1920 else None
        raise RuntimeError("TEST_TYPE must be smoke, load, stress, spike, soak, or breakpoint")
