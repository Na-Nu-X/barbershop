from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Service, Appointment, ContactMessage

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
        "time_start"
    ]

    list_filter = [ 
        "service",
        "date",
        "time_start"
    ]

    search_fields = [
        "first_name",
        "last_name",
        "phone_number"
    ]

    list_editable = []

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