from abc import ABC, abstractmethod
from collections import Counter

class VotingStrategy(ABC):
    """Abstract base class for a voting system."""
    
    @abstractmethod
    def record_vote(self, vote_data):
        """Records a new vote."""
        pass

    @abstractmethod
    def calculate_results(self, books):
        """Calculates and returns the results."""
        pass

    @abstractmethod
    def get_public_results(self):
        """Returns a simplified dictionary for the frontend."""
        pass

class PluralityStrategy(VotingStrategy):
    """Simple plurality voting: one vote per person."""
    def __init__(self):
        self.votes = Counter()

    def record_vote(self, vote_data):
        book_id = vote_data.get('book_id')
        if book_id:
            self.votes[book_id] += 1
            return True
        return False

    def calculate_results(self, books):
        # For plurality, the raw votes are the results.
        return self.votes

    def get_public_results(self):
        return dict(self.votes)

class RankedChoiceStrategy(VotingStrategy):
    """Ranked-choice (Instant-runoff) voting."""
    def __init__(self):
        self.ballots = []

    def record_vote(self, vote_data):
        # Expects vote_data to be an ordered list of book_ids
        ballot = vote_data.get('ballot')
        if isinstance(ballot, list) and ballot:
            self.ballots.append(ballot)
            return True
        return False

    def get_public_results(self):
        # For ranked choice, we can show the first-preference votes
        first_preferences = Counter(ballot[0] for ballot in self.ballots if ballot)
        return dict(first_preferences)

    def calculate_results(self, books):
        # This is a simplified implementation of IRV.
        # A full implementation would handle multiple rounds.
        if not self.ballots:
            return {}
        
        num_rounds = 1
        temp_ballots = [list(b) for b in self.ballots] # Make a copy

        while num_rounds <= len(books):
            counts = Counter(b[0] for b in temp_ballots if b)
            total_votes = sum(counts.values())

            # Check for a winner
            for book_id, votes in counts.items():
                if votes > total_votes / 2:
                    return {"winner": book_id, "rounds": num_rounds, "final_counts": dict(counts)}

            # Find the loser (book with the fewest first-place votes)
            if not counts:
                return {"winner": "Tie", "rounds": num_rounds, "final_counts": {}}
            
            loser = min(counts, key=counts.get)

            # Eliminate the loser and redistribute votes
            for ballot in temp_ballots:
                if loser in ballot:
                    ballot.remove(loser)
            
            num_rounds += 1
        
        # If no winner after all rounds, it's complex. Return first-preference for now.
        return self.get_public_results()

# Factory to get the correct strategy
def get_voting_strategy(strategy_name: str) -> VotingStrategy:
    if strategy_name == 'ranked_choice':
        return RankedChoiceStrategy()
    # Default to plurality
    return PluralityStrategy()