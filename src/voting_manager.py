# src/voting_manager.py
from flask import current_app
from .voting import get_voting_strategy

class VotingManager:
    def __init__(self, strategy_name='plurality', points_per_voter=5):
        self.voting_strategy = get_voting_strategy(strategy_name, points_per_voter)
        print(f"VotingManager initialized with strategy: {strategy_name}")

    def set_voting_strategy(self):
        """Initializes or updates the voting strategy from the app config."""
        strategy_name = current_app.config.get('VOTING_SYSTEM', 'plurality')
        points = current_app.config.get('POINTS_PER_VOTER', 5)
        self.voting_strategy = get_voting_strategy(strategy_name, points)
        print(f"VotingManager strategy updated to: {strategy_name}")

    def record_vote(self, vote_data):
        return self.voting_strategy.record_vote(vote_data)

    def get_public_results(self):
        return self.voting_strategy.get_public_results()

    def calculate_results(self, books):
        return self.voting_strategy.calculate_results(books)