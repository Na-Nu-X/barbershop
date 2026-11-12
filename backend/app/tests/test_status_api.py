from datetime import time
from unittest import mock

from django.test import TestCase

from app.models import BarbershopConfig, OpeningHour

from .helpers import MONDAY, SATURDAY, SUNDAY, TUESDAY, create_week, local_datetime

URL = "/api/get-status/"


class StatusApiTests(TestCase):
    def setUp(self):
        create_week(open_hour=9, close_hour=17, closed_days=(7,))  # Sunday closed

    def status_at(self, moment):
        with mock.patch("django.utils.timezone.now", return_value=moment):
            return self.client.get(URL).json()

    def test_open_during_opening_hours(self):
        body = self.status_at(local_datetime(MONDAY, 12))

        self.assertTrue(body["is_open"])
        self.assertEqual(body["open_till"], "17:00")

    def test_closing_time_itself_counts_as_closed(self):
        self.assertFalse(self.status_at(local_datetime(MONDAY, 17))["is_open"])

    def test_before_opening_points_to_today(self):
        body = self.status_at(local_datetime(MONDAY, 7, 30))

        self.assertFalse(body["is_open"])
        self.assertEqual((body["next_open"], body["next_open_day"]), ("09:00", "dnes"))

    def test_after_closing_points_to_tomorrow_not_today(self):
        body = self.status_at(local_datetime(MONDAY, 18))

        self.assertEqual((body["next_open"], body["next_open_day"]), ("09:00", "zajtra"))
        self.assertEqual(body["reason"], "Mimo otváracích hodín.")

    def test_skips_closed_days_and_uses_that_days_opening_time(self):
        OpeningHour.objects.filter(day_of_week=1).update(open_time=time(10, 0))  # Monday opens at 10:00

        body = self.status_at(local_datetime(SATURDAY, 18))  # Sunday closed → Monday

        self.assertEqual((body["next_open"], body["next_open_day"]), ("10:00", "v pondelok"))

    def test_regular_closed_day_still_reports_the_next_opening(self):
        body = self.status_at(local_datetime(SUNDAY, 12))

        self.assertEqual(body["reason"], "Pravidelný zatvárací deň.")
        self.assertEqual(body["next_open_day"], "zajtra")

    def test_weekday_phrase_after_several_closed_days(self):
        OpeningHour.objects.filter(day_of_week__in=[3, 4, 5, 6, 7]).update(is_closed_all_day=True)

        body = self.status_at(local_datetime(TUESDAY, 18))  # Next open day is Monday

        self.assertEqual(body["next_open_day"], "v pondelok")

    def test_no_opening_hours_at_all(self):
        OpeningHour.objects.all().delete()

        body = self.status_at(local_datetime(MONDAY, 12))

        self.assertFalse(body["is_open"])
        self.assertIsNone(body["next_open"])

    def test_force_closed_overrides_everything(self):
        BarbershopConfig.objects.create(is_force_closed=True, closure_reason="Sviatok")

        body = self.status_at(local_datetime(MONDAY, 12))

        self.assertEqual((body["is_open"], body["status"], body["reason"]), (False, "Mimoriadne zatvorené", "Sviatok"))


class OpeningHoursApiTests(TestCase):
    def test_returns_all_seven_days_with_closed_and_missing_days_marked(self):
        create_week(open_hour=9, close_hour=17, closed_days=(7,))
        OpeningHour.objects.filter(day_of_week=6).delete()  # Saturday not configured

        body = self.client.get("/api/get-opening-hours/").json()
        days = {day["day_of_week"]: day for day in body["opening_hours"]}

        self.assertEqual(len(days), 7)
        self.assertEqual(days[1], {"day_of_week": 1, "is_closed": False, "open_time": "09:00", "close_time": "17:00"})
        self.assertTrue(days[6]["is_closed"])
        self.assertTrue(days[7]["is_closed"])
        self.assertIsNone(days[7]["open_time"])
        self.assertEqual(body["booking_horizon_days"], 90)
