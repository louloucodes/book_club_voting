import csv
import io
from flask import Blueprint, render_template, jsonify, Response, request, current_app

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def landing():
    """Renders the new landing page."""
    return render_template('landing.html')

@main_bp.route('/vote')
def vote_page():
    """Renders the main page with the list of books for voting."""
    current_app.data_store.load_books() 
    return render_template(
        'vote.html', 
        books=current_app.data_store.books, 
        voting_system=current_app.config['VOTING_SYSTEM']
    )

@main_bp.route('/results')
def get_results():
    """Provides the current vote counts as JSON."""
    return jsonify(current_app.data_store.voting_strategy.get_public_results())

# MODIFIED: This route now handles both plurality and ranked-choice votes.
# It accepts POST requests to /vote and /vote/<book_id>
@main_bp.route('/vote', methods=['POST'])
@main_bp.route('/vote/<string:book_id>', methods=['POST'])
def vote(book_id=None):
    """Records a vote using the current voting strategy."""
    
    # Determine the vote data based on the request
    if book_id:
        # This is a plurality vote from the old system, e.g., /vote/book_123
        vote_data = {'book_id': book_id}
    else:
        # This is a ranked-choice vote with a JSON body
        vote_data = request.get_json()

    if not vote_data:
        return jsonify(success=False, message="Missing vote data."), 400

    # Let the strategy object handle the data
    success = current_app.data_store.voting_strategy.record_vote(vote_data)
    
    if success:
        return jsonify(success=True, message="Vote counted.")
    
    # If the strategy failed, it's because the data was wrong for it
    return jsonify(success=False, message="Invalid vote data for the current voting system."), 400


@main_bp.route('/export')
def export_results():
    """Exports the current vote counts to a CSV file."""
    book_titles = {book.id: book.title for book in current_app.data_store.books}
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(['Book Title', 'Votes'])
    
    results = current_app.data_store.voting_strategy.get_public_results()
    for book_id, count in results.items():
        writer.writerow([book_titles.get(book_id, 'Unknown Book'), count])
    
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-disposition": "attachment; filename=book_club_votes.csv"}
    )