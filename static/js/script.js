document.addEventListener('DOMContentLoaded', () => {
    // --- Admin Panel Logic ---
    const adminForm = document.getElementById('add-book-form');
    const manageBookList = document.getElementById('manage-book-list');
    const saveOrderButton = document.getElementById('save-order-button');

    // --- Plurality Voting Logic ---
    const bookList = document.getElementById('book-list');

    // --- Ranked Choice Voting Logic ---
    const rankedChoiceList = document.getElementById('ranked-choice-list');
    const submitBallotButton = document.getElementById('submit-ballot-button');

    // --- Shared Logic ---
    const exportButton = document.getElementById('export-button');

    /**
     * Fetches the latest vote counts from the server and updates the UI.
     * This is specific to the plurality voting system.
     */
    async function updateVoteCounts() {
        try {
            const response = await fetch('/results');
            if (!response.ok) throw new Error('Failed to fetch results');
            
            const results = await response.json();
            
            document.querySelectorAll('.vote-count').forEach(span => {
                const bookId = span.id.split('-')[1];
                span.textContent = `${results[bookId] || 0} votes`;
            });
        } catch (error) {
            console.error('Error updating vote counts:', error);
        }
    }

    /**
     * Handles a click on a plurality vote button.
     */
    async function handleVoteClick(event) {
        if (!event.target.classList.contains('vote-button')) {
            return;
        }

        const button = event.target;
        const bookId = button.dataset.id;

        try {
            const response = await fetch(`/vote/${bookId}`, {
                method: 'POST',
            });

            if (response.ok) {
                console.log(`Voted for ${bookId}`);
                updateVoteCounts(); // Refresh counts after voting
            } else {
                console.error('Failed to submit vote.');
            }
        } catch (error) {
            console.error('Error submitting vote:', error);
        }
    }

    /**
     * Handles the submission of a ranked-choice ballot.
     */
    async function handleBallotSubmit() {
        const rankedItems = rankedChoiceList.querySelectorAll('li');
        const ballot = Array.from(rankedItems).map(item => item.dataset.id);

        const voteMessage = document.getElementById('vote-message');
        voteMessage.textContent = '';
        voteMessage.className = 'form-message';

        try {
            const response = await fetch('/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ballot: ballot })
            });

            const result = await response.json();

            if (response.ok) {
                voteMessage.textContent = 'Your ballot has been submitted successfully!';
                voteMessage.classList.add('success');
                submitBallotButton.disabled = true; // Prevent re-voting
                submitBallotButton.style.backgroundColor = '#ccc';
            } else {
                voteMessage.textContent = `Error: ${result.message || 'Could not submit ballot.'}`;
                voteMessage.classList.add('error');
            }
        } catch (error) {
            console.error('Ballot submission error:', error);
            voteMessage.textContent = 'A network error occurred. Please try again.';
            voteMessage.classList.add('error');
        }
    }

    /**
     * Handles the submission of the "Add Book" form.
     */
    async function handleAddBookSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // MODIFIED: Removed publication_date from the data sent to the server.
        const bookData = {
            title: data.title,
            author: data.author,
            suggested_by: data.suggested_by
        };

        const formMessage = document.getElementById('form-message');
        formMessage.textContent = '';
        formMessage.className = 'form-message';

        try {
            const response = await fetch('/admin/add_book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                formMessage.textContent = 'Book added successfully!';
                formMessage.classList.add('success');
                form.reset();
                // Add the new book to the list dynamically
                const newListItem = createManageListItem(result.book);
                document.getElementById('manage-book-list').appendChild(newListItem);
            } else {
                formMessage.textContent = `Error: ${result.message || 'Could not add book.'}`;
                formMessage.classList.add('error');
            }
        } catch (error) {
            console.error('Add book error:', error);
            formMessage.textContent = 'A network error occurred. Please try again.';
            formMessage.classList.add('error');
        }
    }

    /**
     * Handles clicks on the delete buttons in the admin panel.
     */
    async function handleDeleteClick(event) {
        // Use event delegation to catch clicks on delete buttons
        if (!event.target.classList.contains('delete-button')) {
            return;
        }

        const button = event.target;
        const bookId = button.dataset.id;
        const listItem = document.getElementById(`manage-item-${bookId}`);
        // MODIFIED: Use the specific class to get the book title
        const bookTitle = listItem.querySelector('.book-title-text').textContent.trim();

        // Confirm with the user before deleting
        if (confirm(`Are you sure you want to delete "${bookTitle}"?`)) {
            try {
                // MODIFIED: Added the /admin prefix to the URL
                const response = await fetch(`/admin/delete_book/${bookId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                const result = await response.json();

                if (response.ok) {
                    // Remove the item from the DOM for immediate feedback
                    listItem.remove();
                } else {
                    alert(`Error: ${result.message || 'Could not delete book.'}`);
                }
            } catch (error) {
                console.error('Delete request error:', error);
                alert('A network error occurred while trying to delete the book.');
            }
        }
    }

    /**
     * Saves the new order of books in the admin panel.
     */
    async function handleSaveOrder() {
        const listItems = manageBookList.querySelectorAll('li');
        const orderedIds = Array.from(listItems).map(item => item.dataset.id);

        const orderMessage = document.getElementById('order-message');
        orderMessage.textContent = '';
        orderMessage.className = 'form-message';

        try {
            const response = await fetch('/admin/update_order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order: orderedIds })
            });
            const result = await response.json();
            if (response.ok) {
                orderMessage.textContent = 'Order saved successfully!';
                orderMessage.className = 'form-message success';
                saveOrderButton.style.display = 'none'; // Hide button after saving
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            orderMessage.textContent = `Error saving order: ${error.message}`;
            orderMessage.className = 'form-message error';
        }
    }

    /**
     * Creates and returns an HTML list item for the admin management list.
     */
    function createManageListItem(book) {
        const listItem = document.createElement('li');
        listItem.className = 'book-item';
        listItem.dataset.id = book.id;
        listItem.id = `manage-item-${book.id}`;

        // This is a simplified version. A more robust solution might use a <template> element.
        // Note: This assumes the config.SHOW_SUGGESTER is true. The dynamic part is tricky without another server call.
        listItem.innerHTML = `
            <span class="drag-handle">&#x2630;</span>
            <div class="book-cover">
                ${book.cover_image_url 
                    ? `<img src="${book.cover_image_url}" alt="Cover of ${book.title}">` 
                    : `<div class="cover-placeholder">No Image</div>`
                }
            </div>
            <div class="book-info">
                <h2 class="book-title">${book.title}</h2>
                <p class="book-author">by ${book.author}</p>
                <!-- MODIFIED: Use 'published_date' to match the JSON from the server -->
                <p class="book-publication-date">Published: ${book.published_date || 'N/A'}</p>
            </div>
            <div class="book-suggester">
                <p>Suggested by:</p>
                <strong>${book.suggested_by || 'N/A'}</strong>
            </div>
            <button class="delete-button" data-id="${book.id}">&times;</button>
        `;
        return listItem;
    }


    // --- Initialization ---

    // Initialize plurality voting logic if its elements exist
    if (bookList) {
        bookList.addEventListener('click', handleVoteClick);
        updateVoteCounts(); // Initial load of vote counts
        // Optional: Periodically refresh vote counts
        // setInterval(updateVoteCounts, 5000); 
    }

    // Initialize ranked-choice voting logic if its elements exist
    if (rankedChoiceList) {
        new Sortable(rankedChoiceList, {
            animation: 150,
            handle: '.drag-handle',
        });

        submitBallotButton.addEventListener('click', handleBallotSubmit);
    }

    // Initialize admin panel logic if its elements exist
    if (adminForm) {
        adminForm.addEventListener('submit', handleAddBookSubmit);
    }
    if (manageBookList) {
        manageBookList.addEventListener('click', handleDeleteClick);
        
        new Sortable(manageBookList, {
            animation: 150,
            handle: '.drag-handle',
            onUpdate: () => {
                saveOrderButton.style.display = 'inline-block';
            }
        });
    }
    if (saveOrderButton) {
        saveOrderButton.addEventListener('click', handleSaveOrder);
    }

    // Initialize shared logic
    if (exportButton) {
        exportButton.addEventListener('click', () => {
            window.location.href = '/export';
        });
    }
});