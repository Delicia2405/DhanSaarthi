from app import create_app
from models.user import User
from models.goal import Goal
from utils.db import db
from services.auth_service import generate_auth_token


def test_security_hardening():
    app = create_app()
    app.config["TESTING"] = True

    with app.app_context():
        db.drop_all()
        db.create_all()
        client = app.test_client()

        # 1. Test Input Schema Validation - Email formats
        print("[1/5] Testing email validation formats...")
        res = client.post("/api/auth/register", json={
            "name": "Bob Vance",
            "email": "invalid_email_format",
            "password": "securepassword123"
        })
        assert res.status_code == 400
        assert "Invalid email format" in res.get_json()["error"]
        print("[PASS] Malformed email rejected.")

        # 2. Test Input Schema Validation - Password length
        print("[2/5] Testing password length validator...")
        res = client.post("/api/auth/register", json={
            "name": "Bob Vance",
            "email": "bob@vance.demo",
            "password": "short"
        })
        assert res.status_code == 400
        assert "Password must be at least 8 characters long" in res.get_json()["error"]
        print("[PASS] Insecure short password rejected.")

        # Register a valid user for subsequent tests
        res_valid = client.post("/api/auth/register", json={
            "name": "Bob Vance",
            "email": "bob@vance.demo",
            "password": "securepassword123"
        })
        assert res_valid.status_code == 201
        token = res_valid.get_json()["token"]

        # 3. Test Business Logic Security - Block Negative Goal Amounts
        print("[3/5] Testing business logic input bounds on goals...")
        res_goal = client.post("/api/goals", json={
            "name": "Emergency Cushion",
            "target_amount": -5000,
            "target_date": "2027-12-31",
            "saved_amount": 100
        }, headers={"Authorization": f"Bearer {token}"})
        assert res_goal.status_code == 400
        assert "Target amount must be at least 1.0" in res_goal.get_json()["error"]

        res_goal2 = client.post("/api/goals", json={
            "name": "Emergency Cushion",
            "target_amount": 15000,
            "target_date": "2027-12-31",
            "saved_amount": -50
        }, headers={"Authorization": f"Bearer {token}"})
        assert res_goal2.status_code == 400
        assert "Saved amount must be at least 0.0" in res_goal2.get_json()["error"]
        print("[PASS] Business logic bounds correctly protect against negative values.")

        # 4. Test Sliding-Window Rate Limiting
        print("[4/5] Testing sliding-window rate limiting...")
        # Registration and Login are limited to 5 requests per 60 seconds
        # Let's trigger 5 login requests rapidly
        for _ in range(5):
            res_lim = client.post("/api/auth/login", json={
                "email": "bob@vance.demo",
                "password": "securepassword123"
            })

        # The 6th request should hit the rate limiter and return 429
        res_limit_hit = client.post("/api/auth/login", json={
            "email": "bob@vance.demo",
            "password": "securepassword123"
        })
        assert res_limit_hit.status_code == 429
        assert "Too many requests" in res_limit_hit.get_json()["error"]
        print("[PASS] Rate limiter correctly throttled excessive brute-force requests.")

        # 5. Test Global Exception Handler (Sanitization)
        print("[5/5] Testing global exception handler sanitization...")
        res_404 = client.get("/api/non-existent-route")
        assert res_404.status_code == 404
        assert res_404.get_json()["status"] == "error"
        assert "Traceback" not in res_404.text
        print("[PASS] Global error handler correctly sanitizes output error structures.")

        print("\n============================================================\nSECURITY HARDENING VERIFICATION TESTS PASSED SUCCESSFULLY!\n============================================================")


if __name__ == "__main__":
    test_security_hardening()
