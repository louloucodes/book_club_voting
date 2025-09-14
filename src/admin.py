import uuid
import json # NEW: Import json
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
def admin_page():
    """Renders the main admin panel."""
    return render_template('admin.html', books=current_app.book_store.books)

@admin_bp.route('/add_book', methods=['POST'])
@admin_required
def add_book():
    """Adds a new book to the list."""
    # FIX: Revert to request.get_json() because the JS sends JSON data.
    data = request.get_json()
    if not data:
        return jsonify(success=False, message="Invalid request format."), 400

    title = data.get('title')
    author = data.get('author')
    # FIX: The form sends 'suggested_by', not 'suggester'.
    suggester = data.get('suggested_by')
    
    if not all([title, author, suggester]):
        return jsonify(success=False, message="Title, author, and suggester are required."), 400

    # FIX: Create a dictionary to pass to the flexible add_book method.
    new_book_data = {
        "title": title,
        "author": author,
        "suggested_by": suggester
    }
    new_book = current_app.book_store.add_book(new_book_data)
    return jsonify(success=True, book=new_book.__dict__)

@admin_bp.route('/delete_book/<string:book_id>', methods=['DELETE'])
@admin_required
def delete_book(book_id):
    """Deletes a book from the list."""
    success = current_app.book_store.delete_book(book_id)
    if success:
        return jsonify(success=True, message="Book deleted successfully.")
    else:
        return jsonify(success=False, message="Book not found."), 404

@admin_bp.route('/update_order', methods=['POST'])
@admin_required
def update_order():
    """Updates the order of the books."""
    data = request.get_json()
    new_order = data.get('order')
    if not new_order:
        return jsonify(success=False, message="Missing order data."), 400
    
    current_app.book_store.update_book_order(new_order)
    return jsonify(success=True, message="Book order updated.")


@admin_bp.route('/calculate_results', methods=['POST'])
@admin_required
def calculate_results():
    """Calculates and returns the winner based on the current voting system."""
    books = current_app.book_store.books
    results = current_app.voting_manager.calculate_results(books)
    return jsonify(results)

# NEW: Route to update the voting system setting
@admin_bp.route('/update_settings', methods=['POST'])
@admin_required
def update_settings():
    data = request.get_json()
    new_system = data.get('voting_system')
    points_per_voter = data.get('points_per_voter', 5)

    if new_system not in ['ranked_choice', 'plurality', 'cumulative']:
        return jsonify(success=False, message="Invalid voting system specified."), 400

    try:
        # Read the current settings
        with open('data/settings.json', 'r') as f:
            settings = json.load(f)
        
        # Update the voting system and points
        settings['VOTING_SYSTEM'] = new_system
        if new_system == 'cumulative':
            settings['POINTS_PER_VOTER'] = int(points_per_voter)
        
        # Write the new settings back to the file
        with open('data/settings.json', 'w') as f:
            json.dump(settings, f, indent=4)
        
        # Also update the config of the currently running app
        current_app.config.update(settings)
        
        # CRITICAL FIX: Re-initialize the voting strategy in the voting_manager
        current_app.voting_manager.set_voting_strategy()

        return jsonify(success=True, message="Settings updated successfully.")

    except (IOError, ValueError) as e:
        print(f"Error updating settings: {e}")
        return jsonify(success=False, message="Could not save settings file."), 500