document.addEventListener('DOMContentLoaded', () => {

    const bookList = document.getElementById('book-list');
    const exportButton = document.getElementById('export-button');

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

    // --- Attach Event Listeners ---
    if (bookList) {
        bookList.addEventListener('click', handleVoteClick);
    }
    if (exportButton) {
        exportButton.addEventListener('click', handleExportClick);
    }

    // --- Initial Load ---
    // Fetch and display the initial vote counts when the page loads
    updateVoteCounts();
});