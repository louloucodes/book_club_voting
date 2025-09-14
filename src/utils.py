import os
import json
import requests
import time
import re
from html.parser import HTMLParser
from langdetect import detect, LangDetectException

# NEW: Create a custom HTML parser class to strip tags.
class MLStripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self.reset()
        self.text_parts = []
    def handle_data(self, d):
        self.text_parts.append(d)
    def get_text(self):
        return ''.join(self.text_parts)

def strip_tags(html_text: str) -> str:
    """Strips HTML tags from a string."""
    if not html_text:
        return ""
    stripper = MLStripper()
    stripper.feed(html_text)
    return stripper.get_text()

# --- Configuration ---
# FIX: Construct an absolute path to ensure this script works from any directory.
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
BOOKS_FILE = os.path.join(project_root, 'data', 'books.json')
API_BASE_URL = "https://www.googleapis.com/books/v1/volumes"

def is_promotional_text(text: str) -> bool:
    """
    Checks if a string contains patterns typical of promotional text,
    such as ISBNs, currency prices, or series lists.
    """
    if not text:
        return False
    
    text_lower = text.lower()
    
    # Pattern to find ISBN-10 or ISBN-13 numbers
    isbn_pattern = re.compile(r'\b(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]\b')
    
    # Pattern to find currency symbols and prices (e.g., $6.99, £8.99)
    price_pattern = re.compile(r'[\$\£\€]\s*\d+\.\d{2}')
    
    # MODIFIED: Add keywords that indicate a series list instead of a summary
    series_keywords = ['ender series', 'ender universe', 'ender\'s shadow series', 'formic war']
    
    if isbn_pattern.search(text) or price_pattern.search(text):
        return True
    
    if any(keyword in text_lower for keyword in series_keywords):
        return True
        
    return False

# NEW: Add a function to detect study guides or summaries.
def is_supplementary_material(volume_info: dict, cleaned_summary: str) -> bool:
    """
    Heuristically determines if a book volume is a study guide, summary,
    or other supplementary material.
    """
    title = volume_info.get('title', '').lower()
    summary_lower = cleaned_summary.lower()
    
    # Keywords that indicate supplementary material
    supplementary_keywords = [
        'study guide', 'cliffsnotes', 'sparknotes', 'a guide to',
        'book summary', 'workbook', 'maxnotes', 'book-a-minute'
    ]
    
    # Check for keywords in the title or at the beginning of the summary
    if any(keyword in title for keyword in supplementary_keywords):
        print(f"  -> Rejecting due to supplementary keyword in title: '{volume_info.get('title')}'")
        return True
    
    if any(summary_lower.startswith(keyword) for keyword in supplementary_keywords):
        print(f"  -> Rejecting due to supplementary keyword in summary: '{volume_info.get('title')}'")
        return True
        
    return False

# NEW: Add a function to detect collections/box sets.
def is_collection_or_box_set(volume_info: dict) -> bool:
    """
    Heuristically determines if a book volume is a collection or box set.
    """
    # Check for keywords in the title
    title = volume_info.get('title', '').lower()
    collection_keywords = ['box set', 'collection', 'trilogy', 'series', 'omnibus']
    if any(keyword in title for keyword in collection_keywords):
        print(f"  -> Rejecting due to keyword in title: '{volume_info.get('title')}'")
        return True

    page_count = volume_info.get('pageCount')

    # NEW: Check for a page count of 0, which often indicates a placeholder.
    if page_count == 0:
        print(f"  -> Rejecting due to page count of 0: '{volume_info.get('title')}'")
        return True

        
    return False

def enrich_single_book(book: dict) -> dict:
    """
    Takes a book dictionary, queries the Google Books API, and returns
    the enriched dictionary, prioritizing the earliest English edition.
    """
    title = book.get("title", "")
    author = book.get("author", "")
    
    print(f"Fetching data for '{title}' by {author}...")
    query = f"intitle:{title}+inauthor:{author}"
    # MODIFIED: Add orderBy='newest' to get a better selection of results
    params = {"q": query, "maxResults": 10, "langRestrict": "en", "orderBy": "newest"}

    try:
        response = requests.get(API_BASE_URL, params=params)
        response.raise_for_status()
        data = response.json()

        if "items" in data and len(data["items"]) > 0:
            best_volume_info = None
            
            # --- MODIFIED: Implement a new two-pass filtering strategy ---

            # Pass 1: Look for a "perfect" standalone novel.
            print("  -> Pass 1: Searching for a standalone novel...")
            for item in data["items"]:
                volume_info = item.get("volumeInfo", {})
                page_count = volume_info.get("pageCount")

                # Strict criteria for a standalone novel
                if (
                    volume_info.get("language") == "en" and
                    page_count and 10 < page_count < 600 and  # Must have a reasonable page count
                    not is_supplementary_material(volume_info, strip_tags(volume_info.get('description', '')))
                ):
                    print(f"  -> Found a likely standalone edition published on {volume_info.get('publishedDate')}.")
                    best_volume_info = volume_info
                    break  # Found a perfect match, stop searching.
            
            # Pass 2: If no perfect match was found, fall back to the old logic.
            if not best_volume_info:
                print("  -> Pass 2: No standalone novel found. Searching for the best available edition...")
                candidate_volumes = []
                for item in data["items"]:
                    volume_info = item.get("volumeInfo", {})
                    
                    # Use our existing, broader filters
                    raw_summary = volume_info.get('description')
                    cleaned_summary = strip_tags(raw_summary) if raw_summary else ""

                    if (
                        not is_collection_or_box_set(volume_info) and
                        not is_promotional_text(cleaned_summary) and
                        not is_supplementary_material(volume_info, cleaned_summary) and
                        volume_info.get("language") == "en"
                    ):
                        candidate_volumes.append(volume_info)
                
                if candidate_volumes:
                    candidate_volumes.sort(key=lambda v: v.get('publishedDate', '9999'))
                    best_volume_info = candidate_volumes[0]
                    print(f"  -> Found {len(candidate_volumes)} candidates. Choosing earliest: {best_volume_info.get('publishedDate')}")

            # --- The rest of the function proceeds as before ---
            if best_volume_info:
                # The rest of the function proceeds as before, using the chosen best_volume_info
                final_summary = strip_tags(best_volume_info.get('description'))
                
                try:
                    if final_summary and detect(final_summary) == 'en':
                        book['summary'] = final_summary
                    else:
                        book['summary'] = 'No valid English summary available.'
                except LangDetectException:
                    book['summary'] = 'No valid summary available.'

                book['page_count'] = best_volume_info.get('pageCount')
                book['categories'] = best_volume_info.get('categories', [])
                book['published_date'] = best_volume_info.get('publishedDate')
                book['publisher'] = best_volume_info.get('publisher')
                
                image_links = best_volume_info.get('imageLinks', {})
                book['cover_image_url'] = image_links.get('thumbnail')
                print(f"  -> Success: Enriched '{title}' with data from {book['published_date']} edition.")
            else:
                print(f"  -> No suitable editions found for '{title}' after filtering.")
                book['summary'] = 'Could not find a valid edition.'
        else:
            print(f"  -> Warning: Could not find a match for '{title}'.")

    except requests.exceptions.RequestException as e:
        print(f"  -> Error: API request failed for '{title}'. Reason: {e}")
    
    return book

def enrich_book_data():
    """
    Reads books.json, enriches each book using the Google Books API,
    and overwrites the file.
    """
    try:
        with open(BOOKS_FILE, 'r') as f:
            books = json.load(f)
    except FileNotFoundError:
        print(f"Error: {BOOKS_FILE} not found.")
        return

    enriched_books = []
    print("Starting book enrichment process...")

    for book in books:
        enriched_book = enrich_single_book(book)
        enriched_books.append(enriched_book)
        time.sleep(1) # Be polite to the API

    with open(BOOKS_FILE, 'w') as f:
        json.dump(enriched_books, f, indent=4)

    print("\nEnrichment complete. books.json has been updated.")

if __name__ == "__main__":
    enrich_book_data()