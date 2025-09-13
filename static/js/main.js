document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on the admin page by looking for the 'add-book-form'.
    if (document.getElementById('add-book-form')) {
        console.log("On admin page, loading admin module...");
        // Dynamically import the admin module and run its initializer.
        import('./admin.js')
            .then(module => {
                module.initAdminPage();
            })
            .catch(err => console.error('Failed to load admin module:', err));
    }
    // Check if we are on the voting page by looking for one of its lists.
    else if (document.getElementById('book-list') || document.getElementById('ranked-choice-list')) {
        console.log("On vote page, loading vote module...");
        // Dynamically import the vote module and run its initializer.
        import('./vote.js')
            .then(module => {
                module.initVotePage();
            })
            .catch(err => console.error('Failed to load vote module:', err));
    }
    // If neither, we are on a simple page like the landing page. Do nothing.
    else {
        console.log("On a simple page, no modules to load.");
    }
});