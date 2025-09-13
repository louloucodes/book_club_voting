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
        const response = await fetch(`/vote/${bookId}`, { method: 'POST' });
        if (response.ok) {
            console.log(`Voted for ${bookId}`);
            updateVoteCounts();
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
    const rankedChoiceList = document.getElementById('ranked-choice-list');
    const submitBallotButton = document.getElementById('submit-ballot-button');
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
            submitBallotButton.disabled = true;
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
 * Initialization function for the Voting Page.
 */
export function initVotePage() {
    const bookList = document.getElementById('book-list');
    const rankedChoiceList = document.getElementById('ranked-choice-list');
    const submitBallotButton = document.getElementById('submit-ballot-button');
    const exportButton = document.getElementById('export-button');

    // Initialize plurality voting logic if its elements exist
    if (bookList) {
        bookList.addEventListener('click', handleVoteClick);
        updateVoteCounts();
    }

    // Initialize ranked-choice voting logic if its elements exist
    if (rankedChoiceList) {
        new Sortable(rankedChoiceList, {
            animation: 150,
            handle: '.drag-handle',
        });
        if (submitBallotButton) {
            submitBallotButton.addEventListener('click', handleBallotSubmit);
        }
    }

    // Initialize shared logic
    if (exportButton) {
        exportButton.addEventListener('click', () => {
            window.location.href = '/export';
        });
    }
}