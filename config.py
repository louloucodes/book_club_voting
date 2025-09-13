import os
from dotenv import load_dotenv

# Load environment variables from .env file
basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

class Config:
    """Set Flask configuration variables from environment variables."""

    # General Config
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'a-default-secret-key-that-is-not-secure'
    
    # Admin Config
    ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD') or 'default-password'