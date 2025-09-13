# Book Club Voting App

## Project Description

This project is a simple, single-page web application designed for a book club to easily vote on their next book. The goal is to provide a straightforward and user-friendly interface that requires no login or complex setup. The application displays a list of suggested books, allows members to cast votes, and shows the results in real-time.

## MVP Features

The Minimum Viable Product (MVP) includes the following core features:

*   **Display Book List:** Shows a list of books to vote on, loaded from a static `JSON` data file. Each entry displays the book's title, author, and who suggested it.
*   **Live Voting:** Users can click a "Vote" button next to each book. The vote is registered on the backend without needing a page refresh.
*   **Real-Time Results:** Vote counts next to each book are updated dynamically as votes are cast.
*   **Export to CSV:** A simple "Export Results" button allows users to download the current vote counts as a `.csv` file for easy record-keeping.

## Technology Stack

This application is built with a focus on simplicity and minimal dependencies.

*   **Backend:** Python with the **Flask** web framework.
*   **Frontend:** Vanilla **HTML**, **CSS**, and **JavaScript** (no frameworks).
*   **Data Storage:**
    *   A static `data/books.json` file is used to define the list of books.
    *   Vote counts are stored in-memory on the server, meaning they will reset whenever the application is restarted.