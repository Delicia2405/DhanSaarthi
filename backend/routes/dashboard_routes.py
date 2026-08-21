from collections import defaultdict
from flask import Blueprint, jsonify, request
from sqlalchemy import func

from models.transaction import Transaction
from services.auth_service import authenticate_request

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.get("")
def dashboard():
    user_id = authenticate_request()

    # Fetch all transactions for the user ordered by date descending
    transactions = Transaction.query.filter_by(user_id=user_id).order_by(Transaction.transaction_date.desc()).all()
    total_count = len(transactions)

    if total_count == 0:
        return jsonify({
            "total_income": 0.0,
            "total_expense": 0.0,
            "net_savings": 0.0,
            "savings_rate": 0.0,
            "by_category": {},
            "category_breakdown": [],
            "monthly_trend": [],
            "recent_transactions": [],
            "transaction_count": 0,
        })

    total_income = 0.0
    total_expense = 0.0
    category_totals = defaultdict(float)
    monthly_data = defaultdict(lambda: {"income": 0.0, "expense": 0.0})

    for txn in transactions:
        amt = float(txn.amount)
        month_key = txn.transaction_date.strftime("%Y-%m")
        is_income = txn.transaction_type == "income" or txn.category == "Income"

        if is_income:
            total_income += amt
            monthly_data[month_key]["income"] += amt
        else:
            total_expense += amt
            category_totals[txn.category] += amt
            monthly_data[month_key]["expense"] += amt

    net_savings = total_income - total_expense
    savings_rate = round((net_savings / total_income * 100), 1) if total_income > 0 else 0.0

    # Category breakdown with percentages
    category_breakdown = []
    for cat, amt in sorted(category_totals.items(), key=lambda x: x[1], reverse=True):
        pct = round((amt / total_expense * 100), 1) if total_expense > 0 else 0.0
        category_breakdown.append({
            "category": cat,
            "amount": round(amt, 2),
            "percentage": pct
        })

    # Monthly trends sorted chronologically
    monthly_trend = []
    for month_key in sorted(monthly_data.keys()):
        m_inc = round(monthly_data[month_key]["income"], 2)
        m_exp = round(monthly_data[month_key]["expense"], 2)
        m_sav = round(m_inc - m_exp, 2)
        m_rate = round((m_sav / m_inc * 100), 1) if m_inc > 0 else 0.0
        monthly_trend.append({
            "month": month_key,
            "income": m_inc,
            "expense": m_exp,
            "savings": m_sav,
            "savings_rate": m_rate
        })

    # Recent transactions (up to 15)
    recent = [t.to_dict() for t in transactions[:15]]

    return jsonify({
        "total_income": round(total_income, 2),
        "total_expense": round(total_expense, 2),
        "net_savings": round(net_savings, 2),
        "savings_rate": savings_rate,
        "by_category": {cat: round(amt, 2) for cat, amt in category_totals.items()},
        "category_breakdown": category_breakdown,
        "monthly_trend": monthly_trend,
        "recent_transactions": recent,
        "transaction_count": total_count,
    })

