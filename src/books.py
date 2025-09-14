import os
import json
import uuid # NEW: Import uuid to generate unique IDs

# MODIFIED: Import the correct enrichment function from your existing utils.py
from .book import Book
from .voting import get_voting_strategy
from .utils import enrich_single_book

class BookStore:
    """A simple class to hold and manage the application's data."""
    # MODIFIED: Initialize with a default strategy
    def __init__(self):
        self.books_file = 'data/books.json'
        self.books = self.load_books() # Initialize and load books
        self._loaded = False
        self.voting_strategy = None # Will be set by the app factory

    def set_voting_strategy(self, strategy_name: str):
        """Sets the voting strategy for the store."""
        self.voting_strategy = get_voting_strategy(strategy_name)

    def load_books(self):
        """Loads books from JSON and converts them into Book objects."""
        try:
            with open(self.books_file, 'r') as f:
                raw_data = json.load(f)
                # MODIFIED: Create a list of Book objects instead of dicts.
                return [Book(item) for item in raw_data]
        except (FileNotFoundError, json.JSONDecodeError):
            return [] # Return an empty list on error

    def save_books(self):
        """Saves the current list of books to the JSON file."""
        all_books_raw = [b.__dict__ for b in self.books]
        
        try:
            with open(self.books_file, 'w') as f:
                json.dump(all_books_raw, f, indent=4)
        except IOError as e:
            print(f"ERROR: Could not write to {self.books_file}. {e}")

    def add_book(self, new_book_data: dict):
        """Enriches a new book, adds it to the store, and saves to file."""
        
        # 1. Enrich the new book data using your existing utility function
        enriched_data = enrich_single_book(new_book_data)
        
        # 2. Generate a unique ID for the new book if it doesn't have one
        if 'id' not in enriched_data or not enriched_data['id']:
            enriched_data['id'] = f"book_{uuid.uuid4().hex[:6]}"

        # 3. Add to in-memory list as a Book object
        new_book_obj = Book(enriched_data)
        self.books.append(new_book_obj)
        
        # Save the updated book list to the JSON file
        self.save_books()
        return new_book_obj # Return the object on successful save

    def delete_book(self, book_id: str) -> bool:
        """Removes a book by its ID from the store and saves to file."""
        book_to_delete = next((b for b in self.books if b.id == book_id), None)
        if not book_to_delete:
            return False

        self.books.remove(book_to_delete)

        # Read the current file, filter out the book, and write back
        try:
            with open(self.books_file, 'r') as f:
                all_books = json.load(f)
            
            filtered_books = [b for b in all_books if b['id'] != book_id]

            with open(self.books_file, 'w') as f:
                json.dump(filtered_books, f, indent=4)
            
            return True
        except (IOError, json.JSONDecodeError):
            # This block is necessary to handle file errors and complete the 'try'
            return False

    def update_order(self, ordered_ids: list) -> bool:
        """Reorders the books in memory and in the JSON file."""
        # Create a dictionary for quick lookups
        book_map = {book.id: book for book in self.books}
        
        # Create the new ordered list of Book objects
        new_ordered_books = [book_map[id] for id in ordered_ids if id in book_map]

        # If the lengths don't match, something went wrong
        if len(new_ordered_books) != len(self.books):
            return False

        # Update the in-memory list
        self.books = new_ordered_books

        # Create a new list of raw dictionaries to save to the file
        raw_books_to_save = [book.__dict__ for book in self.books]
        
        try:
            with open(self.books_file, 'w') as f:
                json.dump(raw_books_to_save, f, indent=4)
            return True
        except IOError:
            return False