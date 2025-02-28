from flask import Blueprint, render_template

react_bp = Blueprint("react", __name__)

@react_bp.route("/about")
def react():
    return render_template("about.html")
