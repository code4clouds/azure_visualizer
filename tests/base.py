from flask_testing import TestCase
from app import app

class BaseTestCase(TestCase):
    """ Base Tests """

    def create_app(self):
        app.config.from_object('config.TestingConfig')
        return app
