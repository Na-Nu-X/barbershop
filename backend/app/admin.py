from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import BarbershopConfig, OpeningHour, Service, Appointment, ContactMessage

@admin.register(BarbershopConfig)
class BarbershopConfigAdmin(ModelAdmin):
    list_display = [
        "id",
        "is_force_closed",
        "closure_reason"
    ]

    list_filter = []

    search_fields = []

    list_editable = [
        "is_force_closed",
        "closure_reason"
    ]

@admin.register(OpeningHour)
class OpeningHourAdmin(ModelAdmin):
    list_display = [
        "id",
        "day_of_week",
        "open_time",
        "close_time",
        "is_closed_all_day"
    ]

    list_filter = [
        "day_of_week",
        "open_time",
        "close_time",
        "is_closed_all_day"
    ]

    search_fields = []

    list_editable = [
        "day_of_week",
        "open_time",
        "close_time",
        "is_closed_all_day"
    ]

@admin.register(Service)
class ServiceAdmin(ModelAdmin):
    list_display = [
        "id",
        "title",
        "duration", 
        "price"
    ]

    list_filter = [ 
        "title",
        "duration",
        "price"
    ]

    search_fields = [
        "title"
    ]

    list_editable = []

@admin.register(Appointment)
class AppointmentAdmin(ModelAdmin):
    list_display = [
        "id",
        "service",
        "first_name", 
        "last_name",
        "phone_number",
        "date",
        "time_start",
        "is_active"
    ]

    list_filter = [ 
        "service",
        "date",
        "time_start",
        "is_active"
    ]

    search_fields = [
        "first_name",
        "last_name",
        "phone_number"
    ]

    list_editable = [
        "is_active"
    ]

@admin.register(ContactMessage)
class ContactMessageAdmin(ModelAdmin):
    list_display = [
        "id",
        "first_name", 
        "last_name", 
        "email_address",
        "message",
        "creation_time"
    ]

    list_filter = [
        "email_address", 
        "creation_time"
    ]

    search_fields = [
        "first_name",
        "last_name",
        "email_address"
    ]

    list_editable = []