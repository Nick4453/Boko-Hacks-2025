import os
from datetime import datetime

from flask import Blueprint, jsonify, request, send_file, session
from flask_login import current_user, login_required
from werkzeug.utils import secure_filename

from extensions import db
from models.file import File
from models.user import User

ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'gif'} 
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

files_bp = Blueprint('files', __name__, url_prefix='/api/files')

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@files_bp.route('/')
@login_required
def get_files():
    """Get all files for the current user"""
    try:
        files = File.query.filter_by(user_id=current_user.id).order_by(File.uploaded_at.desc()).all()
        return jsonify({
            'success': True,
            'files': [{
                'id': file.id,
                'filename': file.filename,
                'uploaded_at': file.uploaded_at.strftime("%Y-%m-%d %H:%M:%S")
            } for file in files]
        })
    except Exception as e:
        print(f"Error getting files: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to get files'}), 500

@files_bp.route('/upload', methods=['POST'])
@login_required
def upload_file():
    """Handle file upload"""
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file part'}), 400
    
    file=request.files['file']
    
    if file:  
        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        print(f"File path: {file_path}")

        import time
        import cloudmersive_virus_api_client
        from cloudmersive_virus_api_client.rest import ApiException
        from pprint import pprint

        # Configure API key authorization: Apikey
        configuration = cloudmersive_virus_api_client.Configuration()
        configuration.api_key['Apikey'] = os.getenv('CLOUDMERSIVE_KEY')
        # Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
        # configuration.api_key_prefix['Apikey'] = 'Bearer'

        # create an instance of the API class
        api_instance = cloudmersive_virus_api_client.ScanApi(cloudmersive_virus_api_client.ApiClient(configuration))
        input_file = file_path # file | Input file to perform the operation on.
        file.save(file_path)

        try:
            # Scan a file for viruses
            api_response = api_instance.scan_file(input_file)

            if api_response.clean_result != True:
                new_file = File(
                filename=filename,
                file_path=file_path,
                user_id=current_user.id
                )
                delete_file(new_file.id)
                return jsonify({'success': False, 'message': "Malicious file detected!"}), 500
        except ApiException as e:
            print("Exception when calling ScanApi->scan_file: %s\n" % e)

        try:
            file.save(file_path)
            print(f"File saved successfully at {file_path}")

            new_file = File(
                filename=filename,
                file_path=file_path,
                user_id=current_user.id
            )

            db.session.add(new_file)
            db.session.commit()
            print(f"File record saved to database with ID: {new_file.id}")

            return jsonify({
                'success': True,
                'message': 'File uploaded successfully!',
                'file': new_file.to_dict()
            })
        except Exception as e:
            print(f"Error saving file: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({'success': False, 'error': str(e)}), 500
    else:
        print("File type not allowed or no file uploaded")
        
    file = request.files['file']
    #if not file or not file.filename:
    #    return jsonify({'success': False, 'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'success': False, 'error': 'File type not allowed'}), 400
    
    try:
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_')
        unique_filename = timestamp + filename
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        
        file.save(file_path)

        new_file = File(
            filename=filename,
            file_path=file_path,
            user_id=current_user.id
        )
        db.session.add(new_file)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'File uploaded successfully!',
            'file': {
                'id': new_file.id,
                'filename': new_file.filename,
                'uploaded_at': new_file.uploaded_at.strftime("%Y-%m-%d %H:%M:%S")
            }
        })
    except Exception as e:
        print(f"Error saving file: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@files_bp.route('/delete/<int:file_id>', methods=['DELETE'])
@login_required
def delete_file(file_id):
    """Delete a file"""
    try:
        file = File.query.get_or_404(file_id)
        
        if file.user_id != current_user.id:
            return jsonify({'success': False, 'error': 'Access denied'}), 403

        file_path = file.file_path
        
        db.session.delete(file)
        db.session.commit()
        
        if os.path.exists(file_path):
            os.remove(file_path)
            
        return jsonify({'success': True, 'message': 'File deleted successfully'})
    except Exception as e:
        print(f"Error deleting file: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@files_bp.route('/download/<int:file_id>')
@login_required
def download_file(file_id):
    """Download a file"""
    try:
        file = File.query.get_or_404(file_id)
        
        if file.user_id != current_user.id:
            return jsonify({'success': False, 'error': 'Access denied'}), 403
        
        if os.path.exists(file.file_path):
            return send_file(
                file.file_path,
                as_attachment=True,
                download_name=file.filename
            )
        else:
            return jsonify({'success': False, 'error': 'File not found on server'}), 404
    except Exception as e:
        print(f"Error downloading file: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
