import os
import csv
import io
from flask import Flask, render_template, jsonify, Response, request, Blueprint

# NEW: Import the Config object
from config import Config
from src.books import data_store
from src.admin import admin_bp

# --- Application Setup ---
app = Flask(__name__)
# NEW: Load configuration from the Config object
app.config.from_object(Config)

# REMOVED: The hard-coded secret key is no longer needed here.
# app.config['SECRET_KEY'] = 'dev-secret-key' 

# --- Main Blueprint (for non-admin routes) ---
main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def landing():
    """Renders the new landing page."""
    return render_template('landing.html')

@main_bp.route('/vote')
def vote_page():
    """Renders the main page with the list of books for voting."""
    data_store.load_books() 
    return render_template('vote.html', books=data_store.books)

@main_bp.route('/results')
def get_results():
    """Provides the current vote counts as JSON."""
    return jsonify(data_store.votes)

@main_bp.route('/vote/<string:book_id>', methods=['POST'])
def vote(book_id):
    """Increments the vote count for a given book ID."""
    if book_id in data_store.votes:
        data_store.votes[book_id] += 1
        return jsonify(success=True, message=f"Vote counted for {book_id}")
    return jsonify(success=False, message="Book ID not found"), 404

@main_bp.route('/export')
def export_results():
    """Exports the current vote counts to a CSV file."""
    book_titles = {book.id: book.title for book in data_store.books}
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(['Book Title', 'Votes'])
    
    for book_id, count in data_store.votes.items():
        writer.writerow([book_titles.get(book_id, 'Unknown Book'), count])
    
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-disposition": "attachment; filename=book_club_votes.csv"}
    )

# --- Register Blueprints ---
app.register_blueprint(main_bp)
app.register_blueprint(admin_bp) # All routes in admin_bp will be prefixed with /admin

# --- Main Execution ---
if __name__ == '__main__':
    app.run(debug=True)