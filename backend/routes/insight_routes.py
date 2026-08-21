from flask import Blueprint, jsonify, request
from services.ai_service import get_recommendations_from_data
from services.auth_service import authenticate_request

insight_bp = Blueprint("insights", __name__)


@insight_bp.get("")
def insights():
    user_id = authenticate_request()
    recommendations = get_recommendations_from_data(user_id)
    return jsonify({"recommendations": recommendations})
