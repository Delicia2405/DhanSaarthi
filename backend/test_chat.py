import unittest
from app import create_app
from utils.db import db
from models.user import User
from models.transaction import Transaction
from models.goal import Goal
from models.profile import Profile
from datetime import date


class TestChatbot(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config["TESTING"] = True
        self.app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()
            # Seed test user
            u = User(id=1, email="test@dhansaarthi.demo", name="Aarav Sharma")
            db.session.add(u)
            p = Profile(user_id=1, confidence_score=78, score_history=[], risk_profile={"risk_profile": "Moderate", "allocation": {"equities": 50, "debt_bonds": 30, "cash_fds": 20}})
            db.session.add(p)
            # Seed transactions
            txns = [
                Transaction(user_id=1, amount=85000, transaction_type="income", category="Income", description="Monthly Salary", transaction_date=date(2026, 8, 1)),
                Transaction(user_id=1, amount=22000, transaction_type="expense", category="Housing & Rent", description="House Rent", transaction_date=date(2026, 8, 2)),
                Transaction(user_id=1, amount=5000, transaction_type="expense", category="Food & Dining", description="Swiggy Delivery", transaction_date=date(2026, 8, 5)),
                Transaction(user_id=1, amount=15000, transaction_type="expense", category="Investments", description="Zerodha Nifty SIP", transaction_date=date(2026, 8, 8)),
                Transaction(user_id=1, amount=4000, transaction_type="expense", category="Shopping", description="Amazon Order", transaction_date=date(2026, 8, 10))
            ]
            db.session.add_all(txns)
            # Seed goal
            g = Goal(id=1, user_id=1, name="Emergency Buffer", target_amount=100000, saved_amount=60000, target_date=date(2027, 1, 1))
            db.session.add(g)
            db.session.commit()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_chat_greeting(self):
        res = self.client.post("/api/chat?user_id=1", json={"message": "Hi, who are you?"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("Saarthi AI", data["reply"])
        self.assertTrue(len(data["suggestions"]) > 0)

    def test_chat_category_spending(self):
        res = self.client.post("/api/chat?user_id=1", json={"message": "How much did I spend on food & dining?"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("Food & Dining", data["reply"])
        self.assertIn("5,000", data["reply"])

    def test_chat_confidence_score(self):
        res = self.client.post("/api/chat?user_id=1", json={"message": "How to improve my confidence score?"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("Financial Confidence Score", data["reply"])

    def test_chat_goals(self):
        res = self.client.post("/api/chat?user_id=1", json={"message": "What is the status of my goals?"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("Emergency Buffer", data["reply"])

    def test_chat_budget_advice(self):
        res = self.client.post("/api/chat?user_id=1", json={"message": "Where can I cut expenses?"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("Budget Optimization", data["reply"])


if __name__ == "__main__":
    unittest.main()
