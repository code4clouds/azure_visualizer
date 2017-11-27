import unittest

from flask import current_app
from flask_testing import TestCase

from app import app


class TestDevelopmentConfig(TestCase):
    """ Test Development Configurations """

    def create_app(self):
        app.config.from_object('config.DevelopmentConfig')
        return app

    def test_app_is_development(self):
        """ Test the app in development configuration """
        self.assertTrue(app.config['DEBUG'] is True)
        self.assertEqual(app.config['PORT'], 5000)
        self.assertFalse(current_app is None)


class TestTestingConfig(TestCase):
    """ Test Testing Configurations """

    def create_app(self):
        app.config.from_object('config.TestingConfig')
        self.assertEqual(app.config['PORT'], 5000)
        return app

    def test_app_is_testing(self):
        """ Test the app in testing configuration """
        self.assertTrue(app.config['DEBUG'])


class TestProductionConfig(TestCase):
    """ Test Production Configurations """

    def create_app(self):
        app.config.from_object('config.ProductionConfig')
        return app

    def test_app_is_production(self):
        """ Test production configuration parameters """
        self.assertTrue(app.config['DEBUG'] is False)


if __name__ == '__main__':
    unittest.main()
