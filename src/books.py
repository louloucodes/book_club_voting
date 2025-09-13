import os
import json
from .utils import enrich_single_book # NEW: Import the enrichment function

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
    """A simple class to hold and manage the application's data."""
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
        except json.JSONDecodeError:
            print(f"ERROR: Could not decode {BOOKS_FILE}. Check for syntax errors.")
            self.books = []
            self.votes = {}

    def add_book(self, new_book_data: dict):
        """Enriches a new book, adds it to the store, and saves to file."""
        # 1. Enrich the new book data
        enriched_data = enrich_single_book(new_book_data)

        # 2. Add to in-memory list as a Book object
        new_book_obj = Book(enriched_data)
        self.books.append(new_book_obj)
        self.votes[new_book_obj.id] = 0

        # 3. Read the current file, append, and write back
        try:
            with open(BOOKS_FILE, 'r') as f:
                all_books_raw = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            all_books_raw = []
        
        all_books_raw.append(enriched_data)

        with open(BOOKS_FILE, 'w') as f:
            json.dump(all_books_raw, f, indent=4)
        
        return new_book_obj

    def delete_book(self, book_id: str) -> bool:
        """Removes a book by its ID from the store and saves to file."""
        # 1. Find the book to remove from the in-memory list
        book_to_delete = next((b for b in self.books if b.id == book_id), None)
        if not book_to_delete:
            return False # Book not found

        self.books.remove(book_to_delete)
        self.votes.pop(book_id, None) # Remove its vote count

        # 2. Read the current file, filter out the book, and write back
        try:
            with open(BOOKS_FILE, 'r') as f:
                all_books_raw = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return False # File issue

        filtered_books = [b for b in all_books_raw if b.get('id') != book_id]

        with open(BOOKS_FILE, 'w') as f:
            json.dump(filtered_books, f, indent=4)
            
        return True

# Create a single, shared instance of the store for the entire application
data_store = BookStore()