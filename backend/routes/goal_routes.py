from flask import Blueprint, jsonify, request

from models.goal import Goal
from services.goal_service import gap_analysis
from utils.db import db
from utils.validators import parse_date, require_fields

goal_bp = Blueprint("goals", __name__)


@goal_bp.get("")
def list_goals():
    user_id = request.args.get("user_id", 1, type=int)
    return jsonify([goal.to_dict() for goal in Goal.query.filter_by(user_id=user_id).all()])


@goal_bp.post("")
def create_goal():
    payload = request.get_json(silent=True) or {}
    try:
        require_fields(payload, ["name", "target_amount", "target_date"])
        goal = Goal(user_id=payload.get("user_id", 1), name=payload["name"], target_amount=payload["target_amount"], saved_amount=payload.get("saved_amount", 0), target_date=parse_date(payload["target_date"]))
        db.session.add(goal)
        db.session.commit()
        return jsonify(goal.to_dict()), 201
    except (ValueError, TypeError) as error:
        db.session.rollback()
        return jsonify({"error": str(error)}), 400


@goal_bp.get("/<int:goal_id>/gap")
def goal_gap(goal_id):
    goal = Goal.query.get_or_404(goal_id)
    return jsonify(gap_analysis(goal))
