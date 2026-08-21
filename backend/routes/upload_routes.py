from flask import Blueprint, jsonify, request

from models.transaction import Transaction
from models.user import User
from models.profile import Profile
from services.parser_service import parse_csv
from services.auth_service import authenticate_request
from utils.db import db

upload_bp = Blueprint("upload", __name__)


@upload_bp.post("")
def upload_statement():
    file = request.files.get("file")
    if not file or not file.filename.lower().endswith(".csv"):
        return jsonify({"error": "A valid CSV statement file is required"}), 400

    user_id = authenticate_request()

    # Ensure user exists
    user = User.query.get(user_id)
    if not user:
        user = User(id=user_id, email=f"user{user_id}@dhansaarthi.demo", name=f"Demo User {user_id}")
        db.session.add(user)
        # Also create initial profile if not present
        if not Profile.query.filter_by(user_id=user_id).first():
            profile = Profile(user_id=user_id, confidence_score=70, score_history=[])
            db.session.add(profile)
        db.session.commit()

    try:
        parsed_rows = parse_csv(file)
        if not parsed_rows:
            return jsonify({"error": "No valid transactions found in CSV"}), 400

        transactions = [Transaction(user_id=user_id, **row) for row in parsed_rows]
        db.session.add_all(transactions)
        db.session.commit()

        return jsonify({
            "status": "success",
            "imported": len(transactions),
            "transactions": [item.to_dict() for item in transactions]
        }), 201
    except (ValueError, KeyError) as error:
        db.session.rollback()
        return jsonify({"error": str(error)}), 400

