from flask import Blueprint, jsonify, request
from services.ai_service import classify_risk_profile
from services.auth_service import authenticate_request
from models.profile import Profile
from models.user import User
from utils.db import db

risk_bp = Blueprint("risk", __name__)


@risk_bp.post("")
def risk_profile():
    payload = request.get_json(silent=True) or {}
    user_id = authenticate_request()
    
    result = classify_risk_profile(payload)
    
    # Ensure user exists
    user = User.query.get(user_id)
    if not user:
        user = User(id=user_id, email=f"user{user_id}@dhansaarthi.demo", name=f"Demo User {user_id}")
        db.session.add(user)
        
    profile = Profile.query.filter_by(user_id=user_id).first()
    if not profile:
        profile = Profile(user_id=user_id, confidence_score=0, score_history=[], risk_profile=result)
        db.session.add(profile)
    else:
        profile.risk_profile = result
        
    db.session.commit()
    return jsonify(result)
