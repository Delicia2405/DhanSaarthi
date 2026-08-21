from datetime import datetime

from flask import Blueprint, jsonify, request

from models.profile import Profile
from services.score_service import calculate_score
from utils.db import db

score_bp = Blueprint("score", __name__)


@score_bp.get("")
def score():
    user_id = request.args.get("user_id", 1, type=int)
    current_score = calculate_score(user_id)
    profile = Profile.query.filter_by(user_id=user_id).first()
    if not profile:
        profile = Profile(user_id=user_id, confidence_score=current_score, score_history=[])
        db.session.add(profile)
    else:
        profile.confidence_score = current_score
    profile.score_history = [*profile.score_history, {"date": datetime.utcnow().date().isoformat(), "score": current_score}][-30:]
    db.session.commit()
    return jsonify(profile.to_dict())
