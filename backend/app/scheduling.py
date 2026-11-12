"""
Booking rules: which start times can be booked for a service on a given day.

All times are naive local times (Europe/Bratislava), the same as Appointment.time_start.
Every function takes an optional `now` so the rules can be tested with a fixed clock.
"""

from dataclasses import dataclass
from datetime import date, datetime, time, timedelta

from django.utils import timezone

from .models import Appointment, BarbershopConfig, OpeningHour, Service

SLOT_INTERVAL_MINUTES = 15  # Grid of offered start times (09:00, 09:15, ...)
BOOKING_HORIZON_DAYS = 90  # How far ahead customers can book


class BookingError(Exception):
    """A booking request that breaks a rule. `message` is shown to the customer (Slovak)."""

    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.message = message
        self.status = status


@dataclass(frozen=True)
class Slot:
    start: time
    is_available: bool


@dataclass(frozen=True)
class DaySchedule:
    is_closed: bool  # True when the shop does not open at all that day
    slots: list[Slot]  # Bookable start times that are still in the future


def local_now() -> datetime:
    return timezone.localtime()


def get_opening_hour(day: date) -> OpeningHour | None:
    return OpeningHour.objects.filter(day_of_week=day.isoweekday()).first()


def is_open_on(opening: OpeningHour | None) -> bool:
    return opening is not None and not opening.is_closed_all_day and opening.open_time < opening.close_time


def validate_booking_date(day: date, now: datetime) -> None:
    today = now.date()

    if day < today:
        raise BookingError("Nie je možné rezervovať termín v minulosti.")

    if day > today + timedelta(days=BOOKING_HORIZON_DAYS):
        raise BookingError(f"Rezervovať je možné najviac {BOOKING_HORIZON_DAYS} dní dopredu.")


def _to_minutes(value: time) -> int:
    return value.hour * 60 + value.minute


def _from_minutes(minutes: int) -> time:
    return time(minutes // 60, minutes % 60)


def _busy_intervals(day: date) -> list[tuple[int, int]]:
    """Occupied [start, end) minute ranges, each using the booked service's own duration."""
    appointments = Appointment.objects.filter(date=day, is_active=True).select_related("service")
    return [(_to_minutes(a.time_start), _to_minutes(a.time_start) + a.service.duration) for a in appointments]


def get_day_schedule(day: date, service: Service, now: datetime | None = None) -> DaySchedule:
    """
    Start times for `service` on `day`:
      - inside that weekday's opening hours, and the service must finish by closing time
      - on a SLOT_INTERVAL_MINUTES grid starting at opening time
      - marked unavailable when they overlap an active appointment
      - times that already passed today are left out
    Raises BookingError for dates in the past or beyond the booking horizon.
    """
    now = now or local_now()
    validate_booking_date(day, now)

    is_today = day == now.date()

    if is_today:
        config = BarbershopConfig.objects.first()

        if config and config.is_force_closed:
            return DaySchedule(is_closed=True, slots=[])

    opening = get_opening_hour(day)

    if not is_open_on(opening):
        return DaySchedule(is_closed=True, slots=[])

    open_minutes = _to_minutes(opening.open_time)
    close_minutes = _to_minutes(opening.close_time)
    now_minutes = _to_minutes(now.time()) if is_today else -1
    busy = _busy_intervals(day)

    slots = []
    start = open_minutes

    while start + service.duration <= close_minutes:
        if start > now_minutes:
            end = start + service.duration
            is_free = all(end <= busy_start or start >= busy_end for busy_start, busy_end in busy)
            slots.append(Slot(start=_from_minutes(start), is_available=is_free))

        start += SLOT_INTERVAL_MINUTES

    return DaySchedule(is_closed=False, slots=slots)
