"""
Settings for running the test suite without PostgreSQL or a .env file.

Usage: python manage.py test app --settings=core.settings_test
"""

import os

# Safe defaults so the suite runs on any machine (real values from .env still win when present)
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production")
os.environ.setdefault("ADMIN_URL", "admin/")
os.environ.setdefault("DEBUG", "False")

from .settings import *  # noqa: E402,F401,F403

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"  # Never send real e-mails from tests

PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]  # Faster user creation in tests
