from src import create_app
# NEW: Import the utility function and the 'click' library for CLI commands
from src.utils import enrich_book_data
import click

# Create the Flask app using the application factory in the 'src' package.
app = create_app()

# NEW: Define a custom Flask CLI command
@app.cli.command("enrich-books")
def enrich_books_command():
    """
    Reads books.json, enriches each book with data from the Google Books API,
    and overwrites the file.
    """
    click.echo("Starting book enrichment process...")
    enrich_book_data()
    click.echo("Book enrichment process finished.")


# This block allows running the app directly with 'python app.py'
if __name__ == "__main__":
    # The 'flask run' command will also find and run this 'app' object.
    app.run(debug=True)
