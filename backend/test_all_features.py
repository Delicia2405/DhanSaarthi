import os
from app import create_app
from services.score_service import calculate_score
from services.goal_service import gap_analysis
from services.ai_service import get_recommendations_from_data, classify_risk_profile
from utils.db import db
from models.user import User
from models.transaction import Transaction
from models.goal import Goal
from models.profile import Profile
from datetime import date, timedelta

def test_scoring_and_insights():
    app = create_app()
    app.config["TESTING"] = True
    
    with app.app_context():
        # Clear DB
        db.drop_all()
        db.create_all()
        
        # 1. Create a User
        user = User(id=1, email="test@dhansaarthi.demo", name="Test User")
        db.session.add(user)
        db.session.commit()
        
        # 2. Add Transactions
        # Income
        t1 = Transaction(user_id=1, amount=100000, transaction_type="income", category="Income", transaction_date=date.today())
        # Expenses (discretionary)
        t2 = Transaction(user_id=1, amount=10000, transaction_type="expense", category="Shopping", transaction_date=date.today())
        t3 = Transaction(user_id=1, amount=5000, transaction_type="expense", category="Food & Dining", transaction_date=date.today())
        # Expenses (essential)
        t4 = Transaction(user_id=1, amount=30000, transaction_type="expense", category="Housing & Rent", transaction_date=date.today())
        
        db.session.add_all([t1, t2, t3, t4])
        db.session.commit()
        
        # 3. Add Goal
        g1 = Goal(user_id=1, name="Emergency Fund Buffer", target_amount=150000, saved_amount=20000, target_date=date.today() + timedelta(days=180))
        db.session.add(g1)
        db.session.commit()
        
        # 4. Test Score Service
        print("[1/4] Testing Score Service...")
        score_res = calculate_score(1)
        assert "score" in score_res
        assert "breakdown" in score_res
        breakdown = score_res["breakdown"]
        assert "savings_rate" in breakdown
        assert "spending_control" in breakdown
        assert "emergency_fund" in breakdown
        assert "goal_progress" in breakdown
        print(f"[PASS] Scoring Service details: Overall = {score_res['score']}, Savings = {breakdown['savings_rate']['score']}, Spending = {breakdown['spending_control']['score']}")
        
        # 5. Test Goal Gap Analysis
        print("[2/4] Testing Goal Service gap analysis...")
        gap_res = gap_analysis(g1)
        assert gap_res["remaining_amount"] == 130000
        assert gap_res["projected_savings"] > 0
        assert "shortfall" in gap_res
        assert "suggested_monthly_increase" in gap_res
        print(f"[PASS] Goal Gap Analysis shortfall = INR {gap_res['shortfall']:,.2f}, Suggested increase = INR {gap_res['suggested_monthly_increase']:,.2f}")
        
        # 6. Test AI Recommendations
        print("[3/4] Testing AI Service insights...")
        insights_res = get_recommendations_from_data(1)
        assert len(insights_res) > 0
        for ins in insights_res:
            assert "type" in ins
            assert "icon" in ins
            assert "text" in ins
        print(f"[PASS] AI Service returned {len(insights_res)} insights successfully.")
        
        # 7. Test Risk Profiling Quiz Classification
        print("[4/4] Testing Risk Quiz Classification...")
        r1 = classify_risk_profile({"goal": "safety", "reaction": "sell", "horizon": "short"})
        assert r1["risk_profile"] == "Conservative"
        
        r2 = classify_risk_profile({"goal": "balance", "reaction": "hold", "horizon": "medium"})
        assert r2["risk_profile"] == "Moderate"
        
        r3 = classify_risk_profile({"goal": "growth", "reaction": "buy", "horizon": "long"})
        assert r3["risk_profile"] == "Aggressive"
        print("[PASS] Risk Quiz correctly classified Conservative, Moderate, and Aggressive profiles.")
        
        print("\n" + "=" * 60)
        print("ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!")
        print("=" * 60)

if __name__ == "__main__":
    test_scoring_and_insights()
