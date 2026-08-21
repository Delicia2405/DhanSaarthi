from datetime import datetime

from utils.db import db


class Profile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), unique=True, nullable=False)
    confidence_score = db.Column(db.Integer, default=0, nullable=False)
    score_history = db.Column(db.JSON, default=list, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {"confidence_score": self.confidence_score, "score_history": self.score_history, "updated_at": self.updated_at.isoformat() if self.updated_at else None}
