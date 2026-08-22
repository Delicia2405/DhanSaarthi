import unittest
from app import create_app
from utils.db import db
from models.user import User
from models.transaction import Transaction


class TestAccountAggregator(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config["TESTING"] = True
        self.app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
        self.client = self.app.test_client()

        with self.app.app_context():
            db.drop_all()
            db.create_all()
            u = User(id=1, email="test@dhansaarthi.demo", name="Demo User")
            db.session.add(u)
            db.session.commit()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_discover_accounts(self):
        res = self.client.post("/api/aggregator/discover?user_id=1", json={"phone": "9876543210", "aa_handle": "finvu"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "success")
        self.assertTrue(len(data["accounts"]) >= 3)
        self.assertEqual(data["accounts"][0]["bank_name"], "HDFC Bank")

    def test_request_otp(self):
        res = self.client.post("/api/aggregator/request-otp?user_id=1", json={
            "phone": "9876543210",
            "selected_account_ids": ["acc_hdfc_01", "acc_sbi_02"]
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("session_id", data)
        self.assertIn("consent_artifact", data)
        self.assertEqual(data["otp_hint"], "123456")

    def test_verify_consent_and_ingest(self):
        # 1. Verify consent
        res = self.client.post("/api/aggregator/verify-consent?user_id=1", json={
            "otp": "123456",
            "selected_account_ids": ["acc_hdfc_01", "acc_sbi_02", "acc_icici_03"]
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "success")
        self.assertTrue(data["imported_transactions_count"] > 0)

        # 2. Check DB transactions
        with self.app.app_context():
            txns = Transaction.query.filter_by(user_id=1).all()
            self.assertTrue(len(txns) >= 10)
            sources = set(t.source for t in txns)
            self.assertTrue(any("HDFC" in s for s in sources))
            self.assertTrue(any("State Bank" in s for s in sources))


if __name__ == "__main__":
    unittest.main()
