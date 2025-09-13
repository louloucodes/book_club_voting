import os
import json
import requests
import time

# --- Configuration ---
# FIX: Construct an absolute path to ensure this script works from any directory.
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
BOOKS_FILE = os.path.join(project_root, 'data', 'books.json')
API_BASE_URL = "https://www.googleapis.com/books/v1/volumes"

def enrich_book_data():
    """
    Reads the books.json file, fetches additional data from the Google Books API
    for each book, and overwrites the file with the enriched data.
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
        title = book.get("title", "")
        author = book.get("author", "")
        
        print(f"\nFetching data for '{title}' by {author}...")

        query = f"intitle:{title}+inauthor:{author}"
        params = {"q": query, "maxResults": 1}

        try:
            response = requests.get(API_BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()

            if "items" in data and len(data["items"]) > 0:
                volume_info = data["items"][0].get("volumeInfo", {})
                
                book['summary'] = volume_info.get('description', 'No summary available.')
                book['page_count'] = volume_info.get('pageCount', None)
                book['categories'] = volume_info.get('categories', [])
                book['published_date'] = volume_info.get('publishedDate', None)
                book['publisher'] = volume_info.get('publisher', None)
                
                image_links = volume_info.get('imageLinks', {})
                book['cover_image_url'] = image_links.get('thumbnail', None)

                print(f"  -> Success: Found and enriched '{title}'.")
            else:
                print(f"  -> Warning: Could not find a match for '{title}'.")

        except requests.exceptions.RequestException as e:
            print(f"  -> Error: API request failed for '{title}'. Reason: {e}")

        enriched_books.append(book)
        time.sleep(1)

    with open(BOOKS_FILE, 'w') as f:
        json.dump(enriched_books, f, indent=4)

    print("\nEnrichment complete. books.json has been updated.")

if __name__ == "__main__":
    enrich_book_data()