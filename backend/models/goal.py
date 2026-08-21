from utils.db import db


class Goal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    target_amount = db.Column(db.Numeric(12, 2), nullable=False)
    saved_amount = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    target_date = db.Column(db.Date, nullable=False)

    def to_dict(self):
        from services.goal_service import gap_analysis
        return {"id": self.id, "name": self.name, "target_amount": float(self.target_amount), "saved_amount": float(self.saved_amount), "target_date": self.target_date.isoformat(), **gap_analysis(self)}
