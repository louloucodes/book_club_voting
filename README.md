# Book Club Voting App

## 📖 Project Description

This project is a multi-page web application designed for a book club to easily vote on their next book. The application provides a public-facing area for members to view the book list and vote, and a separate, password-protected admin panel for managing the book list. The goal is to provide a straightforward and user-friendly interface with a clear separation between user and administrator capabilities.

## ⭐ Key Features in Action

The admin panel provides full control over the book list and application settings. The public voting page allows members to easily cast their votes using the currently active system.

| Admin Panel (Manage Books & Settings)         | Public Voting Page                        |
| --------------------------------------------- | ----------------------------------------- |
| <img src="assets/admin_screen_recording.gif" alt="Admin panel demo showing adding, deleting, and reordering books" width="400"> | <img src="assets/voting_page.png" alt="Public voting page with book list" width="400"> |

### Flexible Voting Systems

The application supports multiple voting systems, which can be configured directly from the admin panel to suit the book club's needs:

*   **Plurality Voting:** The classic system where each member gets one vote for one book.
*   **Ranked-Choice Voting:** Members rank their preferred books in order. If no book wins a majority, the book with the fewest votes is eliminated, and its votes are redistributed until a winner emerges.
*   **Cumulative Voting:** Each member is given a set number of points (e.g., 5) to distribute among the books however they wish. They can give all points to one book or spread them across multiple choices.

## 🏗️ Software Architecture

The application is built with a clean, scalable structure that separates concerns using Flask Blueprints and a strategy pattern for voting logic.

*   **`config.py`:** Centralizes application configuration. It loads sensitive data like the `SECRET_KEY` and `ADMIN_PASSWORD` from environment variables for improved security.
*   **`app.py`:** The main entry point for the Flask application. It contains the `create_app` factory, which initializes the app, loads the configuration, and registers the application's blueprints.
*   **`src/` directory:** Contains the core backend logic, organized by function.
    *   **`main.py`:** A Flask Blueprint for all public-facing routes, such as the voting and results pages.
    *   **`admin.py`:** A Flask Blueprint that encapsulates all administrative functionality, including login, logout, book management, and voting system configuration.
    *   **`books.py`:** Defines the `Book` and `BookStore` classes, managing all data loading, saving, and in-memory storage of books.
    *   **`voting.py`:** Implements the **Strategy Pattern** for different voting systems (`PluralityStrategy`, `RankedChoiceStrategy`, `CumulativeVotingStrategy`).
    *   **`voting_manager.py`:** Defines the `VotingManager` class, which acts as a context for the current voting strategy and handles all voting-related operations like recording votes and calculating results.
*   **`templates/`:** Contains all Jinja2 HTML templates, including a `base.html` for a consistent layout across all pages.
*   **`static/`:** Contains all frontend assets.
    *   **`css/`:** CSS is organized into a component-based structure and imported into a single `main.css` file.
    *   **`js/`:** Contains the client-side JavaScript for handling dynamic features on the admin and voting pages.

## 💻 Technology Stack

*   **Backend:** Python with the **Flask** web framework.
*   **Frontend:** Vanilla **HTML**, **CSS**, and **JavaScript**.
*   **Data Storage:**
    *   A static `data/books.json` file is used as the database for the book list.
    *   **Flask Sessions** are used for admin authentication.
    *   Vote counts are stored in-memory on the server.

## 🚀 Local Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd book_club_voting
    ```

2.  **Create and activate a virtual environment:**
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Create the environment file:** Create a file named `.env` in the project root and add the following variables. This file is ignored by Git.
    ```
    # .env
    SECRET_KEY='generate-a-long-random-string-for-this'
    ADMIN_PASSWORD='your-chosen-admin-password'
    ```

5.  **Run the application:**
    ```bash
    flask run
    ```
    The application will be available at `http://127.0.0.1:5000`.