import os
import requests
from flask import current_app
from models.transaction import Transaction
from models.goal import Goal
from services.score_service import calculate_score
from services.goal_service import gap_analysis

def get_recommendations_from_data(user_id):
    """
    Tries to call the Claude API to get recommendations.
    Falls back to a high-fidelity rule-based engine if the API is offline or not configured.
    """
    # Gather financial metrics
    transactions = Transaction.query.filter_by(user_id=user_id).all()
    goals = Goal.query.filter_by(user_id=user_id).all()

    total_income = sum(float(t.amount) for t in transactions if t.transaction_type == "income" or t.category == "Income")
    total_expense = sum(float(t.amount) for t in transactions if t.transaction_type == "expense" and t.category != "Income")
    net_savings = total_income - total_expense
    savings_rate = (net_savings / total_income * 100) if total_income > 0 else 0.0

    # Categorize discretionary spending
    discretionary_categories = {"shopping", "entertainment", "personal care", "food & dining"}
    category_spends = {}
    for t in transactions:
        if t.transaction_type == "expense":
            cat = t.category
            category_spends[cat] = category_spends.get(cat, 0.0) + float(t.amount)

    sorted_spends = sorted(category_spends.items(), key=lambda x: x[1], reverse=True)
    top_discretionary_cat = None
    top_discretionary_amt = 0.0
    for cat, amt in sorted_spends:
        if cat.lower() in discretionary_categories:
            top_discretionary_cat = cat
            top_discretionary_amt = amt
            break

    # Calculate emergency fund coverage
    months_set = {t.transaction_date.strftime("%Y-%m") for t in transactions}
    num_months = max(len(months_set), 1)
    avg_monthly_expense = total_expense / num_months
    months_covered = net_savings / avg_monthly_expense if avg_monthly_expense > 0 and net_savings > 0 else 0.0

    # Goal details
    first_goal_gap = None
    if goals:
        g = goals[0]
        gap_info = gap_analysis(g)
        first_goal_gap = {
            "name": g.name,
            "shortfall": gap_info["shortfall"],
            "suggested_monthly_increase": gap_info["suggested_monthly_increase"]
        }

    # Prepare data package for the LLM
    data_payload = {
        "total_income": total_income,
        "total_expense": total_expense,
        "savings_rate": round(savings_rate, 1),
        "months_covered": round(months_covered, 1),
        "top_discretionary_category": top_discretionary_cat,
        "top_discretionary_amount": top_discretionary_amt,
        "first_goal": first_goal_gap
    }

    url = current_app.config.get("AI_API_URL")
    key = current_app.config.get("AI_API_KEY")

    if url and key:
        try:
            prompt = (
                f"You are DhanSaarthi AI, a premium personal wealth assistant. Analyze the user's financial metrics:\n"
                f"{data_payload}\n"
                f"Generate exactly 3 key actionable recommendations formatted as JSON with an array named 'insights'.\n"
                f"Each insight must have:\n"
                f"- 'type': 'warning' (🔴 for warnings/issues), 'action' (🟢 for recommendations), or 'info' (🟡 for general tips)\n"
                f"- 'icon': '🔴', '🟢', or '🟡'\n"
                f"- 'text': A clear, short financial advice (1-2 sentences maximum) explaining the metric and what step to take.\n"
                f"Return ONLY valid JSON. No conversational text."
            )
            response = requests.post(
                url, 
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                json={
                    "model": "claude-3-haiku-20240307" if "anthropic" in url else "gpt-4o-mini",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.2
                },
                timeout=8
            )
            if response.status_code == 200:
                result = response.json()
                # Parse choices or options
                content = ""
                if "choices" in result:
                    content = result["choices"][0]["message"]["content"]
                elif "content" in result:
                    content = result["content"]
                
                # Clean JSON fences if LLM returns them
                import json
                cleaned_content = content.replace("```json", "").replace("```", "").strip()
                parsed = json.loads(cleaned_content)
                if "insights" in parsed and len(parsed["insights"]) >= 2:
                    return parsed["insights"]
        except Exception as e:
            current_app.logger.warning(f"AI API request failed: {e}. Falling back to rule-based engine.")

    # Fallback Rule-Based Engine
    insights = []

    # 1. Savings Rate recommendation
    if savings_rate < 15.0:
        insights.append({
            "type": "warning",
            "icon": "🔴",
            "text": f"Your monthly savings rate is only {round(savings_rate, 1)}%, which is below the target threshold of 30%. This slows down your wealth growth."
        })
        insights.append({
            "type": "action",
            "icon": "🟢",
            "text": "Set up an automated sweep-in deposit to lock in 15% of your paycheck the day it arrives, ensuring you 'pay yourself first'."
        })
    elif savings_rate < 30.0:
        insights.append({
            "type": "info",
            "icon": "🟡",
            "text": f"Your savings rate is healthy at {round(savings_rate, 1)}%, but rising to 30% could accelerate your financial goals by up to 2 years."
        })
        insights.append({
            "type": "action",
            "icon": "🟢",
            "text": "Review subscription bills. Cancelling two unused video/audio streaming plans could push your savings rate closer to the 30% target."
        })
    else:
        insights.append({
            "type": "info",
            "icon": "🟢",
            "text": f"Excellent! Your savings rate is a stellar {round(savings_rate, 1)}%. You are in the top tier of saving efficiency."
        })

    # 2. Category spikes recommendation
    if top_discretionary_cat and top_discretionary_amt > 0:
        pct_of_spend = (top_discretionary_amt / total_expense) * 100 if total_expense > 0 else 0.0
        if pct_of_spend > 25.0:
            insights.append({
                "type": "warning",
                "icon": "🔴",
                "text": f"Discretionary spending on {top_discretionary_cat} represents {round(pct_of_spend, 1)}% (INR {top_discretionary_amt:,.2f}) of your expenses."
            })
            insights.append({
                "type": "action",
                "icon": "🟢",
                "text": f"Capping {top_discretionary_cat} at INR {round(top_discretionary_amt * 0.8):,} (a 20% reduction) next month adds INR {round(top_discretionary_amt * 0.2):,} directly to your savings."
            })

    # 3. Emergency fund check
    if months_covered < 3.0:
        insights.append({
            "type": "warning",
            "icon": "🔴",
            "text": f"Your current emergency fund covers only {round(months_covered, 1)} months of essential expenses, leaving you exposed to financial shocks."
        })
        insights.append({
            "type": "action",
            "icon": "🟢",
            "text": f"Direct your next INR {round(avg_monthly_expense * 3):,} of net savings to a separate high-yield liquid fund to secure a 3-month basic buffer."
        })
    elif months_covered < 6.0:
        insights.append({
            "type": "info",
            "icon": "🟡",
            "text": f"Your emergency fund is in progress covering {round(months_covered, 1)} months. Building it to 6 months guarantees complete safety."
        })

    # 4. Goal analysis
    if first_goal_gap and first_goal_gap["shortfall"] > 0:
        insights.append({
            "type": "warning",
            "icon": "🔴",
            "text": f"You have a projected shortfall of INR {first_goal_gap['shortfall']:,.2f} for your '{first_goal_gap['name']}' goal."
        })
        insights.append({
            "type": "action",
            "icon": "🟢",
            "text": f"Increase your monthly savings allocation by INR {first_goal_gap['suggested_monthly_increase']:,.2f} to meet your target date."
        })

    # Ensure we return exactly 3-4 diverse insights
    return insights[:4]


def classify_risk_profile(answers):
    """
    Classifies the user's risk tolerance based on a 3-question survey:
    Q1: Primary financial goal (growth / balance / safety)
    Q2: Reaction to 20% market drop (buy / hold / sell)
    Q3: Investment horizon (short / medium / long)
    """
    g = answers.get("goal", "balance").lower()
    r = answers.get("reaction", "hold").lower()
    h = answers.get("horizon", "medium").lower()

    # Rule-based scoring:
    # High score = higher risk appetite
    score = 0
    
    if g == "growth":
        score += 3
    elif g == "balance":
        score += 2
    else:
        score += 1
        
    if r == "buy":
        score += 3
    elif r == "hold":
        score += 2
    else:
        score += 1
        
    if h == "long":
        score += 3
    elif h == "medium":
        score += 2
    else:
        score += 1

    if score >= 8:
        profile = "Aggressive"
        description = "You prioritize wealth growth over capital preservation. You have a high capacity to withstand short-term volatility in exchange for potential long-term compounding benefits."
        allocation = {"equities": 75, "debt_bonds": 15, "cash_fds": 10}
    elif score >= 5:
        profile = "Moderate"
        description = "You seek a balanced approach, seeking growth while maintaining a buffer against steep market swings. A diversified mix of equity and debt suits your wealth-creation needs."
        allocation = {"equities": 50, "debt_bonds": 30, "cash_fds": 20}
    else:
        profile = "Conservative"
        description = "You prioritize capital safety and regular interest income. You have a low tolerance for portfolio fluctuations and prefer secure channels like fixed deposits and high-quality debt."
        allocation = {"equities": 20, "debt_bonds": 50, "cash_fds": 30}

    return {
        "risk_profile": profile,
        "description": description,
        "allocation": allocation,
        "score": score
    }
