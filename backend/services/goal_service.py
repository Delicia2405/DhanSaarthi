from datetime import date


def gap_analysis(goal):
    remaining = max(float(goal.target_amount) - float(goal.saved_amount), 0)
    months = max((goal.target_date - date.today()).days / 30.44, 1)
    return {"remaining_amount": round(remaining, 2), "months_remaining": round(months, 1), "monthly_required": round(remaining / months, 2)}
