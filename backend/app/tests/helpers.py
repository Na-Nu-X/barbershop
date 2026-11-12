"""Shared fixtures for the booking tests."""

from datetime import date, datetime, time

from django.utils import timezone

from app.models import Appointment, OpeningHour, Service

# A fixed Monday so weekdays are predictable: 2030-01-07 is a Monday
MONDAY = date(2030, 1, 7)
TUESDAY = date(2030, 1, 8)
SATURDAY = date(2030, 1, 12)
SUNDAY = date(2030, 1, 13)


def local_datetime(day: date, hour: int, minute: int = 0) -> datetime:
    """An aware datetime in the project time zone (what timezone.localtime() returns)."""
    return timezone.make_aware(datetime.combine(day, time(hour, minute)))


def create_week(open_hour: int = 9, close_hour: int = 17, closed_days: tuple[int, ...] = (7,)) -> None:
    """Opening hours for every weekday (1 = Monday); `closed_days` are closed all day."""
    for day_of_week in range(1, 8):
        OpeningHour.objects.create(
            day_of_week=day_of_week,
            open_time=time(open_hour, 0),
            close_time=time(close_hour, 0),
            is_closed_all_day=day_of_week in closed_days,
        )


def create_service(title: str = "Strih", duration: int = 30, price: int = 1500) -> Service:
    return Service.objects.create(title=title, duration=duration, price=price)


def book(service: Service, day: date, start: time, is_active: bool = True) -> Appointment:
    return Appointment.objects.create(
        service=service,
        first_name="Ján",
        last_name="Novák",
        phone_number="+421900000000",
        date=day,
        time_start=start,
        is_active=is_active,
    )
