"""
Configuration module for LifeLogger application.
Loads settings from environment variables.
"""
import os
import base64
import tempfile
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Config:
    """Application configuration class."""
    
    # Flask settings
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.getenv('DEBUG', 'False').lower() in ('true', '1', 'yes')
    
    # Database settings
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = int(os.getenv('DB_PORT', 3306))
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')
    DB_NAME = os.getenv('DB_NAME', 'lifelogger_db')
    DB_POOL_SIZE = int(os.getenv('DB_POOL_SIZE', 5))
    DB_POOL_RECYCLE = int(os.getenv('DB_POOL_RECYCLE', 3600))
    
    # SSL Certificate for Aiven (can be base64-encoded content or file path)
    DB_SSL_CA = os.getenv('DB_SSL_CA', '')
    
    # Site password for cloud access protection (leave empty to disable)
    SITE_PASSWORD = os.getenv('SITE_PASSWORD', '')
    
    # Cache for temp certificate file path
    _ssl_ca_file = None
    
    @classmethod
    def get_ssl_ca_path(cls):
        """
        Get the path to the SSL CA certificate.
        If DB_SSL_CA is base64-encoded content, write it to a temp file.
        If it's a file path, return it directly.
        Returns None if no SSL CA is configured.
        """
        if not cls.DB_SSL_CA:
            return None
        
        # Check if it's a file path (exists on disk)
        if os.path.isfile(cls.DB_SSL_CA):
            return cls.DB_SSL_CA
        
        # Assume it's base64-encoded content, decode and write to temp file
        if cls._ssl_ca_file is None:
            try:
                cert_content = base64.b64decode(cls.DB_SSL_CA)
                # Create a persistent temp file (won't be deleted automatically)
                fd, cls._ssl_ca_file = tempfile.mkstemp(suffix='.pem', prefix='aiven_ca_')
                with os.fdopen(fd, 'wb') as f:
                    f.write(cert_content)
                print(f"[OK] SSL CA certificate written to temp file")
            except Exception as e:
                print(f"[WARN] Failed to decode SSL CA certificate: {e}")
                return None
        
        return cls._ssl_ca_file
    
    @classmethod
    def get_db_config(cls):
        """Return database configuration dictionary."""
        config = {
            'host': cls.DB_HOST,
            'port': cls.DB_PORT,
            'user': cls.DB_USER,
            'password': cls.DB_PASSWORD,
            'database': cls.DB_NAME,
            'pool_size': cls.DB_POOL_SIZE,
            'pool_recycle': cls.DB_POOL_RECYCLE,
        }
        
        # Add SSL configuration if CA certificate is available
        ssl_ca_path = cls.get_ssl_ca_path()
        if ssl_ca_path:
            config['ssl_ca'] = ssl_ca_path
            config['ssl_verify_cert'] = True
        
        return config
