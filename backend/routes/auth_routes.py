from flask import Blueprint, jsonify, request
from models.user import User
from models.profile import Profile
from services.auth_service import generate_auth_token, authenticate_request
from utils.db import db
from utils.validators import require_fields, validate_email, validate_password
from utils.rate_limiter import rate_limit

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/register")
@rate_limit(limit=5, period=60)
def register():
    payload = request.get_json(silent=True) or {}
    try:
        require_fields(payload, ["name", "email", "password"])
        email = validate_email(payload["email"])
        password = validate_password(payload["password"])
        name = payload["name"].strip()

        if not name:
            return jsonify({"error": "Name field cannot be empty"}), 400

        # Check if user already exists
        if User.query.filter_by(email=email).first():
            return jsonify({"error": "A user with this email already exists"}), 400

        user = User(email=email, name=name)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        # Seed profile if not exists
        profile = Profile(user_id=user.id, confidence_score=70, score_history=[])
        db.session.add(profile)
        db.session.commit()

        token = generate_auth_token(user.id)
        return jsonify({
            "status": "success",
            "token": token,
            "user": user.to_dict()
        }), 201
    except (ValueError, TypeError) as error:
        db.session.rollback()
        return jsonify({"error": str(error)}), 400


@auth_bp.post("/login")
@rate_limit(limit=5, period=60)
def login():
    payload = request.get_json(silent=True) or {}
    try:
        require_fields(payload, ["email", "password"])
        email = validate_email(payload["email"])
        password = payload["password"]

        user = User.query.filter_by(email=email).first()
        if not user or not user.check_password(password):
            return jsonify({"error": "Invalid email or password"}), 401

        token = generate_auth_token(user.id)
        return jsonify({
            "status": "success",
            "token": token,
            "user": user.to_dict()
        }), 200
    except (ValueError, TypeError) as error:
        return jsonify({"error": str(error)}), 400


@auth_bp.get("/me")
def me():
    try:
        user_id = authenticate_request()
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        return jsonify({
            "status": "success",
            "user": user.to_dict()
        }), 200
    except Exception as error:
        return jsonify({"error": str(error)}), 401
