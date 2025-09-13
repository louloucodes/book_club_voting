document.addEventListener('DOMContentLoaded', () => {

    // --- Elements for Voting Page ---
    const bookList = document.getElementById('book-list');
    const exportButton = document.getElementById('export-button');

    // --- Elements for Admin Page ---
    const addBookForm = document.getElementById('add-book-form');
    const formMessage = document.getElementById('form-message');
    const manageBookList = document.getElementById('manage-book-list');

    /**
     * NEW: Creates and returns an HTML list item for the admin management list.
     * @param {object} book - The book object returned from the API.
     * @returns {HTMLLIElement} A new <li> element.
     */
    function createManageListItem(book) {
        const listItem = document.createElement('li');
        listItem.className = 'manage-list-item';
        listItem.id = `manage-item-${book.id}`;

        const span = document.createElement('span');
        span.textContent = `${book.title} by ${book.author}`;

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.dataset.id = book.id;
        deleteButton.innerHTML = '&times;'; // The 'x' symbol

        listItem.appendChild(span);
        listItem.appendChild(deleteButton);

        return listItem;
    }

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
                // MODIFIED: Instead of just showing a message, dynamically update the list.
                formMessage.textContent = `Success! "${result.book.title}" has been added.`;
                formMessage.classList.add('success');
                addBookForm.reset(); // Clear the form fields

                // Create the new list item and append it to the management list
                const newListItem = createManageListItem(result.book);
                manageBookList.appendChild(newListItem);

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

    /**
     * NEW: Handles clicks on the delete buttons in the admin panel.
     */
    async function handleDeleteClick(event) {
        // Use event delegation to catch clicks on delete buttons
        if (!event.target.classList.contains('delete-button')) {
            return;
        }

        const button = event.target;
        const bookId = button.dataset.id;
        const listItem = document.getElementById(`manage-item-${bookId}`);
        const bookTitle = listItem.querySelector('span').textContent.trim();

        // Confirm with the user before deleting
        if (confirm(`Are you sure you want to delete "${bookTitle}"?`)) {
            try {
                const response = await fetch(`/delete_book/${bookId}`, {
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


    // --- Attach Event Listeners ---

    // Listeners for the Voting Page
    if (bookList) {
        bookList.addEventListener('click', handleVoteClick);
    }
    if (exportButton) {
        exportButton.addEventListener('click', handleExportClick);
    }

    // Listeners for the Admin Page
    if (addBookForm) {
        addBookForm.addEventListener('submit', handleAddBookSubmit);
    }
    if (manageBookList) {
        // MODIFIED: Define these constants only when we know we're on the admin page.
        const saveOrderButton = document.getElementById('save-order-button');
        const orderMessage = document.getElementById('order-message');

        manageBookList.addEventListener('click', handleDeleteClick);

        // Initialize SortableJS for drag-and-drop
        new Sortable(manageBookList, {
            animation: 150,
            handle: '.drag-handle', // Use a handle for dragging
            onUpdate: function () {
                // Show the save button when the order changes
                if (saveOrderButton) {
                    saveOrderButton.style.display = 'block';
                }
                if (orderMessage) {
                    orderMessage.className = 'form-message'; // Hide any previous message
                }
            }
        });

        // MODIFIED: The listener for the save button also needs to be inside this block.
        if (saveOrderButton) {
            saveOrderButton.addEventListener('click', async () => {
                const listItems = manageBookList.querySelectorAll('li');
                const orderedIds = Array.from(listItems).map(item => item.dataset.id);

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
            });
        }
    }


    // --- Initial Load ---
    // Fetch and display the initial vote counts only on the vote page
    if (bookList) {
        updateVoteCounts();
    }
});