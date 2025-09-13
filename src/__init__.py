import os
import json
from flask import Flask
from .books import BookStore

def create_app():
    """Create and configure an instance of the Flask application."""
    # MODIFIED: Explicitly tell Flask where the static and template folders are located.
    # The paths are relative to the 'src' directory where this file lives.
    app = Flask(
        __name__, 
        instance_relative_config=True,
        template_folder='../templates',
        static_folder='../static'
    )
    
    # Load default configuration from config.py
    app.config.from_object('config.Config')

    # Load dynamic settings from settings.json and override defaults
    try:
        with open('data/settings.json', 'r') as f:
            settings = json.load(f)
            app.config.update(settings)
            print(f"Loaded VOTING_SYSTEM: {app.config.get('VOTING_SYSTEM')}")
    except (FileNotFoundError, json.JSONDecodeError):
        print("Warning: settings.json not found or invalid. Using default config.")

    # Ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # Initialize the correct BookStore class
    app.data_store = BookStore()

    # Register blueprints
    from . import main, admin
    app.register_blueprint(main.main_bp)
    app.register_blueprint(admin.admin_bp)

    return app