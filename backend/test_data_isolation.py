import unittest
from app import create_app
from utils.db import db
from models.user import User
from models.transaction import Transaction
from models.goal import Goal
from datetime import date
from services.auth_service import generate_auth_token


class TestUserDataIsolation(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config["TESTING"] = True
        self.app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
        self.client = self.app.test_client()

        with self.app.app_context():
            db.drop_all()
            db.create_all()

            # Create John (User 1)
            john = User(id=1, email="john@example.com", name="John Doe")
            db.session.add(john)

            # Create Alice (User 2)
            alice = User(id=2, email="alice@example.com", name="Alice Smith")
            db.session.add(alice)

            # Seed John's private financial data
            john_txns = [
                Transaction(user_id=1, amount=100000, transaction_type="income", category="Income", description="John HDFC Salary", transaction_date=date(2026, 8, 1), source="AA:HDFC Bank"),
                Transaction(user_id=1, amount=30000, transaction_type="expense", category="Housing & Rent", description="John House Rent", transaction_date=date(2026, 8, 2), source="AA:HDFC Bank")
            ]
            db.session.add_all(john_txns)
            john_goal = Goal(id=1, user_id=1, name="John's Tesla Fund", target_amount=2000000, saved_amount=500000, target_date=date(2028, 1, 1))
            db.session.add(john_goal)

            # Seed Alice's private financial data
            alice_txns = [
                Transaction(user_id=2, amount=150000, transaction_type="income", category="Income", description="Alice SBI Salary", transaction_date=date(2026, 8, 1), source="AA:State Bank of India"),
                Transaction(user_id=2, amount=45000, transaction_type="expense", category="Shopping", description="Alice Secret Jewelry Purchase", transaction_date=date(2026, 8, 3), source="AA:State Bank of India")
            ]
            db.session.add_all(alice_txns)
            alice_goal = Goal(id=2, user_id=2, name="Alice's Private Villa", target_amount=10000000, saved_amount=2500000, target_date=date(2030, 1, 1))
            db.session.add(alice_goal)

            db.session.commit()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_john_cannot_see_alice_dashboard_or_transactions(self):
        with self.app.app_context():
            john_token = generate_auth_token(1)
        
        # John requests his dashboard
        res = self.client.get("/api/dashboard", headers={"Authorization": f"Bearer {john_token}"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()

        # John's total income should be 100,000, NOT 250,000
        self.assertEqual(data["total_income"], 100000.0)
        self.assertEqual(data["total_expense"], 30000.0)

        # Check transactions list returned to John
        descriptions = [t["description"] for t in data["recent_transactions"]]
        self.assertIn("John HDFC Salary", descriptions)
        self.assertIn("John House Rent", descriptions)

        # Ensure NO data from Alice is leaked
        self.assertNotIn("Alice SBI Salary", descriptions)
        self.assertNotIn("Alice Secret Jewelry Purchase", descriptions)

    def test_john_cannot_see_alice_goals(self):
        with self.app.app_context():
            john_token = generate_auth_token(1)

        # John requests goals
        res = self.client.get("/api/goals", headers={"Authorization": f"Bearer {john_token}"})
        self.assertEqual(res.status_code, 200)
        goals = res.get_json()

        goal_names = [g["name"] for g in goals]
        self.assertIn("John's Tesla Fund", goal_names)
        self.assertNotIn("Alice's Private Villa", goal_names)

    def test_john_cannot_modify_alice_goal(self):
        with self.app.app_context():
            john_token = generate_auth_token(1)

        # John attempts to delete Alice's goal (Goal ID 2)
        res = self.client.delete("/api/goals/2", headers={"Authorization": f"Bearer {john_token}"})
        self.assertEqual(res.status_code, 404)

        # Verify Alice's goal is untouched
        with self.app.app_context():
            g = db.session.get(Goal, 2)
            self.assertIsNotNone(g)
            self.assertEqual(g.name, "Alice's Private Villa")


if __name__ == "__main__":
    unittest.main()
