import os
import io
import json
from app import create_app

from utils.db import db
from models.user import User
from models.transaction import Transaction
from services.categorizer_service import categorize
from services.parser_service import parse_csv
from utils.validators import parse_date


def run_tests():
    print("=" * 60)
    print("RUNNING PERSON 1 BACKEND & DATA VERIFICATION")
    print("=" * 60)

    # 1. Test Date Parser
    print("[1/5] Testing Date Parser...")
    d1 = parse_date("2026-08-01")
    d2 = parse_date("01/08/2026")
    d3 = parse_date("01-08-2026")
    assert str(d1) == "2026-08-01", f"Expected 2026-08-01, got {d1}"
    assert str(d2) == "2026-08-01", f"Expected 2026-08-01, got {d2}"
    assert str(d3) == "2026-08-01", f"Expected 2026-08-01, got {d3}"
    print("[PASS] Date parser passed for multiple formats.")

    # 2. Test Categorizer
    print("[2/5] Testing Categorizer Service...")
    cat, t_type = categorize("Swiggy Order #12345")
    assert cat == "Food & Dining" and t_type == "expense"

    cat, t_type = categorize("Salary credited for August 2026")
    assert cat == "Income" and t_type == "income"

    cat, t_type = categorize("Zerodha Mutual Fund SIP")
    assert cat == "Investments" and t_type == "expense"

    cat, t_type = categorize("Bescom bill payment")
    assert cat == "Utilities" and t_type == "expense"

    cat, t_type = categorize("Blinkit instant grocery delivery")
    assert cat == "Groceries" and t_type == "expense"
    print("[PASS] Categorizer service correctly mapped categories and types.")

    # 3. Test App and Database Initialization
    print("[3/5] Testing App Context & In-Memory / SQLite DB...")
    app = create_app()
    app.config["TESTING"] = True

    with app.app_context():
        db.drop_all()
        db.create_all()
        client = app.test_client()

        # 4. Test CSV Upload Route
        print("[4/5] Testing POST /api/upload endpoint...")
        sample_path = os.path.join(os.path.dirname(__file__), "data", "sample_statements", "realistic_salaried_statement.csv")
        with open(sample_path, "rb") as f:
            csv_content = f.read()

        data = {
            "file": (io.BytesIO(csv_content), "statement.csv")
        }
        res = client.post("/api/upload?user_id=1", data=data, content_type="multipart/form-data")
        assert res.status_code == 201, f"Upload failed: {res.get_json()}"
        res_json = res.get_json()
        assert res_json["status"] == "success"
        assert res_json["imported"] > 0
        print(f"[PASS] Statement uploaded successfully! Imported {res_json['imported']} transactions.")

        # Test Bank 2-column format upload
        bank_sample_path = os.path.join(os.path.dirname(__file__), "data", "sample_statements", "bank_format_statement.csv")
        with open(bank_sample_path, "rb") as f:
            bank_csv = f.read()
        res_bank = client.post("/api/upload?user_id=2", data={"file": (io.BytesIO(bank_csv), "bank.csv")}, content_type="multipart/form-data")
        assert res_bank.status_code == 201
        print(f"[PASS] Bank 2-column CSV parsed and uploaded successfully for user 2 ({res_bank.get_json()['imported']} transactions).")

        # 5. Test Dashboard API
        print("[5/5] Testing GET /api/dashboard endpoint...")
        dash_res = client.get("/api/dashboard?user_id=1")
        assert dash_res.status_code == 200
        dash = dash_res.get_json()

        print("\nDashboard Response Summary:")
        print(f" - Total Income: INR {dash['total_income']:,.2f}")
        print(f" - Total Expense: INR {dash['total_expense']:,.2f}")
        print(f" - Net Savings: INR {dash['net_savings']:,.2f}")
        print(f" - Savings Rate: {dash['savings_rate']}%")
        print(f" - Categories: {len(dash['category_breakdown'])}")
        print(f" - Monthly Trend records: {len(dash['monthly_trend'])}")
        print(f" - Recent Transactions: {len(dash['recent_transactions'])}")

        assert dash["total_income"] > 0
        assert dash["total_expense"] > 0
        assert len(dash["monthly_trend"]) == 3
        assert len(dash["category_breakdown"]) > 0

    print("\n" + "=" * 60)
    print("ALL PERSON 1 TASKS VERIFIED SUCCESSFULLY!")
    print("=" * 60)



if __name__ == "__main__":
    run_tests()
