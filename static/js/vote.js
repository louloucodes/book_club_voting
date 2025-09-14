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
 * A global variable to hold the confirmation callback function.
 */
let onConfirmCallback = null;

/**
 * Shows the confirmation modal with dynamic content.
 * @param {string} title - The title for the modal.
 * @param {string} bodyHtml - The HTML content for the modal body.
 * @param {function} onConfirm - The function to execute when the confirm button is clicked.
 */
function showConfirmationModal(title, bodyHtml, onConfirm) {
    const modal = document.getElementById('confirmation-modal');
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHtml;
    
    onConfirmCallback = onConfirm; // Store the callback

    modal.style.display = 'flex';
}

/**
 * Hides the confirmation modal.
 */
function hideModal() {
    const modal = document.getElementById('confirmation-modal');
    modal.style.display = 'none';
    onConfirmCallback = null; // Clear the callback
}

/**
 * Handles a click on a plurality vote button by showing a confirmation modal.
 */
async function handleVoteClick(event) {
    if (!event.target.classList.contains('vote-button')) return;

    const button = event.target;
    const bookId = button.dataset.id;
    const bookItem = document.getElementById(`book-item-${bookId}`);
    const bookTitle = bookItem.querySelector('.book-title').textContent;

    const bodyHtml = `<p>Are you sure you want to vote for:</p><p><strong>${bookTitle}</strong></p>`;

    // Show the modal and pass the actual vote-casting logic as the callback
    showConfirmationModal('Confirm Your Vote', bodyHtml, async () => {
        try {
            const response = await fetch(`/vote/${bookId}`, { method: 'POST' });
            if (response.ok) {
                console.log(`Voted for ${bookId}`);
                updateVoteCounts();
                hideModal();
            } else {
                console.error('Failed to submit vote.');
                alert('Failed to submit vote.');
            }
        } catch (error) {
            console.error('Error submitting vote:', error);
        }
    });
}

/**
 * Handles the submission of a ranked-choice ballot by showing a confirmation modal.
 */
async function handleBallotSubmit() {
    const rankedChoiceList = document.getElementById('ranked-choice-list');
    const rankedItems = rankedChoiceList.querySelectorAll('li');
    
    // Build an ordered list for the modal body
    let bodyHtml = '<p>You have ranked the books as follows:</p><ol>';
    const ballot = [];
    rankedItems.forEach(item => {
        const title = item.querySelector('.book-title').textContent;
        bodyHtml += `<li>${title}</li>`;
        ballot.push(item.dataset.id);
    });
    bodyHtml += '</ol>';

    // Show the modal and pass the actual ballot submission logic as the callback
    showConfirmationModal('Confirm Your Ballot', bodyHtml, async () => {
        const submitBallotButton = document.getElementById('submit-ballot-button');
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
                // --- MODIFIED: Offer a download link upon success ---

                // 1. Prepare the text content for the file.
                let fileContent = "My Book Club Ballot\n";
                fileContent += "=====================\n\n";
                const rankedItems = document.querySelectorAll('#ranked-choice-list li');
                rankedItems.forEach((item, index) => {
                    const title = item.querySelector('.book-title').textContent;
                    fileContent += `${index + 1}. ${title}\n`;
                });
                fileContent += `\nVote submitted on: ${new Date().toLocaleString()}`;

                // 2. Create the download link.
                const downloadLink = document.createElement('a');
                downloadLink.href = '#';
                downloadLink.textContent = 'Download a copy of your vote.';
                downloadLink.style.display = 'block';
                downloadLink.style.marginTop = '10px';
                downloadLink.onclick = (e) => {
                    e.preventDefault();
                    generateTextFileDownload(fileContent, 'my_vote.txt');
                };

                // 3. Display the success message and the new link.
                voteMessage.textContent = 'Your ballot has been submitted successfully!';
                voteMessage.classList.add('success');
                voteMessage.appendChild(downloadLink); // Add the link to the message area

                submitBallotButton.disabled = true;
                submitBallotButton.style.backgroundColor = '#ccc';
                hideModal();
            } else {
                throw new Error(result.message || 'Could not submit ballot.');
            }
        } catch (error) {
            console.error('Ballot submission error:', error);
            voteMessage.textContent = `Error: ${error.message}`;
            voteMessage.classList.add('error');
            hideModal();
        }
    });
}

/**
 * Handles input changes for the cumulative voting form.
 * Updates the "points remaining" display and validates the total.
 * @param {number} pointsPerVoter - The total number of points a voter can allocate.
 */
function handleCumulativeInputChange(pointsPerVoter) {
    const inputs = document.querySelectorAll('.points-input');
    let totalPointsUsed = 0;
    inputs.forEach(input => {
        totalPointsUsed += parseInt(input.value, 10) || 0;
    });

    const pointsRemaining = pointsPerVoter - totalPointsUsed;
    const pointsRemainingEl = document.getElementById('points-remaining');
    const submitButton = document.getElementById('submit-cumulative-ballot');

    pointsRemainingEl.textContent = `Points remaining: ${pointsRemaining}`;

    // Dynamically update the max value for each input
    inputs.forEach(input => {
        const currentValue = parseInt(input.value, 10) || 0;
        // The most a user can add to this input is its current value plus any remaining points.
        input.max = currentValue + pointsRemaining;
    });

    // Disable submit button if the total is not correct
    if (pointsRemaining !== 0) {
        submitButton.disabled = true;
        pointsRemainingEl.style.color = 'green'; // Highlight if invalid
    } else {
        submitButton.disabled = false;
        pointsRemainingEl.style.color = 'red'; // Reset color
    }
}

/**
 * Handles the submission of a cumulative voting ballot.
 * @param {Event} event - The form submission event.
 * @param {number} pointsPerVoter - The total number of points allowed.
 */
async function handleCumulativeBallotSubmit(event, pointsPerVoter) {
    event.preventDefault(); // Prevent default form submission

    const inputs = document.querySelectorAll('.points-input');
    const ballot = {};
    let totalPointsUsed = 0;
    let summaryHtml = '<p>You have allocated your points as follows:</p><ul>';

    inputs.forEach(input => {
        const points = parseInt(input.value, 10) || 0;
        if (points > 0) {
            const bookItem = input.closest('.book-item');
            const bookId = bookItem.dataset.id;
            const bookTitle = bookItem.querySelector('.book-title').textContent;
            
            ballot[bookId] = points;
            summaryHtml += `<li><strong>${bookTitle}:</strong> ${points} point(s)</li>`;
        }
        totalPointsUsed += points;
    });
    summaryHtml += '</ul>';

    if (totalPointsUsed !== pointsPerVoter) {
        alert(`You must allocate exactly ${pointsPerVoter} points. You have used ${totalPointsUsed}.`);
        return;
    }

    showConfirmationModal('Confirm Your Ballot', summaryHtml, async () => {
        const voteMessage = document.getElementById('vote-message');
        voteMessage.textContent = '';
        voteMessage.className = 'form-message';

        try {
            const response = await fetch('/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ballot })
            });
            const result = await response.json();

            if (response.ok) {
                voteMessage.textContent = 'Your ballot has been submitted successfully!';
                voteMessage.classList.add('success');
                document.getElementById('submit-cumulative-ballot').disabled = true;
                hideModal();
            } else {
                throw new Error(result.message || 'Could not submit ballot.');
            }
        } catch (error) {
            console.error('Ballot submission error:', error);
            voteMessage.textContent = `Error: ${error.message}`;
            voteMessage.classList.add('error');
            hideModal();
        }
    });
}

/**
 * Creates a downloadable text file from a string of content.
 * @param {string} textContent - The content to be put in the text file.
 * @param {string} fileName - The name of the file to be downloaded (e.g., "my_vote.txt").
 */
function generateTextFileDownload(textContent, fileName) {
    // Create a Blob (a file-like object) from the text content.
    const blob = new Blob([textContent], { type: 'text/plain' });

    // Create a temporary link element.
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;

    // Programmatically click the link to trigger the download.
    document.body.appendChild(link);
    link.click();

    // Clean up by removing the link and revoking the object URL.
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

/**
 * Initialization function for the Voting Page.
 */
export function initVotePage() {
    const bookList = document.getElementById('book-list');
    const rankedChoiceList = document.getElementById('ranked-choice-list');
    const submitBallotButton = document.getElementById('submit-ballot-button');
    const cumulativeVoteForm = document.getElementById('cumulative-vote-form');
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

    // NEW: Initialize cumulative voting logic
    if (cumulativeVoteForm) {
        const pointsPerVoter = parseInt(cumulativeVoteForm.dataset.pointsPerVoter, 10);
        
        // Add event listener to the form for input changes
        cumulativeVoteForm.addEventListener('input', () => handleCumulativeInputChange(pointsPerVoter));
        
        // Add event listener for form submission
        cumulativeVoteForm.addEventListener('submit', (event) => handleCumulativeBallotSubmit(event, pointsPerVoter));

        // Initial check in case the page loads with pre-filled values
        handleCumulativeInputChange(pointsPerVoter);
    }

    // Initialize shared logic
    if (exportButton) {
        exportButton.addEventListener('click', () => {
            window.location.href = '/export';
        });
    }

    // NEW: Add event listeners for the modal buttons
    const modal = document.getElementById('confirmation-modal');
    if (modal) {
        document.getElementById('modal-close-button').addEventListener('click', hideModal);
        document.getElementById('modal-cancel-button').addEventListener('click', hideModal);
        document.getElementById('modal-confirm-button').addEventListener('click', () => {
            if (typeof onConfirmCallback === 'function') {
                onConfirmCallback();
            }
        });
        // Also allow closing by clicking the overlay
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                hideModal();
            }
        });
    }
}