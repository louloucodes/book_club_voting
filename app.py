import os
import json
import csv
import io
from flask import Flask, render_template, jsonify, request, Response

# --- Application Setup ---
app = Flask(__name__)

# --- In-Memory Data Store ---
# We use global variables to act as a simple in-memory database.
# This data will reset every time the application restarts.
BOOKS_FILE = os.path.join('data', 'books.json')
books = []
votes = {}

def load_books():
    """Loads books from the JSON file and initializes vote counts."""
    global books, votes
    try:
        with open(BOOKS_FILE, 'r') as f:
            books = json.load(f)
            # Initialize votes for each book to 0
            votes = {book['id']: 0 for book in books}
    except FileNotFoundError:
        print(f"ERROR: {BOOKS_FILE} not found. Please create it.")
        books = []
        votes = {}

# --- Routes ---

@app.route('/')
def index():
    """Renders the main page with the list of books."""
    # The template will be responsible for fetching the results dynamically.
    return render_template('index.html', books=books)

@app.route('/results')
def get_results():
    """Provides the current vote counts as JSON."""
    return jsonify(votes)

@app.route('/vote/<string:book_id>', methods=['POST'])
def vote(book_id):
    """Increments the vote count for a given book ID."""
    if book_id in votes:
        votes[book_id] += 1
        return jsonify(success=True, message=f"Vote counted for {book_id}")
    return jsonify(success=False, message="Book ID not found"), 404

@app.route('/export')
def export_results():
    """Exports the current vote counts to a CSV file."""
    # Find the book titles for corresponding IDs
    book_titles = {book['id']: book['title'] for book in books}
    
    # Use an in-memory string buffer to build the CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow(['Book Title', 'Votes'])
    
    # Write data rows
    for book_id, count in votes.items():
        writer.writerow([book_titles.get(book_id, 'Unknown Book'), count])
    
    # Prepare the response
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-disposition": "attachment; filename=book_club_votes.csv"}
    )

# --- Main Execution ---

if __name__ == '__main__':
    load_books()
    app.run(debug=True)