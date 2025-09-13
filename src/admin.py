import uuid
from functools import wraps
from flask import (
    Blueprint, render_template, request, session, redirect, url_for, flash, jsonify, current_app
)

# --- Blueprint Setup ---
# The first argument is the blueprint's name.
# The second is the import name, which is used to locate resources.
admin_bp = Blueprint('admin', __name__, url_prefix='/admin', template_folder='../templates')

# --- Admin Authentication Decorator ---
def admin_required(f):
    """Decorator to restrict access to admin-only routes."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('is_admin'):
            flash('You need to be an admin to access this page.', 'error')
            return redirect(url_for('admin.login')) # Note: blueprint name prefix
        return f(*args, **kwargs)
    return decorated_function

# --- Admin Routes ---

@admin_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        password = request.form.get('password')
        # MODIFIED: Use the password from the app's configuration
        if password == current_app.config['ADMIN_PASSWORD']:
            session['is_admin'] = True
            flash('Successfully logged in as admin.', 'success')
            return redirect(url_for('admin.panel')) # Note: blueprint name prefix
        else:
            flash('Incorrect password.', 'error')
    return render_template('admin_login.html')

@admin_bp.route('/logout')
def logout():
    session.pop('is_admin', None)
    flash('You have been logged out.', 'info')
    return redirect(url_for('main.landing')) # Note: blueprint name prefix for main app

@admin_bp.route('/')
@admin_required
def panel():
    """Renders the admin panel for managing books."""
    # MODIFIED: Access data_store from current_app
    current_app.data_store.load_books()
    return render_template('admin.html', books=current_app.data_store.books)

@admin_bp.route('/add_book', methods=['POST'])
@admin_required
def add_book():
    data = request.get_json()
    if not data or not data.get('title') or not data.get('author'):
        return jsonify(success=False, message="Title and Author are required."), 400

    new_book_data = {
        "id": f"book_{uuid.uuid4().hex}",
        "title": data.get('title'),
        "author": data.get('author'),
        "suggested_by": data.get('suggested_by', 'N/A')
    }
    # MODIFIED: Access data_store from current_app
    new_book = current_app.data_store.add_book(new_book_data)
    return jsonify(success=True, book=new_book.__dict__)

@admin_bp.route('/delete_book/<string:book_id>', methods=['POST'])
@admin_required
def delete_book(book_id):
    # MODIFIED: Access data_store from current_app
    success = current_app.data_store.delete_book(book_id)
    if success:
        return jsonify(success=True, message="Book deleted successfully.")
    return jsonify(success=False, message="Book not found."), 404

@admin_bp.route('/update_order', methods=['POST'])
@admin_required
def update_order():
    ordered_ids = request.get_json().get('order')
    if not ordered_ids:
        return jsonify(success=False, message="Missing order data"), 400
    
    # MODIFIED: Access data_store from current_app
    success = current_app.data_store.update_order(ordered_ids)
    if success:
        return jsonify(success=True, message="Book order updated successfully.")
    return jsonify(success=False, message="Failed to update book order."), 500