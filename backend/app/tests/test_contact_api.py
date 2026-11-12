import json
from unittest import mock

from django.core import mail
from django.test import TestCase, override_settings

from app.models import ContactMessage

URL = "/api/contact/"
SHOP = "shop@example.com"


@override_settings(EMAIL_HOST_USER=SHOP, EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class ContactApiTests(TestCase):
    def payload(self, **overrides):
        data = {"first_name": "Ján", "last_name": "Novák", "email_address": "jan@example.com", "message": "Dobrý deň,\nmáte voľno?"}
        data.update(overrides)
        return data

    def post(self, data):
        return self.client.post(URL, json.dumps(data), content_type="application/json")

    def test_saves_the_message_and_emails_the_shop_with_reply_to_customer(self):
        response = self.post(self.payload())

        self.assertEqual(response.status_code, 200)
        self.assertEqual(ContactMessage.objects.get().email_address, "jan@example.com")

        email = mail.outbox[0]
        self.assertEqual(email.from_email, SHOP)  # Never "From" the customer - SMTP servers reject spoofed senders
        self.assertEqual(email.to, [SHOP])
        self.assertEqual(email.reply_to, ["jan@example.com"])

    def test_escapes_html_in_the_email(self):
        self.post(self.payload(message="<script>alert(1)</script>"))

        html = mail.outbox[0].alternatives[0][0]
        self.assertNotIn("<script>", html)
        self.assertIn("&lt;script&gt;", html)

    def test_rejects_invalid_input_without_saving(self):
        self.assertEqual(self.post(self.payload(email_address="not-an-email")).status_code, 400)
        self.assertEqual(self.post(self.payload(message="   ")).status_code, 400)
        self.assertEqual(self.post(self.payload(message="x" * 251)).status_code, 400)
        self.assertEqual(self.client.post(URL, "not json", content_type="application/json").status_code, 400)
        self.assertEqual(self.client.post(URL, "[1, 2]", content_type="application/json").status_code, 400)
        self.assertEqual(ContactMessage.objects.count(), 0)

    def test_only_post_is_allowed(self):
        self.assertEqual(self.client.get(URL).status_code, 405)

    def test_keeps_the_message_when_the_email_cannot_be_sent(self):
        with mock.patch("app.views.EmailMultiAlternatives.send", side_effect=OSError("SMTP down")):
            with self.assertLogs("app.views", level="ERROR"):
                response = self.post(self.payload())

        self.assertEqual(response.status_code, 200)
        self.assertEqual(ContactMessage.objects.count(), 1)
