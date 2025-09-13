import os
from dotenv import load_dotenv

# Load environment variables from .env file
basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '../.env'))

class Config:
    """Set Flask configuration variables from environment variables."""

    # General Config
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'a-default-secret-key-that-is-not-secure'
    
    # NEW: Voting System Configuration
    # Can be 'plurality' or 'ranked_choice'
    VOTING_SYSTEM = os.environ.get('VOTING_SYSTEM', 'plurality')

    # Admin Config
    ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD') or 'default-password'

    # NEW: Add a toggle for showing the suggester's name
    # This will read from your .env file. It defaults to True if not set.
    SHOW_SUGGESTER = os.environ.get('SHOW_SUGGESTER', 'True').lower() in ('true', '1', 't')