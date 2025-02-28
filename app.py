import os
from datetime import timedelta

import dotenv
from flask import Flask, request, send_from_directory
from flask_cors import CORS
from flask_login import LoginManager
from sqlalchemy import inspect

from extensions import db
from models.user import User
from routes.about import about_bp
from routes.admin import admin_bp, init_admin_db
from routes.captcha import captcha_bp
from routes.code import codescan_bp
from routes.files import files_bp
from routes.login import login_bp
from routes.news import news_bp
from routes.notes import notes_bp
from routes.register import register_bp

dotenv.load_dotenv()
app = Flask(__name__, template_folder="frontend/dist", static_folder="frontend/dist")

# Configure Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.session_protection = "strong"

@login_manager.user_loader
def load_user(user_id):
    try:
        return User.query.get(int(user_id))
    except:
        return None

# Configure CORS
CORS(app, 
     resources={r"/api/*": {"origins": "http://localhost:5173"}},  # Vite's default port
     supports_credentials=True,
     allow_headers=["Content-Type"],
     expose_headers=["Access-Control-Allow-Origin"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

app.secret_key = os.getenv("SECRET_KEY")
if not app.secret_key:
    raise ValueError("No SECRET_KEY set in environment")

# Configure session
app.config.update(
    SESSION_COOKIE_SECURE=False,  # Set to True in production with HTTPS
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
    PERMANENT_SESSION_LIFETIME=timedelta(days=7),  # Extend session lifetime
    REMEMBER_COOKIE_DURATION=timedelta(days=7),    # Set remember me duration
    REMEMBER_COOKIE_SECURE=False,                  # Set to True in production
    REMEMBER_COOKIE_HTTPONLY=True,
    SESSION_PROTECTION='strong'
)

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///boko_hacks.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

db.init_app(app)

# Register blueprints with /api prefix
app.register_blueprint(login_bp)  # login_bp already has /api prefix
app.register_blueprint(register_bp)  # register_bp already has /api prefix
app.register_blueprint(captcha_bp, url_prefix="/api")  # Add /api prefix to captcha routes
app.register_blueprint(admin_bp)
app.register_blueprint(about_bp, url_prefix="/api")
app.register_blueprint(files_bp)  # files_bp already has /api prefix
app.register_blueprint(news_bp)   # news_bp already has /api prefix
app.register_blueprint(notes_bp)  # notes_bp already has /api prefix
app.register_blueprint(codescan_bp)


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    if path.startswith("api/"):
        return {"error": "Not found"}, 404

    static_file_path = os.path.join(app.static_folder, path)
    if path and os.path.exists(static_file_path) and os.path.isfile(static_file_path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")


def setup_database():
    """Setup database and print debug info"""
    with app.app_context():
        inspector = inspect(db.engine)
        existing_tables = inspector.get_table_names()

        if not existing_tables:
            print("No existing tables found. Creating new tables...")
            db.create_all()

            init_admin_db()
        else:
            print("Existing tables found:", existing_tables)

            db.create_all()
            print("Updated schema with any new tables")

        for table in ["users", "notes", "admin_credentials", "files"]:
            if table in inspector.get_table_names():
                print(f"\n{table.capitalize()} table columns:")
                for column in inspector.get_columns(table):
                    print(f"- {column['name']}: {column['type']}")
            else:
                print(f"\n{table} table does not exist!")


if __name__ == "__main__":
    setup_database()
    app.run(debug=False)
