import os
import django
import pytest

# Set up the Django environment before running tests
@pytest.fixture(scope='session', autouse=True)
def django_setup():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AutoTestWeb.settings')
    django.setup()