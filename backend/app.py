from flask import Flask
from flask_cors import CORS

from config import Config
import models
from utils.db import db
from routes.dashboard_routes import dashboard_bp
from routes.goal_routes import goal_bp
from routes.insight_routes import insight_bp
from routes.score_routes import score_bp
from routes.upload_routes import upload_bp


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    CORS(app)
    db.init_app(app)

    app.register_blueprint(upload_bp, url_prefix="/api/upload")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    app.register_blueprint(score_bp, url_prefix="/api/score")
    app.register_blueprint(goal_bp, url_prefix="/api/goals")
    app.register_blueprint(insight_bp, url_prefix="/api/insights")

    @app.get("/api/health")
    def health():
        return {"status": "ok", "service": "backend"}

    with app.app_context():
        db.create_all()

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
