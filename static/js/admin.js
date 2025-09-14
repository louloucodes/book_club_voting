/**
 * Handles the submission of the "Add Book" form.
 */
async function handleAddBookSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
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
    if (!event.target.classList.contains('delete-button')) {
        return;
    }

    const button = event.target;
    const bookId = button.dataset.id;
    const listItem = document.getElementById(`manage-item-${bookId}`);
    const bookTitle = listItem.querySelector('.book-title').textContent.trim();

    if (confirm(`Are you sure you want to delete "${bookTitle}"?`)) {
        try {
            const response = await fetch(`/admin/delete_book/${bookId}`, { method: 'POST' });
            const result = await response.json();

            if (response.ok && result.success) {
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
    const manageBookList = document.getElementById('manage-book-list');
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
            document.getElementById('save-order-button').style.display = 'none';
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

/**
 * Handles submission of the voting system settings form.
 */
async function handleSettingsSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const settingsData = {
        voting_system: formData.get('voting_system')
    };

    const settingsMessage = document.getElementById('settings-message');
    settingsMessage.textContent = '';
    settingsMessage.className = 'form-message';

    try {
        const response = await fetch('/admin/update_settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settingsData)
        });

        if (response.ok) {
            settingsMessage.textContent = 'Settings saved successfully! The page will now reload to apply changes.';
            settingsMessage.classList.add('success');
            // Reload the page after a short delay to show the message and apply changes server-side
            setTimeout(() => window.location.reload(), 2000);
        } else {
            const result = await response.json();
            throw new Error(result.message || 'An unknown error occurred.');
        }
    } catch (error) {
        settingsMessage.textContent = `Error: ${error.message}`;
        settingsMessage.classList.add('error');
    }
}

/**
 * Handles the logic for switching between admin tabs.
 */
function handleTabSwitching(event) {
    // Ensure the clicked element is a tab link
    if (!event.target.classList.contains('tab-link')) {
        return;
    }

    const clickedTab = event.target;
    const targetPanelId = clickedTab.dataset.target;
    const targetPanel = document.getElementById(targetPanelId);

    // Remove 'active' class from all tabs and panels
    document.querySelectorAll('.tab-link').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(panel => {
        panel.classList.remove('active');
    });

    // Add 'active' class to the clicked tab and its corresponding panel
    clickedTab.classList.add('active');
    if (targetPanel) {
        targetPanel.classList.add('active');
    }
}

// --- Initialization for Admin Page ---
export function initAdminPage() {
    const adminForm = document.getElementById('add-book-form');
    const manageBookList = document.getElementById('manage-book-list');
    const saveOrderButton = document.getElementById('save-order-button');
    // NEW: Get the settings form
    const settingsForm = document.getElementById('voting-system-form');

    if (adminForm) {
        adminForm.addEventListener('submit', handleAddBookSubmit);
    }
    if (manageBookList) {
        manageBookList.addEventListener('click', handleDeleteClick);
        
        new Sortable(manageBookList, {
            animation: 150,
            handle: '.drag-handle',
            onUpdate: () => {
                document.getElementById('save-order-button').style.display = 'inline-block';
            }
        });
    }
    if (saveOrderButton) {
        saveOrderButton.addEventListener('click', handleSaveOrder);
    }
    // NEW: Add event listener for the settings form
    if (settingsForm) {
        settingsForm.addEventListener('submit', handleSettingsSubmit);
    }

    // NEW: Add event listener for the tab container
    const tabContainer = document.querySelector('.tab-container');
    if (tabContainer) {
        tabContainer.addEventListener('click', handleTabSwitching);
    }
}