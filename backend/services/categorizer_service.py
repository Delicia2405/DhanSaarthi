import re

# Comprehensive keyword-to-category mapping
CATEGORY_RULES = {
    "Income": [
        "salary", "payroll", "stipend", "bonus", "dividend", "interest credited",
        "neft inward", "rtgs inward", "imps inward", "upi/cr", "credit interest",
        "refund", "cashback", "freelance", "consulting", "allowance", "reimbursement"
    ],
    "Food & Dining": [
        "swiggy", "zomato", "restaurant", "cafe", "starbucks", "mcdonald", "kfc",
        "burger king", "domino", "pizza", "subway", "eatsure", "chai point", "chaayos",
        "biryani", "dhaba", "barbeque", "haldiram", "bikanervala", "bakery", "dining", "food"
    ],
    "Groceries": [
        "blinkit", "zepto", "bigbasket", "bb daily", "instamart", "dmart", "spencer",
        "supermarket", "hypermarket", "kirana", "provision", "dairy", "mother dairy",
        "nature's basket", "smart bazaar", "reliance fresh", "country delight"
    ],
    "Transport": [
        "uber", "ola", "rapido", "metro", "fuel", "petrol", "diesel", "hpcl", "iocl",
        "bpcl", "shell", "fastag", "toll", "auto", "railway", "irctc", "flight",
        "indigo", "air india", "redbus", "makemytrip", "easemytrip", "yatra"
    ],
    "Shopping": [
        "amazon", "flipkart", "myntra", "ajio", "nykaa", "meesho", "zara", "h&m",
        "decathlon", "tata cliq", "uniqlo", "lifestyle", "shoppers stop", "westside",
        "electronics", "croma", "reliance digital", "apple store", "clothing", "apparel"
    ],
    "Housing & Rent": [
        "rent", "nobroker", "society maintenance", "landlord", "flat maintenance",
        "house rent", "apartment"
    ],
    "Utilities": [
        "electricity", "bescom", "tata power", "torrent power", "adani electricity",
        "water bill", "gas", "indane", "bharat gas", "hp gas", "broadband", "wifi",
        "act fibernet", "airtel broadband", "jio fiber", "jiofiber", "airtel",
        "jio", "vodafone", "vi ", "dth", "tata play", "tatasky"
    ],
    "Entertainment": [
        "netflix", "spotify", "prime video", "hotstar", "disney", "apple music",
        "youtube", "bookmyshow", "pvr", "inox", "cinepolis", "steam", "playstation",
        "gaming", "movie", "theatre", "audible"
    ],
    "Health & Fitness": [
        "apollo", "1mg", "pharmeasy", "medplus", "netmeds", "hospital", "clinic",
        "doctor", "dental", "diagnostics", "lab", "pharmacy", "medicine", "cult.fit",
        "cultfit", "gym", "fitness"
    ],
    "Investments": [
        "zerodha", "groww", "upstox", "coin", "kuvera", "sip", "mutual fund",
        "indmoney", "ppf", "nps", "uti mutual", "hdfc mutual", "icici prudential",
        "sbi mutual", "sharekhan", "angel one", "smallcase", "etmoney"
    ],
    "Bills & Loans": [
        "credit card", "cc payment", "cred", "emi", "loan", "bajaj finserv",
        "hdfc card", "icici card", "sbi card", "axis card", "amex", "kotak card"
    ],
    "Personal Care": [
        "urban company", "salon", "spa", "enrich", "jawed habib", "grooming", "haircut"
    ],
    "Education": [
        "udemy", "coursera", "school fee", "college fee", "tuition", "education",
        "books", "stationery"
    ]
}


def categorize(description, raw_amount=0, txn_type=None):
    """
    Categorizes a transaction based on description and determines its type ('income' or 'expense').
    Returns a tuple: (category_name, transaction_type)
    """
    text = (description or "").lower().strip()

    # Determine type if explicitly provided or inferred from negative amount/keywords
    inferred_type = txn_type
    if not inferred_type:
        try:
            amt_num = float(raw_amount)
            if amt_num < 0:
                inferred_type = "income"
        except (ValueError, TypeError):
            pass

    # Check for Income patterns
    for kw in CATEGORY_RULES["Income"]:
        if kw in text:
            return "Income", "income"

    # Match expense categories
    for category, keywords in CATEGORY_RULES.items():
        if category == "Income":
            continue
        for kw in keywords:
            if re.search(rf"\b{re.escape(kw)}\b", text) or kw in text:
                return category, (inferred_type or "expense")

    # Default fallback
    if inferred_type == "income":
        return "Income", "income"
    return "Other", (inferred_type or "expense")

