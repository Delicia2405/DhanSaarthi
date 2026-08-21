from datetime import datetime

from utils.db import db


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    transactions = db.relationship("Transaction", backref="user", cascade="all, delete-orphan")
    goals = db.relationship("Goal", backref="user", cascade="all, delete-orphan")
    profile = db.relationship("Profile", backref="user", uselist=False, cascade="all, delete-orphan")

    def to_dict(self):
        return {"id": self.id, "email": self.email, "name": self.name}
