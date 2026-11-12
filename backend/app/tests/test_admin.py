from datetime import time

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

from app.formatting import format_duration, format_price
from app.models import Appointment, Barber, BarbershopConfig, ContactMessage, OpeningHour, PortfolioImage, Service

from .helpers import MONDAY, book, create_service, create_week

MODELS = [BarbershopConfig, OpeningHour, Service, Appointment, ContactMessage, Barber, PortfolioImage]


class AdminPagesTests(TestCase):
    def setUp(self):
        user = get_user_model().objects.create_superuser("admin", "admin@example.com", "password")
        self.client.force_login(user)

        create_week()
        self.service = create_service("Strih", duration=75, price=1250)
        self.appointment = book(self.service, MONDAY, time(10, 0))
        BarbershopConfig.objects.create()
        ContactMessage.objects.create(first_name="Ján", last_name="Novák", email_address="jan@example.com", message="x" * 120)
        barber = Barber.objects.create(first_name="Marek", nickname="Maro", instagram=None)
        PortfolioImage.objects.create(barber=barber, caption="Fade")

    def url(self, model, view, *args):
        return reverse(f"admin:app_{model._meta.model_name}_{view}", args=args)

    def test_every_list_and_detail_page_renders(self):
        for model in MODELS:
            with self.subTest(model=model.__name__):
                self.assertEqual(self.client.get(self.url(model, "changelist")).status_code, 200)

                obj = model.objects.first()
                self.assertEqual(self.client.get(self.url(model, "change", obj.pk)).status_code, 200)

    def test_list_shows_formatted_values(self):
        services = self.client.get(self.url(Service, "changelist")).content.decode()
        appointments = self.client.get(self.url(Appointment, "changelist")).content.decode()

        self.assertIn("12,50 €", services)
        self.assertIn("1 h 15 min", services)
        self.assertIn("10:00 – 11:15", appointments)

    def test_appointment_date_range_filter(self):
        response = self.client.get(self.url(Appointment, "changelist"), {"date_from": "2030-01-08", "date_to": "2030-01-31"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context["cl"].result_count, 0)

    def test_cancel_and_restore_actions(self):
        changelist = self.url(Appointment, "changelist")

        self.client.post(changelist, {"action": "cancel_appointments", "_selected_action": [self.appointment.pk]})
        self.appointment.refresh_from_db()
        self.assertFalse(self.appointment.is_active)

        self.client.post(changelist, {"action": "restore_appointments", "_selected_action": [self.appointment.pk]})
        self.appointment.refresh_from_db()
        self.assertTrue(self.appointment.is_active)

    def test_singletons_cannot_be_duplicated(self):
        self.assertEqual(self.client.get(self.url(BarbershopConfig, "add")).status_code, 403)
        self.assertEqual(self.client.get(self.url(OpeningHour, "add")).status_code, 403)  # All 7 days exist
        self.assertEqual(self.client.get(self.url(ContactMessage, "add")).status_code, 403)  # Only from the website

    def test_barber_page_edits_portfolio_inline(self):
        barber = Barber.objects.get()
        content = self.client.get(self.url(Barber, "change", barber.pk)).content.decode()

        self.assertIn("portfolio_images-TOTAL_FORMS", content)


class FormattingTests(TestCase):
    def test_price(self):
        self.assertEqual(format_price(1500), "15 €")
        self.assertEqual(format_price(1250), "12,50 €")

    def test_duration(self):
        self.assertEqual(format_duration(30), "30 min")
        self.assertEqual(format_duration(60), "1 h")
        self.assertEqual(format_duration(75), "1 h 15 min")
