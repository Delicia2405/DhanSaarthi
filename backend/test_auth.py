from app import create_app
from models.user import User
from models.profile import Profile
from utils.db import db
from services.auth_service import generate_auth_token, verify_auth_token


def test_authentication():
    app = create_app()
    app.config["TESTING"] = True

    with app.app_context():
        db.drop_all()
        db.create_all()
        client = app.test_client()

        # 1. Test Signed Token Helpers
        print("[1/5] Testing Signed Token Helpers...")
        token = generate_auth_token(42)
        assert token is not None
        uid = verify_auth_token(token)
        assert uid == 42

        # Test invalid token
        assert verify_auth_token("invalid-token") is None
        print("[PASS] Token serialization/de-serialization working.")

        # 2. Test Registration Endpoint
        print("[2/5] Testing Registration Endpoint...")
        res = client.post("/api/auth/register", json={
            "name": "Alex Mercer",
            "email": "alex@dhansaarthi.demo",
            "password": "securepassword123"
        })
        assert res.status_code == 201
        data = res.get_json()
        assert data["status"] == "success"
        assert "token" in data
        assert data["user"]["email"] == "alex@dhansaarthi.demo"
        assert data["user"]["name"] == "Alex Mercer"

        # Test Duplicate Registration
        res_dup = client.post("/api/auth/register", json={
            "name": "Alex Mercer",
            "email": "alex@dhansaarthi.demo",
            "password": "anotherpassword"
        })
        assert res_dup.status_code == 400
        assert "error" in res_dup.get_json()
        print("[PASS] User registration and validation working.")

        # 3. Test Login Endpoint
        print("[3/5] Testing Login Endpoint...")
        res_login = client.post("/api/auth/login", json={
            "email": "alex@dhansaarthi.demo",
            "password": "securepassword123"
        })
        assert res_login.status_code == 200
        login_data = res_login.get_json()
        assert "token" in login_data
        assert login_data["user"]["name"] == "Alex Mercer"

        # Test Login Invalid Password
        res_wrong_pw = client.post("/api/auth/login", json={
            "email": "alex@dhansaarthi.demo",
            "password": "wrongpassword"
        })
        assert res_wrong_pw.status_code == 401

        # Test Login Non-existent User
        res_no_user = client.post("/api/auth/login", json={
            "email": "notfound@dhansaarthi.demo",
            "password": "securepassword123"
        })
        assert res_no_user.status_code == 401
        print("[PASS] User login authentication and credentials validation working.")

        # 4. Test Route Protection (GET /api/auth/me)
        print("[4/5] Testing Token Authentication Route Protection...")
        res_invalid_token = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid"})
        assert res_invalid_token.status_code == 401

        reg_token = data["token"]
        res_me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {reg_token}"})
        assert res_me.status_code == 200
        assert res_me.get_json()["user"]["email"] == "alex@dhansaarthi.demo"
        print("[PASS] /api/auth/me secured and returns current authenticated user.")

        # 5. Test Route Protection on protected APIs
        print("[5/5] Testing General API Route Security Protection...")
        # Invalid Token -> 401
        res_dash_invalid = client.get("/api/dashboard", headers={"Authorization": "Bearer invalid"})
        assert res_dash_invalid.status_code == 401

        # Valid Token -> 200
        res_dash_valid = client.get("/api/dashboard", headers={"Authorization": f"Bearer {reg_token}"})
        assert res_dash_valid.status_code == 200
        dash_data = res_dash_valid.get_json()
        assert dash_data["total_income"] == 0.0
        print("[PASS] Protected endpoints reject invalid sessions and authorize valid tokens.")

        print("\n============================================================\nAUTHENTICATION VERIFICATION TESTS PASSED SUCCESSFULLY!\n============================================================")


if __name__ == "__main__":
    test_authentication()
