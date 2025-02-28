from datetime import datetime

from flask import Blueprint, jsonify, request, session
from flask_login import current_user, login_required
from sqlalchemy import text

from extensions import db
from models.note import Note
from models.user import User

notes_bp = Blueprint('notes', __name__, url_prefix='/api/notes')

@notes_bp.route('/')
@login_required
def get_notes():
    """Get all notes for the current user"""
    try:
        notes = Note.query.filter_by(user_id=current_user.id).order_by(Note.created_at.desc()).all()
        return jsonify({
            'success': True,
            'notes': [{
                'id': note.id,
                'title': note.title,
                'content': note.content,
                'created_at': note.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'user_id': note.user_id
            } for note in notes]
        })
    except Exception as e:
        print(f"Error getting notes: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@notes_bp.route('/create', methods=['POST'])
@login_required
def create_note():
    """Create a new note"""
    try:
        data = request.get_json()
        title = data.get('title')
        content = data.get('content')
        
        if not title or not content:
            return jsonify({'success': False, 'error': 'Title and content are required'}), 400
        
        print(f"Creating note - Title: {title}, Content: {content}")
        
        note = Note(
            title=title,
            content=content,
            created_at=datetime.now(),
            user_id=current_user.id
        )
        
        db.session.add(note)
        db.session.commit()
        
        print(f"Note created with ID: {note.id}")
        
        return jsonify({
            'success': True,
            'message': 'Note created successfully',
            'note': {
                'id': note.id,
                'title': note.title,
                'content': note.content,
                'created_at': note.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'user_id': note.user_id
            }
        })
    except Exception as e:
        print(f"Error creating note: {e}")
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@notes_bp.route('/search')
@login_required
def search_notes():
    """Search notes with proper security"""
    query = request.args.get('q', '')
    print(f"Search query: {query}")
    
    try:
        # Use SQLAlchemy's built-in filtering for security
        notes = Note.query.filter(
            (Note.title.ilike(f'%{query}%') | Note.content.ilike(f'%{query}%')) &
            (Note.user_id == current_user.id)
        ).order_by(Note.created_at.desc()).all()
        
        print(f"Found {len(notes)} matching notes")
        return jsonify({
            'success': True,
            'notes': [{
                'id': note.id,
                'title': note.title,
                'content': note.content,
                'created_at': note.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'user_id': note.user_id
            } for note in notes]
        })
    except Exception as e:
        print(f"Error searching notes: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@notes_bp.route('/delete/<int:note_id>', methods=['DELETE'])
@login_required
def delete_note(note_id):
    """Delete a note with proper access control"""
    try:
        note = Note.query.get(note_id)
        if not note:
            print(f"Note not found: {note_id}")
            return jsonify({'success': False, 'error': f'Note with ID {note_id} not found'}), 404
            
        # Check if the note belongs to the current user
        if note.user_id != current_user.id:
            print(f"Unauthorized deletion attempt - Note ID: {note_id}, User: {current_user.id}")
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        print(f"Deleting note ID: {note_id}, Title: {note.title}")
        
        db.session.delete(note)
        db.session.commit()
        
        print(f"Note {note_id} deleted successfully")
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error deleting note: {e}")
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@notes_bp.route('/debug')
def debug_database():
    """Debug route to check database contents"""
    try:
        users = User.query.all()
        print("\nAll Users:")
        for user in users:
            print(f"ID: {user.id}, Username: {user.username}")
        
        notes = Note.query.all()
        print("\nAll Notes:")
        for note in notes:
            print(f"ID: {note.id}, Title: {note.title}, User ID: {note.user_id}")
        
        sql = text("SELECT * FROM notes")
        result = db.session.execute(sql)
        rows = result.fetchall()
        print("\nRaw SQL Notes Query Result:")
        for row in rows:
            print(row)
            
        return jsonify({
            'users': [{'id': u.id, 'username': u.username} for u in users],
            'notes': [note.to_dict() for note in notes]
        })
    except Exception as e:
        print(f"Debug Error: {e}")
        return jsonify({'error': str(e)}), 500
