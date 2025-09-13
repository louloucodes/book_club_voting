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

// --- Initialization for Admin Page ---
export function initAdminPage() {
    const adminForm = document.getElementById('add-book-form');
    const manageBookList = document.getElementById('manage-book-list');

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
    const saveOrderButton = document.getElementById('save-order-button');
    if (saveOrderButton) {
        saveOrderButton.addEventListener('click', handleSaveOrder);
    }
}