from datetime import date
from sqlalchemy import func
from models.transaction import Transaction
from models.goal import Goal

def calculate_score(user_id):
    """
    Calculates the Financial Confidence Score (0-100) and its breakdown based on:
    1. Savings Rate (25 pts)
    2. Spending Control (25 pts)
    3. Emergency Fund (25 pts)
    4. Goal Progress (25 pts)
    """
    transactions = Transaction.query.filter_by(user_id=user_id).all()
    goals = Goal.query.filter_by(user_id=user_id).all()

    total_income = sum(float(t.amount) for t in transactions if t.transaction_type == "income" or t.category == "Income")
    total_expense = sum(float(t.amount) for t in transactions if t.transaction_type == "expense" and t.category != "Income")

    # 1. Savings Rate Score (max 25)
    savings_rate = 0.0
    savings_score = 0.0
    net_savings = total_income - total_expense

    if total_income > 0:
        savings_rate = (net_savings / total_income) * 100
        if savings_rate >= 30:
            savings_score = 25.0
        elif savings_rate > 0:
            savings_score = (savings_rate / 30.0) * 25.0
        else:
            savings_score = 0.0

    # 2. Spending Control Score (max 25)
    discretionary_categories = {"shopping", "entertainment", "personal care", "food & dining"}
    discretionary_expense = sum(
        float(t.amount) for t in transactions 
        if t.transaction_type == "expense" and t.category.lower() in discretionary_categories
    )
    
    spending_score = 25.0
    discretionary_ratio = 0.0
    if total_expense > 0:
        discretionary_ratio = discretionary_expense / total_expense
        if discretionary_ratio <= 0.2:
            spending_score = 25.0
        elif discretionary_ratio <= 0.7:
            spending_score = (1.0 - (discretionary_ratio - 0.2) / 0.5) * 25.0
        else:
            spending_score = 0.0

    # 3. Emergency Fund Score (max 25)
    months_set = {t.transaction_date.strftime("%Y-%m") for t in transactions}
    num_months = max(len(months_set), 1)
    avg_monthly_expense = total_expense / num_months
    
    emergency_score = 0.0
    months_covered = 0.0
    if avg_monthly_expense > 0 and net_savings > 0:
        months_covered = net_savings / avg_monthly_expense
        if months_covered >= 6.0:
            emergency_score = 25.0
        else:
            emergency_score = (months_covered / 6.0) * 25.0
    elif avg_monthly_expense == 0:
        emergency_score = 25.0

    # 4. Goal Progress Score (max 25)
    avg_progress = 0.0
    if not goals:
        goal_score = 15.0  # Default neutral score
    else:
        progresses = []
        for g in goals:
            target = float(g.target_amount)
            saved = float(g.saved_amount)
            progresses.append(min(saved / target, 1.0) if target > 0 else 1.0)
        avg_progress = sum(progresses) / len(progresses)
        goal_score = avg_progress * 25.0

    overall_score = round(savings_score + spending_score + emergency_score + goal_score)
    overall_score = max(0, min(100, overall_score))

    return {
        "score": overall_score,
        "breakdown": {
            "savings_rate": {
                "score": round(savings_score, 1),
                "max_score": 25,
                "value": round(savings_rate, 1),
                "unit": "%",
                "label": "Savings Rate"
            },
            "spending_control": {
                "score": round(spending_score, 1),
                "max_score": 25,
                "value": round(discretionary_ratio * 100, 1),
                "unit": "%",
                "label": "Discretionary Spending Ratio"
            },
            "emergency_fund": {
                "score": round(emergency_score, 1),
                "max_score": 25,
                "value": round(months_covered, 1),
                "unit": " months",
                "label": "Emergency Fund Coverage"
            },
            "goal_progress": {
                "score": round(goal_score, 1),
                "max_score": 25,
                "value": round(avg_progress * 100, 1) if goals else 0.0,
                "unit": "%",
                "label": "Goal Completion Rate"
            }
        }
    }
