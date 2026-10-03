import sys
import os

# Add the current directory to python path so 'app' can be found
sys.path.insert(0, os.path.dirname(__file__))

from app.main import app
