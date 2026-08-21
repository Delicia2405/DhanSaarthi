import csv
from io import TextIOWrapper

from services.categorizer_service import categorize
from utils.validators import parse_date


def _clean_amount(val):
    if not val:
        return 0.0
    cleaned = str(val).replace(",", "").replace("₹", "").replace("$", "").replace("Rs.", "").replace("INR", "").strip()
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def parse_csv(file_storage):
    """
    Parses an uploaded CSV statement supporting various bank schemas:
    - Standard: Date, Description, Amount
    - 2-Column: Date, Description, Debit, Credit
    - With custom/pre-categorized columns: Date, Description, Amount, Category, Type
    """
    wrapper = TextIOWrapper(file_storage.stream, encoding="utf-8-sig")
    rows = csv.DictReader(wrapper)
    result = []

    for row in rows:
        if not row or not any(row.values()):
            continue

        # Case-insensitive key lookup helper
        def get_field(*keys):
            for k in keys:
                for row_key, val in row.items():
                    if row_key and row_key.strip().lower() == k.lower() and val is not None and str(val).strip() != "":
                        return str(val).strip()
            return None

        date_val = get_field("date", "txn date", "transaction date", "value date", "posting date", "txn_date")
        if not date_val:
            continue

        desc = get_field("description", "narration", "particulars", "details", "remarks", "merchant") or "Unknown"
        
        # Check debit vs credit columns
        debit_val = get_field("debit", "withdrawal", "withdrawal amount", "dr", "spent")
        credit_val = get_field("credit", "deposit", "deposit amount", "cr", "received")
        explicit_type = get_field("type", "txn_type", "transaction_type")
        explicit_cat = get_field("category", "tag")

        final_amount = 0.0
        inferred_type = explicit_type.lower() if explicit_type else None

        if credit_val and _clean_amount(credit_val) > 0:
            final_amount = _clean_amount(credit_val)
            inferred_type = "income"
        elif debit_val and _clean_amount(debit_val) > 0:
            final_amount = _clean_amount(debit_val)
            inferred_type = "expense"
        else:
            raw_amt_str = get_field("amount", "amt", "transaction amount", "net amount") or "0"
            raw_amt = _clean_amount(raw_amt_str)
            final_amount = abs(raw_amt)
            if raw_amt < 0 or (explicit_type and explicit_type.lower() in ("credit", "income", "cr")):
                inferred_type = "income"
            elif explicit_type and explicit_type.lower() in ("debit", "expense", "dr"):
                inferred_type = "expense"

        # Categorize
        if explicit_cat:
            cat_name = explicit_cat
            txn_type = inferred_type or ("income" if cat_name.lower() == "income" else "expense")
        else:
            cat_name, txn_type = categorize(desc, raw_amount=final_amount, txn_type=inferred_type)

        result.append({
            "amount": final_amount,
            "transaction_type": txn_type,
            "category": cat_name,
            "transaction_date": parse_date(date_val),
            "source": "csv",
            "description": desc,
        })

    return result

