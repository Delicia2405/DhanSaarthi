from datetime import date, datetime


def require_fields(payload, fields):
    missing = [field for field in fields if payload.get(field) in (None, "")]
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")


def parse_date(value):
    if isinstance(value, date):
        return value
    if isinstance(value, datetime):
        return value.date()
    if not value or not str(value).strip():
        return date.today()

    val_str = str(value).strip()
    # Try ISO format
    try:
        return date.fromisoformat(val_str)
    except ValueError:
        pass

    # Try common formats (e.g. DD/MM/YYYY, DD-MM-YYYY, YYYY/MM/DD, DD-Mon-YYYY)
    formats = [
        "%d/%m/%Y",
        "%d-%m-%Y",
        "%Y/%m/%d",
        "%d/%m/%y",
        "%d-%m-%y",
        "%d %b %Y",
        "%d-%b-%Y",
        "%d %B %Y",
        "%d-%B-%Y",
        "%Y-%m-%d %H:%M:%S",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(val_str, fmt).date()
        except ValueError:
            continue

    raise ValueError(f"Unable to parse date: '{value}'. Expected YYYY-MM-DD or DD/MM/YYYY format.")

