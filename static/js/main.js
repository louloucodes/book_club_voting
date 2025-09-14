import { initVotePage } from './vote.js';

document.addEventListener('DOMContentLoaded', () => {
    // Call your initialization functions here
    if (document.getElementById('book-list') || document.getElementById('ranked-choice-list') || document.getElementById('cumulative-vote-form')) {
        initVotePage();
    }
    // ... any other page initializations
});