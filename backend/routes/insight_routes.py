from flask import Blueprint, jsonify, request

from models.profile import Profile
from services.ai_service import get_recommendations

insight_bp = Blueprint("insights", __name__)


@insight_bp.get("")
def insights():
    user_id = request.args.get("user_id", 1, type=int)
    profile = Profile.query.filter_by(user_id=user_id).first()
    return jsonify({"recommendations": get_recommendations(profile.to_dict() if profile else {"confidence_score": 0})})
