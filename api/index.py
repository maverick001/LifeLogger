"""
Vercel serverless function entry point.
This file imports the Flask app and exposes it for Vercel.
"""
import sys
import os

# Add parent directory to path so we can import app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app

# Vercel expects the app to be named 'app' or 'handler'
# Flask's WSGI app works directly with Vercel Python runtime
