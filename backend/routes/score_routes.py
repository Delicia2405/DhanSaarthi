from datetime import datetime

from flask import Blueprint, jsonify, request

from models.profile import Profile
from services.score_service import calculate_score
from services.auth_service import authenticate_request
from utils.db import db

score_bp = Blueprint("score", __name__)


@score_bp.get("")
def score():
    user_id = authenticate_request()
    score_details = calculate_score(user_id)
    overall_score = score_details["score"]
    
    profile = Profile.query.filter_by(user_id=user_id).first()
    if not profile:
        profile = Profile(user_id=user_id, confidence_score=overall_score, score_history=[])
        db.session.add(profile)
    else:
        profile.confidence_score = overall_score
        
    # Prevent duplicate history entries for the same day
    today_iso = datetime.utcnow().date().isoformat()
    history = [h for h in profile.score_history if h.get("date") != today_iso]
    history.append({"date": today_iso, "score": overall_score})
    profile.score_history = history[-30:]
    
    db.session.commit()
    
    res_data = profile.to_dict()
    res_data["breakdown"] = score_details["breakdown"]
    return jsonify(res_data)
