import os
import json

# --- Data Store ---
# This module acts as a simple in-memory database.

# FIX: Construct an absolute path to the data file from the project root.
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
BOOKS_FILE = os.path.join(project_root, 'data', 'books.json')

# NEW: Define a class to represent a single book.
class Book:
    """A structured representation of a book."""
    def __init__(self, data: dict):
        self.id = data.get('id')
        self.title = data.get('title', 'No Title')
        self.author = data.get('author', 'Unknown Author')
        self.suggested_by = data.get('suggested_by', 'N/A')
        self.summary = data.get('summary')
        self.page_count = data.get('page_count')
        self.published_date = data.get('published_date')
        self.cover_image_url = data.get('cover_image_url')

class BookStore:
    def __init__(self):
        self.books = []
        self.votes = {}

    def load_books(self):
        """Loads books from JSON and converts them into Book objects."""
        if self.books:
            return
        
        try:
            with open(BOOKS_FILE, 'r') as f:
                raw_data = json.load(f)
                # MODIFIED: Create a list of Book objects instead of dicts.
                self.books = [Book(item) for item in raw_data]
                self.votes = {book.id: 0 for book in self.books}
            print(f"Successfully loaded {len(self.books)} books.")
        except FileNotFoundError:
            print(f"ERROR: {BOOKS_FILE} not found. Please create it.")
            self.books = []
            self.votes = {}

# Create a single, shared instance of the store for the entire application
data_store = BookStore()