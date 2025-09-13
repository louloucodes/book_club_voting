from flask import Flask
from config import Config
from .books import BookStore

def create_app(config_class=Config):
    """Creates and configures the Flask application."""
    # MODIFIED: Explicitly set the static and template folder paths.
    # The paths are relative to the 'src' directory where this file lives.
    app = Flask(__name__, static_folder='../static', template_folder='../templates')
    app.config.from_object(config_class)

    # Create the data_store instance here
    data_store = BookStore()
    data_store.set_voting_strategy(app.config['VOTING_SYSTEM'])
    
    # Attach the configured data_store to the app context
    app.data_store = data_store

    # Import and register blueprints using relative imports
    from .main import main_bp
    from .admin import admin_bp
    
    app.register_blueprint(main_bp)
    app.register_blueprint(admin_bp)

    return app