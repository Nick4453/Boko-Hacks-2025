import re

from flask import (Blueprint, flash, jsonify, redirect, render_template,
                   request, session, url_for)

from extensions import db
from models.user import User

register_bp = Blueprint("register", __name__, url_prefix="/api")

@register_bp.route("/register", methods=["POST"])
def register():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        confirm_password = request.form.get("confirm_password")

        if password != confirm_password:
            flash("Passwords do not match!", "error")
            return redirect(url_for("register.register"))
        
        if len(password) < 8:
            flash("Password must be at least 8 characters long.", "error")
            return redirect(url_for("register.register"))
        
        if not re.search(r"\d", password):
            flash("Password must contain at least one digit.", "error")
            return redirect(url_for("register.register"))
        
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            flash("Password must contain at least one special character.", "error")
            return redirect(url_for("register.register"))

        captcha_response = request.form.get("captcha")
        stored_captcha = session.get("captcha_text")

    if not stored_captcha or captcha_response.upper() != stored_captcha:
        return jsonify({
            "success": False,
            "message": "Invalid CAPTCHA. Please try again."
        })

    session.pop("captcha_text", None)

    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        return jsonify({
            "success": False,
            "message": "Username already exists. Please choose a different one."
        })

    new_user = User(username=username)
    new_user.set_password(password)
    
    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({
            "success": True,
            "message": "Registration successful! You can now log in."
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": "An error occurred during registration. Please try again."
        })

