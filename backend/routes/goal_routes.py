from flask import Blueprint, jsonify, request

from models.goal import Goal
from services.goal_service import gap_analysis
from services.auth_service import authenticate_request
from utils.db import db
from utils.validators import parse_date, require_fields, validate_number

goal_bp = Blueprint("goals", __name__)


@goal_bp.get("")
def list_goals():
    user_id = authenticate_request()
    return jsonify([goal.to_dict() for goal in Goal.query.filter_by(user_id=user_id).all()])


@goal_bp.post("")
def create_goal():
    user_id = authenticate_request()
    payload = request.get_json(silent=True) or {}
    try:
        require_fields(payload, ["name", "target_amount", "target_date"])
        target_amount = validate_number(payload["target_amount"], "Target amount", min_val=1.0)
        saved_amount = validate_number(payload.get("saved_amount", 0), "Saved amount", min_val=0.0)
        
        goal = Goal(user_id=user_id, name=payload["name"], target_amount=target_amount, saved_amount=saved_amount, target_date=parse_date(payload["target_date"]))
        db.session.add(goal)
        db.session.commit()
        return jsonify(goal.to_dict()), 201
    except (ValueError, TypeError) as error:
        db.session.rollback()
        return jsonify({"error": str(error)}), 400


@goal_bp.get("/<int:goal_id>/gap")
def goal_gap(goal_id):
    user_id = authenticate_request()
    goal = Goal.query.filter_by(id=goal_id, user_id=user_id).first_or_404()
    return jsonify(gap_analysis(goal))


@goal_bp.put("/<int:goal_id>")
def update_goal(goal_id):
    user_id = authenticate_request()
    goal = Goal.query.filter_by(id=goal_id, user_id=user_id).first_or_404()
    payload = request.get_json(silent=True) or {}
    try:
        if "name" in payload:
            goal.name = payload["name"]
        if "target_amount" in payload:
            goal.target_amount = validate_number(payload["target_amount"], "Target amount", min_val=1.0)
        if "saved_amount" in payload:
            goal.saved_amount = validate_number(payload["saved_amount"], "Saved amount", min_val=0.0)
        if "target_date" in payload:
            goal.target_date = parse_date(payload["target_date"])
        db.session.commit()
        return jsonify(goal.to_dict())
    except (ValueError, TypeError) as error:
        db.session.rollback()
        return jsonify({"error": str(error)}), 400


@goal_bp.delete("/<int:goal_id>")
def delete_goal(goal_id):
    user_id = authenticate_request()
    goal = Goal.query.filter_by(id=goal_id, user_id=user_id).first_or_404()
    db.session.delete(goal)
    db.session.commit()
    return jsonify({"status": "success", "message": f"Goal {goal_id} deleted."})
