from datetime import date
from collections import defaultdict
from models.transaction import Transaction

def gap_analysis(goal):
    target_amount = float(goal.target_amount)
    saved_amount = float(goal.saved_amount)
    
    remaining = max(target_amount - saved_amount, 0.0)
    
    # Calculate months remaining until target date
    days_remaining = (goal.target_date - date.today()).days
    months_remaining = max(days_remaining / 30.44, 0.1)  # Minimum 0.1 months to avoid division by zero
    
    monthly_required = remaining / months_remaining
    
    # Calculate historical monthly savings rate of the user
    transactions = Transaction.query.filter_by(user_id=goal.user_id).all()
    
    monthly_data = defaultdict(lambda: {"income": 0.0, "expense": 0.0})
    for t in transactions:
        m_key = t.transaction_date.strftime("%Y-%m")
        amt = float(t.amount)
        if t.transaction_type == "income" or t.category == "Income":
            monthly_data[m_key]["income"] += amt
        else:
            monthly_data[m_key]["expense"] += amt
            
    savings_history = []
    for m_key, vals in monthly_data.items():
        savings_history.append(vals["income"] - vals["expense"])
        
    avg_monthly_savings = 0.0
    if savings_history:
        avg_monthly_savings = sum(savings_history) / len(savings_history)
        avg_monthly_savings = max(avg_monthly_savings, 0.0)  # Floor at 0
        
    # Project current savings rate forward
    trajectory = saved_amount + (avg_monthly_savings * months_remaining)
    shortfall = max(target_amount - trajectory, 0.0)
    
    suggested_monthly_increase = shortfall / months_remaining
    
    return {
        "remaining_amount": round(remaining, 2),
        "months_remaining": round(months_remaining, 1),
        "monthly_required": round(monthly_required, 2),
        "avg_monthly_savings": round(avg_monthly_savings, 2),
        "projected_savings": round(trajectory, 2),
        "shortfall": round(shortfall, 2),
        "suggested_monthly_increase": round(suggested_monthly_increase, 2)
    }
