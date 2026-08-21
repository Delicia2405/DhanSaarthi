from datetime import date

from utils.db import db


class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    transaction_type = db.Column(db.String(20), nullable=False, default="expense")  # 'expense' or 'income'
    category = db.Column(db.String(80), nullable=False, default="Other")
    transaction_date = db.Column(db.Date, nullable=False, default=date.today)
    source = db.Column(db.String(120), nullable=False, default="manual")
    description = db.Column(db.String(255))

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "amount": float(self.amount),
            "type": self.transaction_type,
            "category": self.category,
            "date": self.transaction_date.isoformat(),
            "source": self.source,
            "description": self.description,
        }
