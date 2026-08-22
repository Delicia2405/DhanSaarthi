from flask import Blueprint, jsonify, request
from services.auth_service import authenticate_request
from services.chat_service import process_chat

chat_bp = Blueprint("chat", __name__)


@chat_bp.post("")
def chat():
    user_id = authenticate_request()
    data = request.get_json() or {}
    message = data.get("message", "")
    history = data.get("history", [])

    if not message or not str(message).strip():
        return jsonify({"error": "Message is required"}), 400

    result = process_chat(user_id, message, history)
    return jsonify({
        "status": "success",
        "reply": result["reply"],
        "suggestions": result.get("suggestions", [])
    }), 200
