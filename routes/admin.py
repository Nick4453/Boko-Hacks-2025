import os
import sqlite3
from functools import wraps

import dotenv
from flask import (Blueprint, flash, jsonify, redirect, render_template,
                   request, session, url_for)
from sqlalchemy import text

from extensions import db
from models.admin import Admin
from models.user import User

dotenv.load_dotenv()


admin_username = os.getenv('ADMIN_USERNAME')
admin_password= os.getenv('ADMIN_PASSWORD')


admin_bp = Blueprint("admin", __name__, url_prefix="/api")


DEFAULT_ADMIN = {
    "username": admin_username,
    "password": admin_password
}

def init_admin_db():
    """Initialize admin database by linking to a user"""
    try:
        admin_user = User.query.filter_by(username=DEFAULT_ADMIN["username"]).first()
        
        if not admin_user:
            admin_user = User(username=DEFAULT_ADMIN["username"])
            admin_user.set_password(DEFAULT_ADMIN["password"])
            db.session.add(admin_user)
            db.session.commit()
            
        admin_role = Admin.query.filter_by(is_default=True).first()
        
        if not admin_role:
            admin_role = Admin(
                user_id=admin_user.id,
                is_default=True
            )
            db.session.add(admin_role)
            db.session.commit()
            print("Default admin account created/updated")
    except Exception as e:
        print(f"Error initializing admin database: {e}")
        db.session.rollback()

def get_admin_list():
    """Get list of all admin users"""
    admin_roles = Admin.query.all()
    admins = []
    
    for admin in admin_roles:
        user = User.query.get(admin.user_id)
        if user:
            admins.append([admin.id, user.username, admin.is_default])
    
    return admins

@admin_bp.route("/admin-check")
def check_admin():
    """Check admin login status - used for AJAX requests"""
    is_admin = session.get('admin_logged_in', False)
    if is_admin:
        admins = get_admin_list()
        
        admin_roles = Admin.query.all()
        admin_user_ids = [admin.user_id for admin in admin_roles]
        
        return jsonify({
            'logged_in': True,
            'is_default_admin': session.get('is_default_admin', False),
            'admin_username': session.get('admin_username', 'admin'),
            'admins': admins,
            'admin_user_ids': admin_user_ids
        })
    return jsonify({'logged_in': False})

@admin_bp.route("/admin/login", methods=["POST"])
def admin_login():
    """Handle admin login"""
    username = request.form.get("username")
    password = request.form.get("password")
    
    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        admin_role = Admin.query.filter_by(user_id=user.id).first()
        
        if admin_role:
            session['admin_logged_in'] = True
            session['admin_username'] = username
            session['is_default_admin'] = (admin_role.is_default == True)
            
            return jsonify({
                'success': True,
                'is_default_admin': admin_role.is_default,
                'admins': get_admin_list()
            })
    
    return jsonify({
        'success': False,
        'message': "Invalid admin credentials."
    })

@admin_bp.route("/admin", methods=["GET", "POST"])
def admin():
    """Main admin route - handles both GET and POST requests"""
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            admin_role = Admin.query.filter_by(user_id=user.id).first()
            
            if admin_role:
                session['admin_logged_in'] = True
                session['admin_username'] = username
                session['is_default_admin'] = (admin_role.is_default == True)
                
                return jsonify({
                    'success': True,
                    'is_default_admin': admin_role.is_default,
                    'admins': get_admin_list()
                })
        
        return jsonify({
            'success': False,
            'message': "Invalid admin credentials."
        })
    
    # GET request - return current admin status
    if session.get('admin_logged_in'):
        return jsonify({
            'success': True,
            'is_default_admin': session.get('is_default_admin', False),
            'admin_username': session.get('admin_username'),
            'admins': get_admin_list()
        })
    
    return jsonify({
        'success': False,
        'message': "Not logged in"
    })

@admin_bp.route("/admin/add", methods=["POST"])
def add_admin():
    """Add new admin user"""
    if not session.get('admin_logged_in') or not session.get('is_default_admin'):
        return jsonify({'success': False, 'message': "Unauthorized"})
    
    username = request.form.get("username")
    password = request.form.get("password")
    
    if not all([username, password]):
        return jsonify({'success': False, 'message': "Missing credentials"})
    
    user = User.query.filter_by(username=username).first()
    
    if not user:
        user = User(username=username)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
    
    existing_admin = Admin.query.filter_by(user_id=user.id).first()
    if existing_admin:
        return jsonify({'success': False, 'message': "User is already an admin"})
    
    new_admin = Admin(user_id=user.id)
    db.session.add(new_admin)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': "Admin added successfully",
        'admins': get_admin_list()
    })

@admin_bp.route("/admin/remove/<int:admin_id>", methods=["POST"])
def remove_admin(admin_id):
    """Remove admin user"""
    if not session.get('admin_logged_in') or not session.get('is_default_admin'):
        return jsonify({'success': False, 'message': "Unauthorized"})
    
    admin = Admin.query.get(admin_id)
    
    if not admin:
        return jsonify({'success': False, 'message': "Admin not found"})
    
    if admin.is_default:
        return jsonify({'success': False, 'message': "Cannot remove default admin"})
    
    db.session.delete(admin)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': "Admin removed successfully",
        'admins': get_admin_list()
    })

@admin_bp.route("/admin/users", methods=["GET"])
def get_users():
    """Get list of all regular users"""
    if not session.get('admin_logged_in'):
        return jsonify({'success': False, 'message': "Unauthorized"})
    
    try:
        users = User.query.all()
        user_list = [{
            'id': user.id, 
            'username': user.username
        } for user in users]
        return jsonify({'success': True, 'users': user_list})
    except Exception as e:
        print(f"Error fetching users: {e}")
        return jsonify({'success': False, 'message': str(e)})

@admin_bp.route("/admin/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    """Delete a user"""
    if not session.get('admin_logged_in'):
        return jsonify({'success': False, 'message': "Unauthorized"})
    
    try:
        user = User.query.get(user_id)
        if user:
            db.session.delete(user)
            db.session.commit()
            return jsonify({'success': True, 'message': "User deleted successfully"})
        return jsonify({'success': False, 'message': "User not found"})
    except Exception as e:
        print(f"Error deleting user: {e}")
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})

@admin_bp.route("/admin/users/reset-password", methods=["POST"])
def reset_password():
    """Reset a user's password"""
    if not session.get('admin_logged_in'):
        return jsonify({'success': False, 'message': "Unauthorized"})
    
    try:
        user_id = request.form.get('user_id')
        new_password = request.form.get('new_password')
        
        user = User.query.get(user_id)
        if user:
            user.set_password(new_password)
            db.session.commit()
            return jsonify({'success': True, 'message': "Password reset successfully"})
        return jsonify({'success': False, 'message': "User not found"})
    except Exception as e:
        print(f"Error resetting password: {e}")
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})

@admin_bp.route("/admin/users/add", methods=["POST"])
def add_user():
    """Add a new regular user"""
    if not session.get('admin_logged_in'):
        return jsonify({'success': False, 'message': "Unauthorized"})
    
    try:
        username = request.form.get('username')
        password = request.form.get('password')
        
        if User.query.filter_by(username=username).first():
            return jsonify({'success': False, 'message': "Username already exists"})
        
        new_user = User(username=username)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'success': True, 
            'message': "User added successfully",
            'user': {'id': new_user.id, 'username': new_user.username}
        })
    except Exception as e:
        print(f"Error adding user: {e}")
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})

@admin_bp.route('/admin/logout', methods=['POST'])
def logout():
    # gets rid of all admin id on log out 
    session.pop('admin_logged_in', None)
    session.pop('admin_username', None)
    session.pop('is_default_admin', None)
    return jsonify({"success": True, "message": "Logged out successfully"})
