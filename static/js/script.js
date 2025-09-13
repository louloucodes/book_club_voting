document.addEventListener('DOMContentLoaded', () => {

    // --- Elements for Voting Page ---
    const bookList = document.getElementById('book-list');
    const exportButton = document.getElementById('export-button');

    // --- Elements for Add Book Page ---
    const addBookForm = document.getElementById('add-book-form');
    const formMessage = document.getElementById('form-message');

    /**
     * Fetches the latest vote counts from the server and updates the UI.
     */
    async function updateVoteCounts() {
        try {
            const response = await fetch('/results');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const votes = await response.json();
            
            // Update the vote count for each book on the page
            for (const bookId in votes) {
                const countElement = document.getElementById(`votes-${bookId}`);
                if (countElement) {
                    const count = votes[bookId];
                    countElement.textContent = `${count} vote${count === 1 ? '' : 's'}`;
                }
            }
        } catch (error) {
            console.error('Failed to fetch vote counts:', error);
        }
    }

    /**
     * Handles clicks within the book list, specifically on vote buttons.
     */
    async function handleVoteClick(event) {
        // Check if a vote button was clicked
        if (event.target.classList.contains('vote-button')) {
            const bookId = event.target.dataset.id;
            
            try {
                const response = await fetch(`/vote/${bookId}`, {
                    method: 'POST',
                });

                if (response.ok) {
                    // If the vote was successful, update the counts on the page
                    await updateVoteCounts();
                } else {
                    console.error('Failed to submit vote.');
                }
            } catch (error) {
                console.error('Error submitting vote:', error);
            }
        }
    }

    /**
     * Handles the click on the export button.
     */
    function handleExportClick() {
        // Redirect the browser to the export URL to trigger the download
        window.location.href = '/export';
    }

    /**
     * NEW: Handles the submission of the 'Add a Book' form.
     */
    async function handleAddBookSubmit(event) {
        event.preventDefault(); // Prevent the default page reload

        const formData = new FormData(addBookForm);
        const bookData = {
            title: formData.get('title'),
            author: formData.get('author'),
            suggested_by: formData.get('suggested_by')
        };

        // Clear previous messages
        formMessage.textContent = '';
        formMessage.className = 'form-message';

        try {
            const response = await fetch('/add_book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bookData),
            });

            const result = await response.json();

            if (response.ok) {
                formMessage.textContent = `Success! "${result.book.title}" has been added to the list.`;
                formMessage.classList.add('success');
                addBookForm.reset(); // Clear the form fields
            } else {
                formMessage.textContent = `Error: ${result.message || 'Could not add book.'}`;
                formMessage.classList.add('error');
            }
        } catch (error) {
            console.error('Form submission error:', error);
            formMessage.textContent = 'A network error occurred. Please try again.';
            formMessage.classList.add('error');
        }
    }


    // --- Attach Event Listeners ---

    // Listeners for the Voting Page
    if (bookList) {
        bookList.addEventListener('click', handleVoteClick);
    }
    if (exportButton) {
        exportButton.addEventListener('click', handleExportClick);
    }

    // NEW: Listener for the Add Book Page
    if (addBookForm) {
        addBookForm.addEventListener('submit', handleAddBookSubmit);
    }


    // --- Initial Load ---
    // Fetch and display the initial vote counts only on the vote page
    if (bookList) {
        updateVoteCounts();
    }
});