/**
 * Handles switching between admin tabs.
 */
function handleTabSwitching(event) {
    if (!event.target.classList.contains('tab-link')) return;

    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    const targetPanelId = event.target.dataset.target;

    tabs.forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');

    tabContents.forEach(panel => {
        panel.classList.remove('active');
        if (panel.id === targetPanelId) {
            panel.classList.add('active');
        }
    });
}

/**
 * Handles the submission of the "Add Book" form.
 */
async function handleAddBookSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    const messageEl = document.getElementById('form-message'); // Specific to add-book form

    try {
        const response = await fetch(form.action, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const result = await response.json();

        if (response.ok) {
            messageEl.textContent = 'Book added successfully! The page will now refresh.';
            messageEl.className = 'form-message success';
            form.reset();
            setTimeout(() => location.reload(), 1500); // Refresh to show the new book
        } else {
            throw new Error(result.message || 'An unknown error occurred.');
        }
    } catch (error) {
        messageEl.textContent = `Error: ${error.message}`;
        messageEl.className = 'form-message error';
    }
}

/**
 * Handles clicks on the delete button for a book.
 */
async function handleDeleteClick(event) {
    if (!event.target.classList.contains('delete-button')) return;

    const bookId = event.target.dataset.id;
    const bookTitle = event.target.closest('.book-item').querySelector('.book-title').textContent;
    const messageEl = document.getElementById('order-message'); // Use the message area in this panel

    if (confirm(`Are you sure you want to delete "${bookTitle}"?`)) {
        try {
            const response = await fetch(`/admin/delete_book/${bookId}`, { method: 'DELETE' });
            const result = await response.json();

            if (response.ok) {
                event.target.closest('.book-item').remove();
                messageEl.textContent = 'Book deleted successfully.';
                messageEl.className = 'form-message success';
            } else {
                throw new Error(result.message || 'Failed to delete book.');
            }
        } catch (error) {
            messageEl.textContent = `Error: ${error.message}`;
            messageEl.className = 'form-message error';
        }
    }
}

/**
 * Handles saving the new order of books.
 */
async function handleSaveOrder() {
    const bookItems = document.querySelectorAll('#manage-book-list .book-item');
    const order = Array.from(bookItems).map(item => item.dataset.id);
    const messageEl = document.getElementById('order-message');

    try {
        const response = await fetch('/admin/update_order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order }),
        });
        const result = await response.json();

        if (response.ok) {
            messageEl.textContent = 'Book order saved successfully.';
            messageEl.className = 'form-message success';
            document.getElementById('save-order-button').style.display = 'none';
        } else {
            throw new Error(result.message || 'Failed to save order.');
        }
    } catch (error) {
        messageEl.textContent = `Error: ${error.message}`;
        messageEl.className = 'form-message error';
    }
}

/**
 * Handles submission of the settings form.
 */
async function handleSettingsSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    const messageEl = document.getElementById('settings-message');

    try {
        const response = await fetch('/admin/update_settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const result = await response.json();

        if (response.ok) {
            messageEl.textContent = 'Settings updated successfully!';
            messageEl.className = 'form-message success';
        } else {
            throw new Error(result.message || 'Failed to update settings.');
        }
    } catch (error) {
        messageEl.textContent = `Error: ${error.message}`;
        messageEl.className = 'form-message error';
    }
}

// --- Main Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    const tabContainer = document.querySelector('.tab-container');
    const addBookForm = document.getElementById('add-book-form');
    const manageBookList = document.getElementById('manage-book-list');
    const saveOrderButton = document.getElementById('save-order-button');
    const settingsForm = document.getElementById('voting-system-form');

    if (tabContainer) {
        tabContainer.addEventListener('click', handleTabSwitching);
    }
    if (addBookForm) {
        addBookForm.addEventListener('submit', handleAddBookSubmit);
    }
    if (manageBookList) {
        manageBookList.addEventListener('click', handleDeleteClick);
        // Initialize SortableJS for drag-and-drop
        if (typeof Sortable !== 'undefined') {
            new Sortable(manageBookList, {
                animation: 150,
                handle: '.drag-handle',
                onUpdate: () => {
                    document.getElementById('save-order-button').style.display = 'inline-block';
                }
            });
        }
    }
    if (saveOrderButton) {
        saveOrderButton.addEventListener('click', handleSaveOrder);
    }
    if (settingsForm) {
        settingsForm.addEventListener('submit', handleSettingsSubmit);
        // Also show/hide the points input based on radio selection
        // FIX: The variable was 'form', but it should be 'settingsForm'.
        settingsForm.elements.voting_system.forEach(radio => {
            radio.addEventListener('change', (e) => {
                document.getElementById('cumulative-points-group').style.display = 
                    e.target.value === 'cumulative' ? 'block' : 'none';
            });
        });
    }
});