from datetime import datetime, timedelta

from django.contrib import admin, messages
from django.utils import timezone
from unfold.admin import ModelAdmin, TabularInline
from unfold.contrib.filters.admin import RangeDateFilter
from unfold.decorators import action, display

from .formatting import format_duration, format_price
from .models import Appointment, Barber, BarbershopConfig, ContactMessage, OpeningHour, PortfolioImage, Service


@admin.register(BarbershopConfig)
class BarbershopConfigAdmin(ModelAdmin):
    list_display = ["__str__", "is_force_closed", "closure_reason"]
    list_editable = ["is_force_closed", "closure_reason"]

    # A Single Global Settings Row - Another One Would Be Ignored By The Website
    def has_add_permission(self, request):
        return not BarbershopConfig.objects.exists()


@admin.register(OpeningHour)
class OpeningHourAdmin(ModelAdmin):
    list_display = ["day_of_week", "open_time", "close_time", "is_closed_all_day"]
    list_editable = ["open_time", "close_time", "is_closed_all_day"]
    ordering = ["day_of_week"]

    # One Row Per Weekday
    def has_add_permission(self, request):
        return OpeningHour.objects.count() < 7


@admin.register(Service)
class ServiceAdmin(ModelAdmin):
    list_display = ["title", "price_display", "duration_display", "description"]
    search_fields = ["title", "description"]
    ordering = ["id"]

    @display(description="Cena", ordering="price")
    def price_display(self, obj):
        return format_price(obj.price)

    @display(description="Čas trvania", ordering="duration")
    def duration_display(self, obj):
        return format_duration(obj.duration)


@admin.register(Appointment)
class AppointmentAdmin(ModelAdmin):
    list_display = ["date", "time_display", "customer_display", "phone_number", "service", "status_display"]
    list_display_links = ["date", "time_display"]
    list_filter = [("date", RangeDateFilter), "service", "is_active"]
    list_filter_submit = True
    list_select_related = ["service"]
    search_fields = ["first_name", "last_name", "phone_number"]
    date_hierarchy = "date"
    ordering = ["-date", "-time_start"]
    actions = ["cancel_appointments", "restore_appointments"]

    @display(description="Čas", ordering="time_start")
    def time_display(self, obj):
        end = (datetime.combine(obj.date, obj.time_start) + timedelta(minutes=obj.service.duration)).time()
        return f"{obj.time_start:%H:%M} – {end:%H:%M}"

    @display(description="Zákazník", ordering="last_name")
    def customer_display(self, obj):
        return f"{obj.first_name} {obj.last_name}"

    @display(description="Stav", label={"Nadchádzajúci": "info", "Prebehnutý": "success", "Zrušený": "danger"})
    def status_display(self, obj):
        if not obj.is_active:
            return "Zrušený"

        now = timezone.localtime()
        starts = timezone.make_aware(datetime.combine(obj.date, obj.time_start))

        return "Prebehnutý" if starts < now else "Nadchádzajúci"

    @action(description="Zrušiť vybrané termíny")
    def cancel_appointments(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"Zrušené termíny: {updated}. Uvoľnené časy sú opäť dostupné na rezerváciu.", messages.SUCCESS)

    @action(description="Obnoviť vybrané termíny")
    def restore_appointments(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f"Obnovené termíny: {updated}.", messages.SUCCESS)


@admin.register(ContactMessage)
class ContactMessageAdmin(ModelAdmin):
    list_display = ["creation_time", "sender_display", "email_address", "message_preview"]
    search_fields = ["first_name", "last_name", "email_address", "message"]
    date_hierarchy = "creation_time"
    ordering = ["-creation_time"]
    readonly_fields = ["first_name", "last_name", "email_address", "message", "creation_time"]

    @display(description="Od", ordering="last_name")
    def sender_display(self, obj):
        return f"{obj.first_name} {obj.last_name}"

    @display(description="Správa")
    def message_preview(self, obj):
        text = obj.message or ""
        return text if len(text) <= 80 else f"{text[:80]}…"

    # Messages Come Only From The Website Form
    def has_add_permission(self, request):
        return False


class PortfolioImageInline(TabularInline):
    model = PortfolioImage
    fields = ["preview", "image", "caption"]
    readonly_fields = ["preview"]
    extra = 1

    @display(description="Náhľad", image=True)
    def preview(self, obj):
        return obj.image.url if obj.pk and obj.image else None


@admin.register(Barber)
class BarberAdmin(ModelAdmin):
    list_display = ["avatar", "name_display", "instagram", "portfolio_count", "is_active"]
    list_display_links = ["avatar", "name_display"]
    list_editable = ["is_active"]
    list_filter = ["is_active"]
    search_fields = ["first_name", "nickname"]
    inlines = [PortfolioImageInline]

    @display(description="Foto", image=True)
    def avatar(self, obj):
        return obj.profile_picture.url if obj.profile_picture else None

    @display(description="Meno", ordering="first_name")
    def name_display(self, obj):
        return f"{obj.first_name} „{obj.nickname}“" if obj.nickname else obj.first_name

    @display(description="Fotky v portfóliu")
    def portfolio_count(self, obj):
        return obj.portfolio_images.count()


@admin.register(PortfolioImage)
class PortfolioImageAdmin(ModelAdmin):
    list_display = ["preview", "barber", "caption"]
    list_filter = ["barber"]
    search_fields = ["caption"]
    list_select_related = ["barber"]

    @display(description="Náhľad", image=True)
    def preview(self, obj):
        return obj.image.url if obj.image else None
