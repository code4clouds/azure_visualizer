import unittest

import app as azure_app


class TestProtocolConfig(unittest.TestCase):
    """Test protocol handling."""

    def test_http_protocol_is_case_insensitive(self):
        """Lowercase and mixed-case HTTP disable SSL."""
        self.assertIsNone(azure_app.get_ssl_context('http'))
        self.assertIsNone(azure_app.get_ssl_context('HtTp'))

    def test_https_protocol_defaults_to_adhoc(self):
        """HTTPS and empty values keep the default adhoc SSL context."""
        self.assertEqual(azure_app.get_ssl_context('https'), 'adhoc')
        self.assertEqual(azure_app.get_ssl_context('HTTPS'), 'adhoc')
        self.assertEqual(azure_app.get_ssl_context(''), 'adhoc')
        self.assertEqual(azure_app.get_ssl_context(None), 'adhoc')


if __name__ == '__main__':
    unittest.main()
