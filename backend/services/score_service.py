from models.transaction import Transaction


def calculate_score(user_id):
    count = Transaction.query.filter_by(user_id=user_id).count()
    categories = Transaction.query.with_entities(Transaction.category).filter_by(user_id=user_id).distinct().count()
    return min(100, min(60, count * 5) + min(40, categories * 8))
