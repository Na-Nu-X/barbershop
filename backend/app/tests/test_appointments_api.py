from datetime import time
from unittest import mock

from django.test import TestCase

from app.models import Appointment

from .helpers import MONDAY, SUNDAY, book, create_service, create_week, local_datetime

URL = "/api/create-appointment/"


@mock.patch("django.utils.timezone.now", return_value=local_datetime(MONDAY, 8))
class CreateAppointmentApiTests(TestCase):
    def setUp(self):
        create_week()
        self.haircut = create_service("Strih", duration=30)
        self.long_service = create_service("Strih + brada", duration=75)

    def payload(self, **overrides):
        data = {
            "customer": {"first_name": "Ján", "last_name": "Novák", "phone_number": "+421 900 123 456"},
            "service_id": self.haircut.id,
            "date": MONDAY.isoformat(),
            "time_start": "10:00",
        }
        data.update(overrides)
        return data

    def post(self, data):
        return self.client.post(URL, data, content_type="application/json")

    def test_creates_a_valid_appointment(self, _now):
        response = self.post(self.payload())

        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.json()["success"])

        appointment = Appointment.objects.get()
        self.assertEqual((appointment.date, appointment.time_start), (MONDAY, time(10, 0)))
        self.assertEqual(appointment.phone_number, "+421 900 123 456")

    def test_rejects_a_slot_that_overlaps_a_longer_booking_with_409(self, _now):
        book(self.long_service, MONDAY, time(9, 30))  # Occupies 09:30 - 10:45

        response = self.post(self.payload(time_start="10:15"))

        self.assertEqual(response.status_code, 409)
        self.assertEqual(Appointment.objects.count(), 1)

    def test_a_cancelled_booking_does_not_block_the_slot(self, _now):
        book(self.haircut, MONDAY, time(10, 0), is_active=False)

        self.assertEqual(self.post(self.payload()).status_code, 201)

    def test_rejects_times_outside_opening_hours(self, _now):
        self.assertEqual(self.post(self.payload(time_start="08:00")).status_code, 400)
        self.assertEqual(self.post(self.payload(time_start="16:45")).status_code, 400)  # Would end after 17:00
        self.assertEqual(self.post(self.payload(time_start="10:07")).status_code, 400)  # Off the 15 min grid

    def test_rejects_closed_days_and_past_dates(self, _now):
        self.assertEqual(self.post(self.payload(date=SUNDAY.isoformat())).status_code, 400)
        self.assertEqual(self.post(self.payload(date="2030-01-06")).status_code, 400)

    def test_rejects_missing_and_malformed_fields(self, _now):
        self.assertEqual(self.post({}).status_code, 400)
        self.assertEqual(self.post(self.payload(customer=None)).status_code, 400)
        self.assertEqual(self.post(self.payload(customer={"first_name": "Ján"})).status_code, 400)
        self.assertEqual(self.post(self.payload(service_id="abc")).status_code, 400)
        self.assertEqual(self.post(self.payload(service_id=9999)).status_code, 400)
        self.assertEqual(self.post(self.payload(time_start="10.00")).status_code, 400)
        self.assertEqual(Appointment.objects.count(), 0)

    def test_validates_name_lengths_and_phone_number(self, _now):
        too_long = {"first_name": "J" * 21, "last_name": "Novák", "phone_number": "+421900123456"}
        bad_phone = {"first_name": "Ján", "last_name": "Novák", "phone_number": "call me"}

        self.assertEqual(self.post(self.payload(customer=too_long)).status_code, 400)
        self.assertEqual(self.post(self.payload(customer=bad_phone)).status_code, 400)
        self.assertEqual(Appointment.objects.count(), 0)
