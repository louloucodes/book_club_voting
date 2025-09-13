import os
import json
import csv
import io
from flask import Flask, render_template, jsonify, Response

# MODIFIED: Import the single data_store instance instead of the old variables.
from src.books import data_store

# --- Application Setup ---
app = Flask(__name__)

@app.before_request
def initialize_data():
    """Ensures book data is loaded before the first request."""
    # MODIFIED: Call the load method on the data_store instance.
    data_store.load_books()

# --- Routes ---

@app.route('/')
def index():
    """Renders the main page with the list of books."""
    # MODIFIED: Access the books list from the data_store.
    return render_template('index.html', books=data_store.books)

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