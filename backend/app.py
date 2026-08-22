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
from routes.risk_routes import risk_bp
from routes.auth_routes import auth_bp
from routes.chat_routes import chat_bp


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Restrict CORS to specific frontend origins to prevent wildcard access
    CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}}, supports_credentials=True)
    
    db.init_app(app)

    app.register_blueprint(upload_bp, url_prefix="/api/upload")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    app.register_blueprint(score_bp, url_prefix="/api/score")
    app.register_blueprint(goal_bp, url_prefix="/api/goals")
    app.register_blueprint(insight_bp, url_prefix="/api/insights")
    app.register_blueprint(risk_bp, url_prefix="/api/risk-profile")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(chat_bp, url_prefix="/api/chat")

    @app.get("/api/health")
    def health():
        return {"status": "ok", "service": "backend"}

    @app.errorhandler(Exception)
    def handle_global_error(error):
        from werkzeug.exceptions import HTTPException
        code = 500
        message = "An internal server error occurred"
        if isinstance(error, HTTPException):
            code = error.code
            message = error.description
        
        # Log stack trace internally
        app.logger.error(f"Global error handler caught: {error}", exc_info=True)
        
        # Sanitize output payload to prevent leakage of internal stack traces / databases
        return {
            "error": str(message),
            "status": "error"
        }, code

    with app.app_context():
        db.create_all()

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
