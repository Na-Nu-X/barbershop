from datetime import time, timedelta

from django.test import TestCase

from app.models import BarbershopConfig, OpeningHour
from app.scheduling import BOOKING_HORIZON_DAYS, BookingError, get_day_schedule

from .helpers import MONDAY, SUNDAY, book, create_service, create_week, local_datetime


def starts(schedule, available_only=False):
    return [slot.start.strftime("%H:%M") for slot in schedule.slots if slot.is_available or not available_only]


class DayScheduleTests(TestCase):
    def setUp(self):
        create_week(open_hour=9, close_hour=17)
        self.haircut = create_service("Strih", duration=30)
        self.long_service = create_service("Strih + brada", duration=75)
        self.yesterday = local_datetime(MONDAY - timedelta(days=1), 12)  # "now" = Sunday noon before MONDAY

    def test_slots_follow_opening_hours_on_a_15_minute_grid(self):
        schedule = get_day_schedule(MONDAY, self.haircut, now=self.yesterday)

        self.assertFalse(schedule.is_closed)
        self.assertEqual(starts(schedule)[:3], ["09:00", "09:15", "09:30"])
        self.assertEqual(starts(schedule)[-1], "16:30")  # 30 min service must end by 17:00

    def test_longer_services_must_finish_before_closing(self):
        schedule = get_day_schedule(MONDAY, self.long_service, now=self.yesterday)

        self.assertEqual(starts(schedule)[-1], "15:45")  # 15:45 + 75 min = 17:00

    def test_custom_opening_hours_are_respected(self):
        OpeningHour.objects.filter(day_of_week=MONDAY.isoweekday()).update(open_time=time(10, 0), close_time=time(14, 0))

        schedule = get_day_schedule(MONDAY, self.haircut, now=self.yesterday)

        self.assertEqual(starts(schedule)[0], "10:00")
        self.assertEqual(starts(schedule)[-1], "13:30")

    def test_closed_day_has_no_slots(self):
        schedule = get_day_schedule(SUNDAY, self.haircut, now=self.yesterday)

        self.assertTrue(schedule.is_closed)
        self.assertEqual(schedule.slots, [])

    def test_day_without_opening_hours_is_closed(self):
        OpeningHour.objects.filter(day_of_week=MONDAY.isoweekday()).delete()

        self.assertTrue(get_day_schedule(MONDAY, self.haircut, now=self.yesterday).is_closed)

    def test_overlapping_starts_are_unavailable_using_the_booked_service_duration(self):
        book(self.long_service, MONDAY, time(10, 0))  # Occupies 10:00 - 11:15

        schedule = get_day_schedule(MONDAY, self.haircut, now=self.yesterday)
        unavailable = [slot.start.strftime("%H:%M") for slot in schedule.slots if not slot.is_available]

        # A 30 min haircut collides from 09:45 (ends 10:15) up to 11:00 (ends 11:30)
        self.assertEqual(unavailable, ["09:45", "10:00", "10:15", "10:30", "10:45", "11:00"])

    def test_back_to_back_bookings_are_allowed(self):
        book(self.haircut, MONDAY, time(10, 0))  # 10:00 - 10:30

        available = starts(get_day_schedule(MONDAY, self.haircut, now=self.yesterday), available_only=True)

        self.assertIn("09:30", available)  # Ends exactly when the booking starts
        self.assertIn("10:30", available)  # Starts exactly when the booking ends

    def test_cancelled_appointments_free_the_slot(self):
        book(self.haircut, MONDAY, time(10, 0), is_active=False)

        available = starts(get_day_schedule(MONDAY, self.haircut, now=self.yesterday), available_only=True)

        self.assertIn("10:00", available)

    def test_past_times_today_are_left_out(self):
        schedule = get_day_schedule(MONDAY, self.haircut, now=local_datetime(MONDAY, 13, 10))

        self.assertEqual(starts(schedule)[0], "13:15")

    def test_force_closed_today_has_no_slots_but_future_days_still_work(self):
        BarbershopConfig.objects.create(is_force_closed=True, closure_reason="Sviatok")
        today_noon = local_datetime(MONDAY, 8)

        self.assertTrue(get_day_schedule(MONDAY, self.haircut, now=today_noon).is_closed)
        self.assertFalse(get_day_schedule(MONDAY + timedelta(days=1), self.haircut, now=today_noon).is_closed)

    def test_dates_in_the_past_are_rejected(self):
        with self.assertRaises(BookingError):
            get_day_schedule(MONDAY - timedelta(days=1), self.haircut, now=local_datetime(MONDAY, 8))

    def test_dates_beyond_the_booking_horizon_are_rejected(self):
        now = local_datetime(MONDAY, 8)

        get_day_schedule(MONDAY + timedelta(days=BOOKING_HORIZON_DAYS), self.haircut, now=now)  # Last allowed day

        with self.assertRaises(BookingError):
            get_day_schedule(MONDAY + timedelta(days=BOOKING_HORIZON_DAYS + 1), self.haircut, now=now)
