import os

import duo_universal
from dotenv import load_dotenv
from flask import (Blueprint, flash, jsonify, redirect, render_template,
                   request, session, url_for)
from flask_login import current_user, login_required, login_user, logout_user

from extensions import db
from models.user import User

load_dotenv()

login_bp = Blueprint("login", __name__, url_prefix="/api")

# Initialize Duo client
try:
    client_id = os.getenv('CLIENT_ID')
    client_secret = os.getenv('CLIENT_SECRET')
    api_hostname = os.getenv('API_HOSTNAME')
    redirect_uri = "http://localhost:5000/api/duo-callback"
    
    duo_client = duo_universal.Client(
        client_id=client_id,
        client_secret=client_secret,
        host=api_hostname,
        redirect_uri=redirect_uri
    )
except Exception as e:
    print(f"Error initializing Duo client: {e}")
    duo_client = None


@login_bp.route("/auth/status")
def auth_status():
    try:
        print(f"Checking auth status. Is authenticated: {current_user.is_authenticated}")
        is_authenticated = current_user.is_authenticated
        if is_authenticated:
            return jsonify({
                "status": "success",
                "authenticated": True,
                "user": {
                    "username": current_user.username,
                    "id": current_user.id
                }
            })
    except Exception as e:
        print(f"Error in auth_status: {e}")

    return jsonify({
        "status": "success",
        "authenticated": False
    })

@login_bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        if not username or not password:
            return jsonify({"status": "error", "message": "Missing credentials"}), 400

        try:
            user = User.query.filter_by(username=username).first()
            if user and user.check_password(password):
                # Store user info in session for Duo callback
                state = duo_client.generate_state()
                session['state'] = state
                session['user_id'] = user.id
                
                # Generate Duo authentication URL
                prompt_uri = duo_client.create_auth_url(username, state)
                
                return jsonify({
                    "status": "success",
                    "duo_url": prompt_uri
                })
            else:
                return jsonify({"status": "error", "message": "Invalid credentials"}), 401
        except Exception as e:
            print(f"Error in login: {e}")
            return jsonify({"status": "error", "message": "Server error"}), 500

    return jsonify({"status": "error", "message": "Method not allowed"}), 405

@login_bp.route("/logout")
@login_required
def logout():
    try:
        # Get the session ID before logout for debugging
        session_id = session.get('_id')
        print(f"Logging out user. Session ID: {session_id}")
        
        # Perform logout
        logout_user()
        
        # Clear all session data
        session.clear()
        
        # Force session modifications to be saved
        session.modified = True
        
        print(f"Logout complete. Is authenticated: {current_user.is_authenticated}")
        return jsonify({"status": "success", "message": "Logged out successfully"})
    except Exception as e:
        print(f"Error in logout: {e}")
        return jsonify({"status": "error", "message": "Logout failed"}), 500

@login_bp.route("/duo-callback")
def duo_callback():
    try:
        # Get state and code from Duo response
        state = request.args.get('state')
        code = request.args.get('duo_code')

        if not all([state, code, 'state' in session, 'user_id' in session]):
            return jsonify({"status": "error", "message": "Invalid session"}), 400

        # Verify state matches
        if state != session['state']:
            return jsonify({"status": "error", "message": "Invalid state"}), 400

        # Get user from session
        user = User.query.get(session['user_id'])
        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 404

        # Verify Duo authentication
        decoded_token = duo_client.exchange_authorization_code_for_2fa_result(
            code,
            user.username
        )

        if decoded_token:
            # Complete login process
            login_user(user, remember=True)
            session.permanent = True
            session.modified = True

            # Clean up session
            session.pop('state', None)
            session.pop('user_id', None)

            return redirect("/")

        else:
            return jsonify({"status": "error", "message": "Duo authentication failed"}), 401

    except Exception as e:
        print(f"Error in duo callback: {e}")
        return jsonify({"status": "error", "message": "Server error"}), 500
