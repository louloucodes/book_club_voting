import os
import json
import csv
import io
# MODIFIED: Add session, redirect, url_for, flash, and functools
from flask import Flask, render_template, jsonify, Response, request, session, redirect, url_for, flash
import uuid
from functools import wraps # NEW: For creating our decorator

from src.books import data_store

# --- Application Setup ---
app = Flask(__name__)
# NEW: A secret key is required for Flask sessions to work.
# In a real app, this should be a long, random string stored securely.
app.config['SECRET_KEY'] = 'dev-secret-key' 
ADMIN_PASSWORD = 'admin' # In a real app, use environment variables for this.

# --- Admin Authentication Decorator ---
def admin_required(f):
    """Decorator to restrict access to admin-only routes."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('is_admin'):
            flash('You need to be an admin to access this page.', 'error')
            return redirect(url_for('admin_login'))
        return f(*args, **kwargs)
    return decorated_function

# REMOVE the @app.before_request decorator and the initialize_data function.
# We will call load_books directly in the route that needs it.

# --- Routes ---

@app.route('/')
def landing():
    """Renders the new landing page."""
    # We will create landing.html in the next step
    return render_template('landing.html')

# NEW: Admin Login/Logout Routes
@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        password = request.form.get('password')
        if password == ADMIN_PASSWORD:
            session['is_admin'] = True
            flash('Successfully logged in as admin.', 'success')
            return redirect(url_for('vote_page'))
        else:
            flash('Incorrect password.', 'error')
    return render_template('admin_login.html')

@app.route('/admin/logout')
def admin_logout():
    session.pop('is_admin', None)
    flash('You have been logged out.', 'info')
    return redirect(url_for('landing'))


@app.route('/vote')
def vote_page():
    """Renders the main page with the list of books for voting."""
    # MODIFIED: Ensure data is loaded before rendering the page.
    data_store.load_books() 
    return render_template('vote.html', books=data_store.books)

# REMOVED: The old /add route is no longer needed.
# @app.route('/add') ...

# NEW: A central page for all admin tasks.
@app.route('/admin')
@admin_required
def admin_page():
    """Renders the admin panel for managing books."""
    data_store.load_books()
    return render_template('admin.html', books=data_store.books)


@app.route('/results')
def get_results():
    """Provides the current vote counts as JSON."""
    # MODIFIED: Access the votes dictionary from the data_store.
    return jsonify(data_store.votes)

@app.route('/vote/<string:book_id>', methods=['POST'])
def vote(book_id):
    """Increments the vote count for a given book ID."""
    # MODIFIED: Access the votes dictionary from the data_store.
    if book_id in data_store.votes:
        data_store.votes[book_id] += 1
        return jsonify(success=True, message=f"Vote counted for {book_id}")
    return jsonify(success=False, message="Book ID not found"), 404

# NEW: Route to handle adding a new book
@app.route('/add_book', methods=['POST'])
def add_book():
    """Receives new book data, adds it to the store, and returns it."""
    data = request.get_json()
    if not data or not data.get('title') or not data.get('author'):
        return jsonify(success=False, message="Title and Author are required."), 400

    new_book_data = {
        "id": f"book_{uuid.uuid4().hex}", # Generate a unique ID
        "title": data.get('title'),
        "author": data.get('author'),
        "suggested_by": data.get('suggested_by', 'N/A')
    }

    # The add_book method handles enrichment and saving
    new_book = data_store.add_book(new_book_data)

    # We can't directly jsonify the Book object, so we convert it to a dict
    return jsonify(success=True, book=new_book.__dict__)

# NEW: Route to handle deleting a book
@app.route('/delete_book/<string:book_id>', methods=['POST'])
@admin_required # PROTECTED: Apply the decorator
def delete_book(book_id):
    """Deletes a book from the store."""
    success = data_store.delete_book(book_id)
    if success:
        return jsonify(success=True, message="Book deleted successfully.")
    return jsonify(success=False, message="Book not found."), 404

# NEW: Route to handle updating the book order
@app.route('/admin/update_order', methods=['POST'])
@admin_required
def update_book_order():
    """Updates the order of the books in the data file."""
    ordered_ids = request.get_json().get('order')
    if not ordered_ids:
        return jsonify(success=False, message="Missing order data"), 400
    
    success = data_store.update_order(ordered_ids)
    if success:
        return jsonify(success=True, message="Book order updated successfully.")
    return jsonify(success=False, message="Failed to update book order."), 500


@app.route('/export')
def export_results():
    """Exports the current vote counts to a CSV file."""
    # MODIFIED: Access the books list from the data_store.
    book_titles = {book.id: book.title for book in data_store.books}
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(['Book Title', 'Votes'])
    
    # MODIFIED: Access the votes dictionary from the data_store.
    for book_id, count in data_store.votes.items():
        writer.writerow([book_titles.get(book_id, 'Unknown Book'), count])
    
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-disposition": "attachment; filename=book_club_votes.csv"}
    )

# --- Main Execution ---

if __name__ == '__main__':
    app.run(debug=True)