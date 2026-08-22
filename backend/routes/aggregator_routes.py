from datetime import date, timedelta
import random
from flask import Blueprint, jsonify, request
from models.transaction import Transaction
from models.user import User
from models.profile import Profile
from services.auth_service import authenticate_request
from services.categorizer_service import categorize
from utils.db import db

aggregator_bp = Blueprint("aggregator", __name__)

# Sample discoverable Indian banks under RBI AA Framework
MOCK_FIPS = [
    {
        "id": "acc_hdfc_01",
        "bank_name": "HDFC Bank",
        "account_type": "Salary Account",
        "account_number": "XXXX-XXXX-4812",
        "ifsc": "HDFC0001234",
        "balance": 85400.00,
        "branch": "Indiranagar, Bengaluru",
        "logo_color": "#004c8f"
    },
    {
        "id": "acc_sbi_02",
        "bank_name": "State Bank of India",
        "account_type": "Savings Account",
        "account_number": "XXXX-XXXX-9031",
        "ifsc": "SBIN0004567",
        "balance": 142800.00,
        "branch": "MG Road, Bengaluru",
        "logo_color": "#280071"
    },
    {
        "id": "acc_icici_03",
        "bank_name": "ICICI Bank",
        "account_type": "Emergency Savings",
        "account_number": "XXXX-XXXX-2240",
        "ifsc": "ICIC0007890",
        "balance": 65200.00,
        "branch": "Koramangala, Bengaluru",
        "logo_color": "#f37021"
    },
    {
        "id": "acc_axis_04",
        "bank_name": "Axis Bank",
        "account_type": "Secondary Savings",
        "account_number": "XXXX-XXXX-7719",
        "ifsc": "UTIB0003210",
        "balance": 28500.00,
        "branch": "Whitefield, Bengaluru",
        "logo_color": "#97144d"
    },
    {
        "id": "acc_kotak_05",
        "bank_name": "Kotak Mahindra Bank",
        "account_type": "Everyday Spending",
        "account_number": "XXXX-XXXX-5512",
        "ifsc": "KKBK0006543",
        "balance": 14350.00,
        "branch": "HSR Layout, Bengaluru",
        "logo_color": "#ed1c24"
    }
]


@aggregator_bp.post("/discover")
def discover_accounts():
    """
    Simulates discovering linked bank accounts for a user's mobile number / AA VPA.
    """
    user_id = authenticate_request()
    data = request.get_json(silent=True) or {}
    phone = data.get("phone", "").strip()
    aa_handle = data.get("aa_handle", "finvu").strip()

    if not phone or len(phone) < 10:
        return jsonify({"error": "A valid 10-digit mobile number is required"}), 400

    return jsonify({
        "status": "success",
        "phone": phone,
        "aa_handle": f"{phone}@{aa_handle}",
        "accounts_found": len(MOCK_FIPS),
        "accounts": MOCK_FIPS
    }), 200


@aggregator_bp.post("/request-otp")
def request_otp():
    """
    Generates an RBI-compliant consent artifact and sends a verification OTP.
    """
    user_id = authenticate_request()
    data = request.get_json(silent=True) or {}
    phone = data.get("phone", "9876543210")
    selected_account_ids = data.get("selected_account_ids", [])

    if not selected_account_ids:
        return jsonify({"error": "At least one bank account must be selected"}), 400

    session_id = f"aa_sess_{random.randint(100000, 999999)}"
    
    consent_artifact = {
        "consent_id": f"CONSENT-{random.randint(10000, 99999)}",
        "purpose": "Personal Financial Management & Automated Wealth Insights",
        "data_consumer": "DhanSaarthi Wealth AI (FIU)",
        "data_frequency": "Periodic / Real-Time Daily",
        "data_range": "Past 6 Months to Current",
        "valid_until": (date.today() + timedelta(days=365)).isoformat(),
        "revocable": True
    }

    return jsonify({
        "status": "success",
        "session_id": session_id,
        "otp_hint": "123456",
        "consent_artifact": consent_artifact,
        "message": f"OTP sent to mobile ending with ...{phone[-4:] if len(phone)>=4 else '3210'}"
    }), 200


@aggregator_bp.post("/verify-consent")
def verify_consent():
    """
    Verifies OTP, authorizes consent, fetches multi-bank transactions, and inserts into DB.
    """
    user_id = authenticate_request()
    data = request.get_json(silent=True) or {}
    otp = str(data.get("otp", "")).strip()
    selected_account_ids = data.get("selected_account_ids", [])

    if otp != "123456" and len(otp) != 6:
        return jsonify({"error": "Invalid or expired OTP. Please use 123456 for demo."}), 400

    if not selected_account_ids:
        return jsonify({"error": "No accounts selected for data fetch"}), 400

    user = db.session.get(User, user_id)
    if not user:
        user = User(id=user_id, email=f"user{user_id}@dhansaarthi.demo", name=f"Demo User {user_id}")
        db.session.add(user)
        db.session.commit()

    # Generate rich real-world multi-bank transactions
    matched_accounts = [acc for acc in MOCK_FIPS if acc["id"] in selected_account_ids]
    generated_txns = []

    today = date.today()
    
    # Template bank streams
    for acc in matched_accounts:
        bank = acc["bank_name"]
        
        if "HDFC" in bank:
            # Salary stream & main expenses
            generated_txns.extend([
                Transaction(user_id=user_id, amount=85000, transaction_type="income", category="Income", description=f"{bank} - Salary Credit Tech Corp", transaction_date=today - timedelta(days=22), source=f"AA:{bank}"),
                Transaction(user_id=user_id, amount=85000, transaction_type="income", category="Income", description=f"{bank} - Salary Credit Tech Corp", transaction_date=today - timedelta(days=52), source=f"AA:{bank}"),
                Transaction(user_id=user_id, amount=22000, transaction_type="expense", category="Housing & Rent", description=f"{bank} - House Rent Payment", transaction_date=today - timedelta(days=20), source=f"AA:{bank}"),
                Transaction(user_id=user_id, amount=15000, transaction_type="expense", category="Investments", description=f"{bank} - Zerodha Nifty 50 SIP", transaction_date=today - timedelta(days=15), source=f"AA:{bank}"),
                Transaction(user_id=user_id, amount=3400, transaction_type="expense", category="Shopping", description=f"{bank} - Amazon Electronics", transaction_date=today - timedelta(days=12), source=f"AA:{bank}"),
                Transaction(user_id=user_id, amount=1850, transaction_type="expense", category="Utilities", description=f"{bank} - Bescom Electricity Bill", transaction_date=today - timedelta(days=18), source=f"AA:{bank}")
            ])
        elif "State Bank" in bank or "SBI" in bank:
            # Savings & recurring bills
            generated_txns.extend([
                Transaction(user_id=user_id, amount=5000, transaction_type="expense", category="Investments", description=f"{bank} - SBI Mutual Fund Bluechip SIP", transaction_date=today - timedelta(days=14), source=f"AA:{bank}"),
                Transaction(user_id=user_id, amount=4800, transaction_type="expense", category="Groceries", description=f"{bank} - DMart Supermarket Monthly", transaction_date=today - timedelta(days=19), source=f"AA:{bank}"),
                Transaction(user_id=user_id, amount=1200, transaction_type="expense", category="Utilities", description=f"{bank} - Airtel Broadband", transaction_date=today - timedelta(days=16), source=f"AA:{bank}"),
                Transaction(user_id=user_id, amount=2500, transaction_type="expense", category="Transport", description=f"{bank} - HPCL Petrol Fuel Auto-debit", transaction_date=today - timedelta(days=9), source=f"AA:{bank}")
            ])
        elif "ICICI" in bank:
            # Emergency fund growth & freelance payouts
            generated_txns.extend([
                Transaction(user_id=user_id, amount=15000, transaction_type="income", category="Income", description=f"{bank} - Freelance UI/UX Consulting", transaction_date=today - timedelta(days=7), source=f"AA:{bank}"),
                Transaction(user_id=user_id, amount=1250, transaction_type="expense", category="Food & Dining", description=f"{bank} - Swiggy Gourmet Dinner", transaction_date=today - timedelta(days=5), source=f"AA:{bank}"),
                Transaction(user_id=user_id, amount=649, transaction_type="expense", category="Entertainment", description=f"{bank} - Netflix Monthly", transaction_date=today - timedelta(days=17), source=f"AA:{bank}")
            ])
        elif "Axis" in bank:
            # Lifestyle & dining
            generated_txns.extend([
                Transaction(user_id=user_id, amount=2100, transaction_type="expense", category="Health & Fitness", description=f"{bank} - Cult.fit Membership", transaction_date=today - timedelta(days=10), source=f"AA:{bank}"),
                Transaction(user_id=user_id, amount=850, transaction_type="expense", category="Food & Dining", description=f"{bank} - Zomato Food Delivery", transaction_date=today - timedelta(days=4), source=f"AA:{bank}"),
                Transaction(user_id=user_id, amount=999, transaction_type="expense", category="Shopping", description=f"{bank} - Myntra Apparel", transaction_date=today - timedelta(days=8), source=f"AA:{bank}")
            ])
        elif "Kotak" in bank:
            # Daily quick UPI spends
            generated_txns.extend([
                Transaction(user_id=user_id, amount=450, transaction_type="expense", category="Food & Dining", description=f"{bank} - Starbucks Coffee", transaction_date=today - timedelta(days=3), source=f"AA:{bank}"),
                Transaction(user_id=user_id, amount=1200, transaction_type="expense", category="Groceries", description=f"{bank} - Blinkit Instant Groceries", transaction_date=today - timedelta(days=2), source=f"AA:{bank}"),
                Transaction(user_id=user_id, amount=380, transaction_type="expense", category="Transport", description=f"{bank} - Uber Ride", transaction_date=today - timedelta(days=1), source=f"AA:{bank}")
            ])

    db.session.add_all(generated_txns)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": f"Successfully linked {len(matched_accounts)} bank account(s) via RBI Account Aggregator!",
        "imported_transactions_count": len(generated_txns),
        "linked_accounts": matched_accounts,
        "sync_timestamp": today.isoformat()
    }), 200


@aggregator_bp.get("/linked-accounts")
def get_linked_accounts():
    """
    Returns the list of currently linked FIP bank accounts.
    """
    user_id = authenticate_request()
    # Check distinct AA sources in transactions
    txns = Transaction.query.filter_by(user_id=user_id).filter(Transaction.source.like("AA:%")).all()
    sources = set(t.source.replace("AA:", "") for t in txns)
    
    linked = [acc for acc in MOCK_FIPS if any(acc["bank_name"] in s for s in sources)]
    if not linked:
        linked = MOCK_FIPS[:2]  # Default preview

    return jsonify({
        "status": "success",
        "linked_accounts": linked,
        "total_balance": sum(a["balance"] for a in linked)
    }), 200
