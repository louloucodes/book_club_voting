class Book:
    """Represents a single book in the voting list."""
    
    def __init__(self, book_data: dict):
        """Initializes a Book object from a dictionary."""
        self.id = book_data.get('id')
        self.title = book_data.get('title', 'Unknown Title')
        self.author = book_data.get('author', 'Unknown Author')
        self.suggested_by = book_data.get('suggested_by', 'N/A')
        
        # MODIFIED: Use 'published_date' to match the JSON file.
        # Also, provide a default value.
        self.published_date = book_data.get('published_date', 'N/A')
        
        self.cover_image_url = book_data.get('cover_image_url')
        self.summary = book_data.get('summary', 'No summary available.')
        
        # NEW: Add the other fields from the JSON file.
        self.page_count = book_data.get('page_count')
        self.categories = book_data.get('categories', [])
        self.publisher = book_data.get('publisher')

    def __repr__(self):
        return f"<Book(id={self.id}, title='{self.title}')>"
