from datetime import time
from unittest import mock

from django.test import TestCase

from .helpers import MONDAY, SUNDAY, book, create_service, create_week, local_datetime

URL = "/api/get-available-slots/"


@mock.patch("django.utils.timezone.now", return_value=local_datetime(MONDAY, 8))
class AvailableSlotsApiTests(TestCase):
    def setUp(self):
        create_week()
        self.service = create_service(duration=30)

    def get(self, **params):
        return self.client.get(URL, params)

    def test_returns_slots_for_the_service(self, _now):
        book(self.service, MONDAY, time(9, 0))

        response = self.get(date=MONDAY.isoformat(), service_id=self.service.id)
        body = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertFalse(body["is_closed"])
        self.assertEqual(body["slots_data"][0], {"slot": "09:00", "is_available": False})
        self.assertEqual(body["slots_data"][2], {"slot": "09:30", "is_available": True})

    def test_closed_day(self, _now):
        body = self.get(date=SUNDAY.isoformat(), service_id=self.service.id).json()

        self.assertTrue(body["is_closed"])
        self.assertEqual(body["slots_data"], [])
        self.assertEqual(body["message"], "V tento deň máme zatvorené.")

    def test_missing_or_invalid_parameters(self, _now):
        self.assertEqual(self.get(service_id=self.service.id).status_code, 400)
        self.assertEqual(self.get(date=MONDAY.isoformat()).status_code, 400)
        self.assertEqual(self.get(date="07.01.2030", service_id=self.service.id).status_code, 400)
        self.assertEqual(self.get(date=MONDAY.isoformat(), service_id="abc").status_code, 400)
        self.assertEqual(self.get(date=MONDAY.isoformat(), service_id=9999).status_code, 400)

    def test_past_date_is_rejected(self, _now):
        response = self.get(date="2030-01-06", service_id=self.service.id)

        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.json()["success"])
