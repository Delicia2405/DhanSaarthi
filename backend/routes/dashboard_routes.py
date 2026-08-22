from collections import defaultdict
from flask import Blueprint, jsonify, request
from datetime import datetime

from models.transaction import Transaction
from services.auth_service import authenticate_request

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.get("")
def dashboard():
    user_id = authenticate_request()
    timeframe = request.args.get("timeframe", "lifetime").lower()  # "lifetime", "yearly", "monthly"
    req_year = request.args.get("year")
    req_month = request.args.get("month")

    # Fetch all transactions for the user ordered by date descending
    all_transactions = Transaction.query.filter_by(user_id=user_id).order_by(Transaction.transaction_date.desc()).all()
    total_count = len(all_transactions)

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
            "available_years": [],
            "available_months": [],
            "selected_timeframe": timeframe,
            "selected_year": req_year or "",
            "selected_month": req_month or "",
            "executive_summary": "No transactions found. Upload bank statements to view your financial report."
        })

    # Extract all distinct years and months available
    years_set = set()
    months_dict = {}
    for txn in all_transactions:
        y = txn.transaction_date.strftime("%Y")
        m = txn.transaction_date.strftime("%Y-%m")
        years_set.add(y)
        if m not in months_dict:
            months_dict[m] = {
                "key": m,
                "label": txn.transaction_date.strftime("%B %Y"),
                "year": y
            }

    available_years = sorted(list(years_set), reverse=True)
    available_months = sorted(list(months_dict.values()), key=lambda x: x["key"], reverse=True)

    # Set default year / month if not specified
    if not req_year and available_years:
        req_year = available_years[0]
    if not req_month and available_months:
        req_month = available_months[0]["key"]

    # Filter transactions according to selected timeframe
    if timeframe == "yearly":
        filtered_txns = [t for t in all_transactions if t.transaction_date.strftime("%Y") == req_year]
        active_period_label = f"Year {req_year}"
    elif timeframe == "monthly":
        filtered_txns = [t for t in all_transactions if t.transaction_date.strftime("%Y-%m") == req_month]
        # Month label
        try:
            m_dt = datetime.strptime(req_month, "%Y-%m")
            active_period_label = m_dt.strftime("%B %Y")
        except Exception:
            active_period_label = req_month
    else:
        # Lifetime
        timeframe = "lifetime"
        filtered_txns = all_transactions
        active_period_label = "Lifetime (All-Time)"

    total_income = 0.0
    total_expense = 0.0
    category_totals = defaultdict(float)
    trend_map = defaultdict(lambda: {"income": 0.0, "expense": 0.0})

    for txn in filtered_txns:
        amt = float(txn.amount)
        is_income = txn.transaction_type == "income" or txn.category == "Income"

        # Determine trend bucket key
        if timeframe == "monthly":
            # Group by day in monthly view
            bucket_key = txn.transaction_date.strftime("%Y-%m-%d")
        else:
            # Group by month in yearly and lifetime views
            bucket_key = txn.transaction_date.strftime("%Y-%m")

        if is_income:
            total_income += amt
            trend_map[bucket_key]["income"] += amt
        else:
            total_expense += amt
            category_totals[txn.category] += amt
            trend_map[bucket_key]["expense"] += amt

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

    # Trends sorted chronologically
    trend_list = []
    for key in sorted(trend_map.keys()):
        inc = round(trend_map[key]["income"], 2)
        exp = round(trend_map[key]["expense"], 2)
        sav = round(inc - exp, 2)
        rate = round((sav / inc * 100), 1) if inc > 0 else 0.0

        if timeframe == "monthly":
            try:
                d_obj = datetime.strptime(key, "%Y-%m-%d")
                display_label = d_obj.strftime("%d %b")
            except Exception:
                display_label = key
        else:
            try:
                m_obj = datetime.strptime(key, "%Y-%m")
                display_label = m_obj.strftime("%b %Y")
            except Exception:
                display_label = key

        trend_list.append({
            "key": key,
            "month": key,  # keep for backward compatibility
            "label": display_label,
            "income": inc,
            "expense": exp,
            "savings": sav,
            "savings_rate": rate
        })

    # Recent transactions for this period (up to 25)
    recent = [t.to_dict() for t in filtered_txns[:25]]

    # Generate friendly plain-English executive summary
    top_cat = category_breakdown[0] if category_breakdown else None
    if total_income > 0:
        summary_text = (
            f"In {active_period_label}, you earned ₹{total_income:,.0f}, spent ₹{total_expense:,.0f}, "
            f"and saved ₹{net_savings:,.0f} ({savings_rate}% savings rate). "
        )
        if top_cat:
            summary_text += f"Your highest expense category was {top_cat['category']} at ₹{top_cat['amount']:,.0f} ({top_cat['percentage']}%)."
    elif total_expense > 0:
        summary_text = f"In {active_period_label}, total expenses were ₹{total_expense:,.0f} with no recorded income."
    else:
        summary_text = f"No transactions recorded for {active_period_label}."

    return jsonify({
        "total_income": round(total_income, 2),
        "total_expense": round(total_expense, 2),
        "net_savings": round(net_savings, 2),
        "savings_rate": savings_rate,
        "by_category": {cat: round(amt, 2) for cat, amt in category_totals.items()},
        "category_breakdown": category_breakdown,
        "monthly_trend": trend_list,
        "trend_data": trend_list,
        "recent_transactions": recent,
        "transaction_count": len(filtered_txns),
        "all_time_transaction_count": total_count,
        "available_years": available_years,
        "available_months": available_months,
        "selected_timeframe": timeframe,
        "selected_year": req_year,
        "selected_month": req_month,
        "active_period_label": active_period_label,
        "executive_summary": summary_text
    })


