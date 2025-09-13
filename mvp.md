# Book Club Voting MVP

This streamlined web app will allow book club members to vote on books that they want to read from a given list of books.

## Static Book List:

Instead of allowing users to submit books, create a static list of books in a CSV or JSON format that the app reads from. This can be easily modified when needed without requiring a user interface for submissions.

## Basic Voting Mechanism:

Implement a simple voting button (e.g., "Vote for this book") next to each book. You can use a basic counter stored in memory (or in a simple local file) to tally votes without needing a database.

## Results Display:

Show the current vote counts directly on the same page where users vote. This can be updated dynamically using JavaScript.
Single Page Application:

Build the app as a single-page application (SPA) to keep the user experience fluid. Users can see the book list and vote without navigating between pages.

## Voting Period:

Instead of a complex voting period setup, you could simply allow voting to be open until the app is closed, or set a fixed duration (e.g., until the next session) without requiring a complex backend.

## Export Functionality:

Provide a simple button to export the results (vote counts) to a CSV file for easy sharing or record-keeping.

## Optional Features (for Consideration):
### Basic Styling:

Even with minimal features, consider adding some basic CSS for a better user interface, making it easier to read and interact with.
### Instructions:

Include a simple instruction section on how to use the app, especially if it’s meant for users who may not be tech-savvy.

## Technology Stack Suggestions:
### Frontend: 
Use HTML, CSS, and vanilla JavaScript and Python Flask

### Local Storage: 
Consider using the browser's local storage to keep track of votes temporarily if you want to persist the data between sessions without a database.