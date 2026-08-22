import os
import json
import re
import requests
from flask import current_app
from models.transaction import Transaction
from models.goal import Goal
from models.profile import Profile
from models.user import User
from utils.db import db
from services.score_service import calculate_score
from services.goal_service import gap_analysis


def build_financial_context(user_id):
    """
    Gathers comprehensive, real-time financial context for the given user.
    """
    user = db.session.get(User, user_id)
    transactions = Transaction.query.filter_by(user_id=user_id).order_by(Transaction.transaction_date.desc()).all()
    goals = Goal.query.filter_by(user_id=user_id).all()
    profile = Profile.query.filter_by(user_id=user_id).first()
    score_data = calculate_score(user_id)

    total_income = sum(float(t.amount) for t in transactions if t.transaction_type == "income" or t.category == "Income")
    total_expense = sum(float(t.amount) for t in transactions if t.transaction_type == "expense" and t.category != "Income")
    net_savings = total_income - total_expense
    savings_rate = (net_savings / total_income * 100) if total_income > 0 else 0.0

    # Category breakdown
    category_totals = {}
    for t in transactions:
        if t.transaction_type == "expense" and t.category != "Income":
            category_totals[t.category] = category_totals.get(t.category, 0.0) + float(t.amount)

    sorted_categories = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)
    category_breakdown = [
        {
            "category": cat,
            "amount": round(amt, 2),
            "percentage": round((amt / total_expense * 100), 1) if total_expense > 0 else 0.0
        }
        for cat, amt in sorted_categories
    ]

    # Monthly breakdown
    monthly_data = {}
    for t in transactions:
        m_key = t.transaction_date.strftime("%Y-%m")
        if m_key not in monthly_data:
            monthly_data[m_key] = {"income": 0.0, "expense": 0.0}
        amt = float(t.amount)
        if t.transaction_type == "income" or t.category == "Income":
            monthly_data[m_key]["income"] += amt
        else:
            monthly_data[m_key]["expense"] += amt

    num_months = max(len(monthly_data), 1)
    avg_monthly_income = total_income / num_months
    avg_monthly_expense = total_expense / num_months
    avg_monthly_savings = net_savings / num_months

    # Goals context
    goals_context = []
    for g in goals:
        gap = gap_analysis(g)
        goals_context.append({
            "id": g.id,
            "name": g.name,
            "target_amount": float(g.target_amount),
            "saved_amount": float(g.saved_amount),
            "target_date": g.target_date.isoformat(),
            "remaining_amount": gap.get("remaining_amount", 0.0),
            "months_remaining": gap.get("months_remaining", 0.0),
            "monthly_required": gap.get("monthly_required", 0.0),
            "shortfall": gap.get("shortfall", 0.0),
            "suggested_monthly_increase": gap.get("suggested_monthly_increase", 0.0)
        })

    # Recent transactions
    recent_txns = [t.to_dict() for t in transactions[:10]]

    return {
        "user_name": user.name if user else "User",
        "total_income": round(total_income, 2),
        "total_expense": round(total_expense, 2),
        "net_savings": round(net_savings, 2),
        "savings_rate": round(savings_rate, 1),
        "avg_monthly_income": round(avg_monthly_income, 2),
        "avg_monthly_expense": round(avg_monthly_expense, 2),
        "avg_monthly_savings": round(avg_monthly_savings, 2),
        "num_months": num_months,
        "monthly_data": monthly_data,
        "category_breakdown": category_breakdown,
        "score_data": score_data,
        "goals": goals_context,
        "risk_profile": profile.risk_profile if profile and profile.risk_profile else None,
        "recent_transactions": recent_txns,
        "all_transactions": [t.to_dict() for t in transactions],
        "transaction_count": len(transactions)
    }


def rule_based_response(query, ctx):
    """
    High-fidelity conversational financial NLP engine.
    Understands and answers inquiries based on the user's live financial data.
    """
    q = query.lower().strip()
    from datetime import date, timedelta, datetime

    # 1. Greetings & Identity
    if any(k in q for k in ["hi", "hello", "hey", "who are you", "what can you do", "help"]):
        if not any(k in q for k in ["spend", "score", "goal", "save", "income", "money", "invest", "yesterday", "today"]):
            user_name = ctx["user_name"]
            score = ctx["score_data"]["score"]
            return {
                "reply": (
                    f"👋 **Namaste {user_name}!** I am **Saarthi AI**, your intelligent personal financial companion.\n\n"
                    f"Here is a quick snapshot of your financial health:\n"
                    f"- 🛡️ **Confidence Score:** `{score}/100`\n"
                    f"- 💰 **Net Savings Rate:** `{ctx['savings_rate']}%` (INR {ctx['net_savings']:,.2f} total surplus)\n"
                    f"- 🎯 **Active Goals:** {len(ctx['goals'])} goal(s) tracked\n\n"
                    f"You can ask me anything about your finances, spending categories, goal affordability, or how to boost your savings!"
                ),
                "suggestions": [
                    "Where is most of my money going?",
                    "How can I improve my confidence score?",
                    "Can I reach my financial goals on time?"
                ]
            }

    # 2. Date & Timeframe Specific Inquiries (e.g. yesterday, today, this month, last month, specific date, daily average)
    all_txns = ctx.get("all_transactions", [])
    
    # Yesterday / Today / Specific Day
    if any(k in q for k in ["yesterday", "today", "day before", "daily spend", "average daily", "per day"]):
        today_date = date.today()
        yesterday_date = today_date - timedelta(days=1)
        yesterday_str = yesterday_date.strftime("%Y-%m-%d")
        today_str = today_date.strftime("%Y-%m-%d")

        # Find latest transaction date in records if exists
        latest_txn_date_str = all_txns[0]["date"] if all_txns else None

        if "yesterday" in q:
            # Check for transactions on yesterday's date
            yesterday_txns = [t for t in all_txns if t.get("date") == yesterday_str and t.get("type") == "expense" and t.get("category") != "Income"]
            yesterday_total = sum(float(t["amount"]) for t in yesterday_txns)
            
            # Also find transactions on the latest statement date as helpful context
            latest_day_txns = [t for t in all_txns if t.get("date") == latest_txn_date_str and t.get("type") == "expense" and t.get("category") != "Income"] if latest_txn_date_str else []
            latest_day_total = sum(float(t["amount"]) for t in latest_day_txns)
            avg_daily = ctx["avg_monthly_expense"] / 30.0 if ctx.get("avg_monthly_expense") else 0.0

            if yesterday_txns:
                items_str = "\n".join([f"- **{t['description']}**: INR {float(t['amount']):,.2f} ({t['category']})" for t in yesterday_txns])
                return {
                    "reply": (
                        f"📅 **Yesterday's Spending ({yesterday_date.strftime('%d %B %Y')}):**\n\n"
                        f"You spent a total of **INR {yesterday_total:,.2f}** across {len(yesterday_txns)} transaction(s):\n\n"
                        f"{items_str}\n\n"
                        f"💡 *Your overall daily average spending is **INR {avg_daily:,.2f}/day**.*"
                    ),
                    "suggestions": [
                        "What is my daily average expense?",
                        "Where is most of my money going?",
                        "What are my biggest expenses?"
                    ]
                }
            else:
                context_note = ""
                if latest_txn_date_str:
                    try:
                        latest_d_obj = datetime.strptime(latest_txn_date_str, "%Y-%m-%d")
                        formatted_latest_d = latest_d_obj.strftime("%d %B %Y")
                    except Exception:
                        formatted_latest_d = latest_txn_date_str
                    context_note = (
                        f"\n\n📌 **Statement Context:** Your uploaded bank statement records go up to **{formatted_latest_d}**.\n"
                        f"- On **{formatted_latest_d}** (your latest recorded statement day), you spent **INR {latest_day_total:,.2f}**.\n"
                        f"- Your **daily average spending** across recorded months is **INR {avg_daily:,.2f}/day**."
                    )

                return {
                    "reply": (
                        f"📅 **Yesterday's Spending Report ({yesterday_date.strftime('%d %B %Y')}):**\n\n"
                        f"You had **INR 0.00** in recorded expenses yesterday."
                        f"{context_note}"
                    ),
                    "suggestions": [
                        "What is my daily average expense?",
                        "Show my recent transactions",
                        "Where is most of my money going?"
                    ]
                }

        if "today" in q:
            today_txns = [t for t in all_txns if t.get("date") == today_str and t.get("type") == "expense" and t.get("category") != "Income"]
            today_total = sum(float(t["amount"]) for t in today_txns)
            avg_daily = ctx["avg_monthly_expense"] / 30.0 if ctx.get("avg_monthly_expense") else 0.0
            if today_txns:
                items_str = "\n".join([f"- **{t['description']}**: INR {float(t['amount']):,.2f} ({t['category']})" for t in today_txns])
                return {
                    "reply": (
                        f"📅 **Today's Spending ({today_date.strftime('%d %B %Y')}):**\n\n"
                        f"You have spent **INR {today_total:,.2f}** today so far:\n\n"
                        f"{items_str}"
                    ),
                    "suggestions": ["Show my top expenses", "Check my savings rate", "Review my financial goals"]
                }
            else:
                return {
                    "reply": (
                        f"📅 **Today's Spending ({today_date.strftime('%d %B %Y')}):**\n\n"
                        f"No new expenses recorded for today so far (**INR 0.00**).\n\n"
                        f"💡 Your average daily burn rate is **INR {avg_daily:,.2f}/day**."
                    ),
                    "suggestions": ["What are my top expenses?", "Where is most of my money going?", "Check my Confidence Score"]
                }

        if any(k in q for k in ["daily spend", "average daily", "per day"]):
            avg_daily = ctx["avg_monthly_expense"] / 30.0 if ctx.get("avg_monthly_expense") else 0.0
            avg_daily_inc = ctx["avg_monthly_income"] / 30.0 if ctx.get("avg_monthly_income") else 0.0
            return {
                "reply": (
                    f"📊 **Daily Cash Flow Breakdown**\n\n"
                    f"- 📈 **Average Daily Income:** INR {avg_daily_inc:,.2f}/day\n"
                    f"- 📉 **Average Daily Outflow:** INR {avg_daily:,.2f}/day\n"
                    f"- 💰 **Daily Net Savings:** INR {(avg_daily_inc - avg_daily):,.2f}/day\n\n"
                    f"Keeping your daily discretionary spends under **INR {round(avg_daily * 0.3):,.2f}** will help you reach your goals faster."
                ),
                "suggestions": ["What are my top expenses?", "How to boost my savings rate?", "Can I reach my goals?"]
            }

    # Month Specific Inquiries (e.g., "in august", "in july", "this month", "last month")
    if any(k in q for k in ["august", "july", "june", "september", "october", "this month", "last month"]):
        month_names = {
            "january": "01", "february": "02", "march": "03", "april": "04",
            "may": "05", "june": "06", "july": "07", "august": "08",
            "september": "09", "october": "10", "november": "11", "december": "12"
        }
        target_month_key = None
        for mname, mnum in month_names.items():
            if mname in q:
                # Find matching year from transactions
                for y in ["2026", "2025", "2024"]:
                    key = f"{y}-{mnum}"
                    if key in ctx.get("monthly_data", {}):
                        target_month_key = key
                        break
                if not target_month_key:
                    target_month_key = f"2026-{mnum}"
                break

        if not target_month_key:
            if "this month" in q:
                target_month_key = "2026-08"
            elif "last month" in q:
                target_month_key = "2026-07"

        if target_month_key and target_month_key in ctx.get("monthly_data", {}):
            mData = ctx["monthly_data"][target_month_key]
            m_inc = mData["income"]
            m_exp = mData["expense"]
            m_sav = m_inc - m_exp
            m_rate = round((m_sav / m_inc * 100), 1) if m_inc > 0 else 0.0

            try:
                m_label = datetime.strptime(target_month_key, "%Y-%m").strftime("%B %Y")
            except Exception:
                m_label = target_month_key

            return {
                "reply": (
                    f"📆 **Financial Summary for {m_label}**\n\n"
                    f"- 💵 **Total Inflow (Income):** INR {m_inc:,.2f}\n"
                    f"- 💳 **Total Outflow (Expenses):** INR {m_exp:,.2f}\n"
                    f"- 💰 **Net Savings Surplus:** INR {m_sav:,.2f}\n"
                    f"- 📊 **Savings Rate:** **{m_rate}%**\n\n"
                    f"💡 " + ("Great job! Your savings rate for this month was positive and healthy." if m_rate >= 25 else "Consider reviewing non-essential spending for this period.")
                ),
                "suggestions": [
                    "What are my biggest expenses in this month?",
                    "Where is most of my money going?",
                    "How to improve my savings rate?"
                ]
            }

    # 3. Specific Category Inquiries (e.g. food, dining, shopping, rent, groceries, travel)
    category_map = {
        "food": ["food & dining", "food", "dining", "swiggy", "zomato", "restaurant", "cafe"],
        "shopping": ["shopping", "amazon", "flipkart", "myntra", "clothes", "electronics"],
        "housing": ["housing & rent", "rent", "housing", "landlord", "flat"],
        "groceries": ["groceries", "grocery", "blinkit", "zepto", "bigbasket", "dmart", "instamart"],
        "utilities": ["utilities", "electricity", "bescom", "power", "water", "broadband", "airtel", "recharge"],
        "investment": ["investments", "sip", "zerodha", "groww", "mutual fund", "stocks", "equity"],
        "transport": ["transport", "travel", "uber", "ola", "metro", "petrol", "fuel", "cab"],
        "entertainment": ["entertainment", "netflix", "spotify", "movies", "bookmyshow", "subscription"],
        "health": ["health & fitness", "medicine", "pharmacy", "cult", "gym", "doctor", "hospital"]
    }

    matched_cat = None
    for cat_key, aliases in category_map.items():
        if any(alias in q for alias in aliases):
            # Check if user is asking about spending in this category
            matched_cat = cat_key
            break
            # Check if user is asking about spending in this category
            matched_cat = cat_key
            break

    if matched_cat and any(k in q for k in ["how much", "spend", "cost", "bill", "expense", "pay", "total", "category"]):
        # Find category in breakdown
        aliases = category_map[matched_cat]
        matching_items = [
            c for c in ctx["category_breakdown"]
            if any(alias in c["category"].lower() for alias in aliases)
        ]
        
        if matching_items:
            cat_info = matching_items[0]
            amt = cat_info["amount"]
            pct = cat_info["percentage"]
            
            # Find relevant transactions
            sample_txns = [
                t for t in ctx["recent_transactions"]
                if t.get("category") == cat_info["category"]
            ][:3]
            
            txn_str = ""
            if sample_txns:
                txn_str = "\n\n**Recent transactions in this category:**\n" + "\n".join(
                    [f"- `{t['date']}`: {t['description']} (INR {t['amount']:,.2f})" for t in sample_txns]
                )

            return {
                "reply": (
                    f"📊 **{cat_info['category']} Spending Analysis**\n\n"
                    f"- Total Spent: **INR {amt:,.2f}**\n"
                    f"- Share of total expenses: **{pct}%**\n"
                    f"- Monthly Average: **INR {round(amt / ctx['num_months'], 2):,.2f}/month**"
                    f"{txn_str}\n\n"
                    f"💡 *Tip:* " + (
                        f"This is one of your major expenditure areas ({pct}% of spend). Trimming discretionary expenses here by 15% would free up INR {round(amt * 0.15):,.2f} for your goals."
                        if pct > 15 else "Your spending in this category is well-controlled and within standard budgeting thresholds."
                    )
                ),
                "suggestions": [
                    "Show my top 3 biggest expenses",
                    "How can I cut my monthly expenses?",
                    "What is my current savings rate?"
                ]
            }

    # 3. Top Expenses / Where is my money going / Category breakdown
    if any(k in q for k in ["top expense", "biggest expense", "where is my money", "breakdown", "highest spend", "spending habits", "categories"]):
        if not ctx["category_breakdown"]:
            return {
                "reply": "You haven't uploaded any expense transactions yet! Please upload a statement in the **Upload Statement** tab to see a complete spending breakdown.",
                "suggestions": ["How to upload a statement?", "What is the 50/30/20 budget rule?"]
            }

        top_3 = ctx["category_breakdown"][:3]
        lines = []
        for i, item in enumerate(top_3, 1):
            lines.append(f"{i}. **{item['category']}**: INR {item['amount']:,.2f} (*{item['percentage']}% of total*)")

        total_exp = ctx["total_expense"]
        top_3_sum = sum(item["amount"] for item in top_3)
        top_3_pct = round((top_3_sum / total_exp * 100), 1) if total_exp > 0 else 0

        return {
            "reply": (
                f"💸 **Your Top Expense Categories**\n\n"
                f"You have spent a total of **INR {total_exp:,.2f}**. Your top 3 cost drivers make up **{top_3_pct}%** of all spending:\n\n"
                + "\n".join(lines) +
                f"\n\n🎯 **Actionable Advice:** Focusing on moderating the top discretionary categories among these will yield the fastest boost to your net savings rate."
            ),
            "suggestions": [
                "Where can I cut expenses safely?",
                "Analyze my monthly cash flow",
                "How does this affect my Confidence Score?"
            ]
        }

    # 4. Income, Savings Rate & Cash Flow
    if any(k in q for k in ["income", "earn", "salary", "cash flow", "savings rate", "saved", "surplus", "how much do i save"]):
        inc = ctx["total_income"]
        exp = ctx["total_expense"]
        net = ctx["net_savings"]
        sr = ctx["savings_rate"]

        status = "🌟 Exceptional" if sr >= 35 else ("✅ Good & Healthy" if sr >= 20 else "⚠️ Needs Attention")

        return {
            "reply": (
                f"💰 **Monthly Cash Flow & Savings Summary**\n\n"
                f"- **Total Inflow (Income):** INR {inc:,.2f}\n"
                f"- **Total Outflow (Expenses):** INR {exp:,.2f}\n"
                f"- **Net Savings Surplus:** INR {net:,.2f}\n"
                f"- **Savings Rate:** **{sr}%** ({status})\n\n"
                f"📌 **Rule of Thumb (50/30/20):**\n"
                f"A disciplined financial plan allocates **50%** to Needs, **30%** to Wants, and **20%+** to Savings & Investments. "
                + (f"Your savings rate is ahead of the 20% mark—keep compounding!" if sr >= 20 else f"You are currently saving {sr}%. Aim to increase this towards 25% by automating a recurring SIP on payday.")
            ),
            "suggestions": [
                "How to boost my savings rate?",
                "What is my emergency fund status?",
                "Can I afford my goals?"
            ]
        }

    # 5. Confidence Score & Health Status
    if any(k in q for k in ["score", "confidence", "financial health", "improve score", "grade", "rating"]):
        sc = ctx["score_data"]
        score = sc["score"]
        bd = sc["breakdown"]

        lines = [
            f"- **Savings Rate:** `{bd['savings_rate']['score']}/{bd['savings_rate']['max_score']}` ({bd['savings_rate']['value']}{bd['savings_rate']['unit']})",
            f"- **Spending Control:** `{bd['spending_control']['score']}/{bd['spending_control']['max_score']}` ({bd['spending_control']['value']}% discretionary)",
            f"- **Emergency Fund:** `{bd['emergency_fund']['score']}/{bd['emergency_fund']['max_score']}` ({bd['emergency_fund']['value']} months coverage)",
            f"- **Goal Progress:** `{bd['goal_progress']['score']}/{bd['goal_progress']['max_score']}` ({bd['goal_progress']['value']}% completion)"
        ]

        tips = []
        if bd["savings_rate"]["score"] < 20:
            tips.append("1. **Boost Savings:** Increase your monthly savings rate to at least 30% to gain +10 score points.")
        if bd["emergency_fund"]["score"] < 20:
            tips.append("2. **Grow Emergency Fund:** Target at least 6 months of essential living expenses in liquid funds.")
        if bd["spending_control"]["score"] < 20:
            tips.append("3. **Discretionary Capping:** Reduce shopping and dining below 25% of total expenses.")
        if not tips:
            tips.append("🎉 Your financial pillars are well balanced! Maintain steady SIP contributions to preserve your top score.")

        return {
            "reply": (
                f"🛡️ **Financial Confidence Score: `{score}/100`**\n\n"
                f"**Score Breakdown:**\n"
                + "\n".join(lines) +
                f"\n\n🚀 **How to reach 90+ Score:**\n"
                + "\n".join(tips)
            ),
            "suggestions": [
                "How is my emergency fund calculated?",
                "Where is most of my money going?",
                "Review my financial goals"
            ]
        }

    # 6. Goals & Affordability (e.g. "can I afford vacation?", "goals status")
    if any(k in q for k in ["goal", "vacation", "trip", "car", "house", "afford", "shortfall", "target"]):
        goals = ctx["goals"]
        if not goals:
            return {
                "reply": (
                    "🎯 **No Financial Goals Tracked Yet!**\n\n"
                    "You haven't set up any goals yet. Setting clear targets (e.g. Emergency Fund, Vacation, Down Payment) helps measure progress and allocate monthly surplus.\n\n"
                    "👉 Navigate to the **Financial Goals** tab to add your first goal!"
                ),
                "suggestions": ["How should I budget for an emergency fund?", "What is my current monthly surplus?"]
            }

        goal_summaries = []
        for g in goals:
            pct = round((g["saved_amount"] / g["target_amount"] * 100), 1) if g["target_amount"] > 0 else 100
            status_text = "🟢 On Track" if g["shortfall"] <= 0 else f"🔴 Shortfall: INR {g['shortfall']:,.2f}"
            goal_summaries.append(
                f"🎯 **{g['name']}**\n"
                f"  - Target: **INR {g['target_amount']:,.2f}** by `{g['target_date']}`\n"
                f"  - Saved so far: **INR {g['saved_amount']:,.2f}** ({pct}%)\n"
                f"  - Required Monthly: **INR {g['monthly_required']:,.2f}/mo**\n"
                f"  - Status: {status_text}"
            )

        return {
            "reply": (
                f"🎯 **Financial Goals Progress & Feasibility**\n\n"
                + "\n\n".join(goal_summaries) +
                f"\n\n💡 **Surplus Availability:** Your average monthly net savings is **INR {ctx['avg_monthly_savings']:,.2f}**.\n"
                + ("You have sufficient surplus to fund all active targets!" if ctx['avg_monthly_savings'] >= sum(g['monthly_required'] for g in goals) else "Consider trimming non-essential shopping or dining to cover the monthly required goal amounts.")
            ),
            "suggestions": [
                "Where can I cut expenses to meet my goals?",
                "What is my risk profile?",
                "How to boost my confidence score?"
            ]
        }

    # 7. Investment & Asset Allocation
    if any(k in q for k in ["invest", "stocks", "mutual fund", "sip", "portfolio", "risk", "allocation", "equity", "debt", "fd"]):
        rp = ctx["risk_profile"]
        if rp and isinstance(rp, dict):
            profile_name = rp.get("risk_profile", "Moderate")
            alloc = rp.get("allocation", {"equities": 50, "debt_bonds": 30, "cash_fds": 20})
            desc = rp.get("description", "")
        else:
            profile_name = "Moderate (Balanced Growth)"
            alloc = {"equities": 50, "debt_bonds": 30, "cash_fds": 20}
            desc = "A balanced mix designed for steady capital appreciation with volatility protection."

        return {
            "reply": (
                f"📈 **Investment Strategy & Recommended Allocation**\n\n"
                f"Based on your profile (**{profile_name}**):\n"
                f"{desc}\n\n"
                f"**Target Asset Allocation:**\n"
                f"- 📊 **Equities / Index Funds:** `{alloc.get('equities', 50)}%` (Broad Market Nifty 50 / Flexicap)\n"
                f"- 🛡️ **Debt & Bonds:** `{alloc.get('debt_bonds', 30)}%` (Government Securities / Corporate Bond Funds)\n"
                f"- 💵 **Liquid Cash & FDs:** `{alloc.get('cash_fds', 20)}%` (Emergency buffer in High-Yield Savings / Arbitrage)\n\n"
                f"💡 *Action:* Setup monthly automated SIPs on salary day to automate disciplined compounding."
            ),
            "suggestions": [
                "Take Risk Profile Assessment",
                "Can I afford my goals?",
                "What is my current savings rate?"
            ]
        }

    # 8. Budgeting & Cutting Expenses
    if any(k in q for k in ["cut", "reduce", "budget", "save more", "tips", "frugal", "advice"]):
        top_cats = ctx["category_breakdown"][:3]
        tips = []
        for c in top_cats:
            if c["category"].lower() not in ["investments", "income"]:
                savings_opp = round(c["amount"] * 0.2, 2)
                tips.append(f"- **{c['category']}** (INR {c['amount']:,.2f}): Reducing by 20% saves **INR {savings_opp:,.2f}**.")

        return {
            "reply": (
                f"💡 **Practical Budget Optimization Opportunities**\n\n"
                f"Based on your current statement, here are high-impact areas to reduce monthly outflows:\n\n"
                + "\n".join(tips) +
                f"\n\n**3 Golden Budgeting Rules:**\n"
                f"1. **Pay Yourself First:** Automate your SIP on day 1 of the month.\n"
                f"2. **72-Hour Rule:** Wait 72 hours before buying non-essential items above INR 2,000.\n"
                f"3. **Audit Subscriptions:** Check for redundant streaming or app memberships."
            ),
            "suggestions": [
                "Show my top expenses",
                "What is my Confidence Score?",
                "Review my financial goals"
            ]
        }

    # 9. Recent Transactions
    if any(k in q for k in ["recent", "transactions", "statement", "latest", "history"]):
        txns = ctx["recent_transactions"][:5]
        if not txns:
            return {
                "reply": "No recent transactions found. Upload a CSV bank statement to analyze your latest transactions.",
                "suggestions": ["How to upload a statement?", "What format is supported?"]
            }

        lines = [f"- `{t['date']}` | **{t['description']}** | INR {t['amount']:,.2f} ({t['category']})" for t in txns]
        return {
            "reply": (
                f"📜 **Latest 5 Transactions from your Statement:**\n\n"
                + "\n".join(lines) +
                f"\n\nTotal transactions analyzed: **{ctx['transaction_count']}**"
            ),
            "suggestions": [
                "Where is most of my money going?",
                "What is my current savings rate?",
                "Can I afford my goals?"
            ]
        }

    # Default general financial assistance
    return {
        "reply": (
            f"💡 **Financial Assistant Overview for {ctx['user_name']}**\n\n"
            f"I have full context of your financial records:\n"
            f"- **Monthly Inflow:** INR {ctx['total_income']:,.2f}\n"
            f"- **Monthly Outflow:** INR {ctx['total_expense']:,.2f}\n"
            f"- **Savings Rate:** {ctx['savings_rate']}%\n"
            f"- **Confidence Score:** {ctx['score_data']['score']}/100\n\n"
            f"You can ask me specific questions like:\n"
            f"- *'How much did I spend on dining or shopping?'*\n"
            f"- *'What are my biggest expenses?'*\n"
            f"- *'Can I afford my vacation goal?'*\n"
            f"- *'How do I improve my Confidence Score to 90?'*"
        ),
        "suggestions": [
            "What are my biggest expenses?",
            "How can I improve my confidence score?",
            "Can I reach my financial goals?"
        ]
    }


def process_chat(user_id, message, history=None):
    """
    Main entry point for handling chat queries.
    Tries external LLM (Claude/GPT/Gemini) if configured, else seamlessly falls back to the local financial intelligence engine.
    """
    if not message or not str(message).strip():
        return {
            "reply": "Please enter a question or select a prompt suggestion.",
            "suggestions": ["What are my top expenses?", "How is my confidence score calculated?"]
        }

    ctx = build_financial_context(user_id)
    url = current_app.config.get("AI_API_URL")
    key = current_app.config.get("AI_API_KEY")

    if url and key:
        try:
            system_prompt = (
                f"You are Saarthi AI, an expert, encouraging personal wealth copilot for DhanSaarthi.\n"
                f"Here is the user's real-time financial context:\n"
                f"{json.dumps(ctx, indent=2)}\n\n"
                f"Instructions:\n"
                f"1. Answer the user's query accurately using their real metrics.\n"
                f"2. Use clean markdown (bold, bullet points, INR currency format).\n"
                f"3. Return a JSON object with 'reply' (markdown string) and 'suggestions' (array of 3 short follow-up question strings).\n"
                f"4. Be concise, actionable, and empathetic. Return ONLY valid JSON."
            )

            messages = [{"role": "system", "content": system_prompt}]
            if history and isinstance(history, list):
                for h in history[-4:]:
                    role = "assistant" if h.get("sender") == "bot" else "user"
                    messages.append({"role": role, "content": h.get("text", "")})
            messages.append({"role": "user", "content": message})

            response = requests.post(
                url,
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                json={
                    "model": "claude-3-haiku-20240307" if "anthropic" in url else "gpt-4o-mini",
                    "messages": messages,
                    "temperature": 0.3
                },
                timeout=10
            )
            if response.status_code == 200:
                result = response.json()
                content = ""
                if "choices" in result:
                    content = result["choices"][0]["message"]["content"]
                elif "content" in result:
                    content = result["content"]

                cleaned_content = content.replace("```json", "").replace("```", "").strip()
                parsed = json.loads(cleaned_content)
                if "reply" in parsed:
                    return {
                        "reply": parsed["reply"],
                        "suggestions": parsed.get("suggestions", [
                            "Where can I cut expenses?",
                            "How to improve my confidence score?",
                            "Can I afford my goals?"
                        ])
                    }
        except Exception as e:
            current_app.logger.warning(f"External LLM call failed: {e}. Using Saarthi AI local intelligence engine.")

    # Fallback to local financial NLP engine
    return rule_based_response(message, ctx)
