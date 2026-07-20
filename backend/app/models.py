from django.db import models

class BarbershopConfig(models.Model):
    is_force_closed = models.BooleanField(
        verbose_name="Je mimoriadne zatvorené", 
        help_text="Informácia o tom, či je prevádzka mimoriadne zatvorená (napr. sviatok).",
        default=False, 
        null=False
    )

    closure_reason = models.CharField(
        verbose_name="Dôvod zatvorenia", 
        help_text="Dôvod zatvorenia (zobrazené na stránke).",
        max_length=250, 
        blank=True, 
        null=True, 
    )

    class Meta:
        verbose_name = "Globálne nastavenie"
        verbose_name_plural = "Globálne nastavenia"

    def __str__(self):
        return f"Status: {'ZATVORENÉ' if self.is_force_closed else 'OTVORENÉ'}"

class OpeningHour(models.Model):
    DAY_CHOICES = [
        (1, "Pondelok"),
        (2, "Utorok"),
        (3, "Streda"),
        (4, "Štvrtok"),
        (5, "Piatok"),
        (6, "Sobota"),
        (7, "Nedeľa")
    ]

    day_of_week = models.IntegerField(
        verbose_name="Deň v týždni", 
        help_text="Deň v týždni.", 
        choices=DAY_CHOICES, 
        default=1, 
        unique=True,
        null=False
    )

    open_time = models.TimeField(
        verbose_name="Otvárame o",
        help_text="Čas otvárania.",
        null=False
    )

    close_time = models.TimeField(
        verbose_name="Zatvárame o",
        help_text="Čas zatvárania.",
        null=False
    )

    is_closed_all_day = models.BooleanField(
        verbose_name="Zatvorené celý deň", 
        help_text="Informácia o tom, či je prevádzka zatvorená celý deň.",
        default=False, 
        null=False
    )

    class Meta:
        verbose_name = "Otváracia hodina"
        verbose_name_plural = "Otváracie hodiny"
        ordering = ["day_of_week"]

    def __str__(self):
        if self.is_closed_all_day:
            return f"{self.day_of_week}: Zatvorené"

        return f"{self.day_of_week}: {self.open_time.strftime('%H:%M')} - {self.close_time.strftime('%H:%M')}"

class Service(models.Model):
    title = models.CharField(
        verbose_name="Názov", 
        help_text="Názov služby.",
        max_length=50, 
        null=False
    )

    duration = models.PositiveIntegerField(
        verbose_name="Čas trvania", 
        help_text="Čas trvania v minútach.",
        default=30, 
        null=False
    )

    price = models.PositiveIntegerField(
        verbose_name="Cena", 
        help_text="Cena v centoch.",
        default=1000, 
        null=False
    )

    class Meta:
        verbose_name = "Služba"
        verbose_name_plural = "Služby"
        ordering = ["id"]

    def __str__(self):
        return f"{self.title} ({self.duration} min) - {self.price / 100}€"

class Appointment(models.Model):
    service = models.ForeignKey(
        Service, 
        verbose_name="Služba",
        help_text="Zajednaná služba.", 
        on_delete=models.CASCADE,
        null=False
    )

    first_name = models.CharField(
        verbose_name="Meno", 
        help_text="Meno zákazníka.",
        max_length=20, 
        null=False
    )

    last_name = models.CharField(
        verbose_name="Priezvisko", 
        help_text="Priezvisko zákazníka.",
        max_length=50, 
        null=False
    )

    phone_number = models.CharField(
        verbose_name="Telefónne číslo", 
        help_text="Telefónne číslo zákazníka.",
        max_length=20, 
        null=False
    )

    date = models.DateField(
        verbose_name="Dátum",
        help_text="Dátum termínu.", 
        null=False
    )

    time_start = models.TimeField(
        verbose_name="Začiatok",
        help_text="Začiatok termínu.",
        null=False
    )

    is_active = models.BooleanField(
        verbose_name="Je platný", 
        help_text="Informácia o tom, či vybraný termín je platný.",
        default=True, 
        null=False
    )

    class Meta:
        verbose_name = "Termín"
        verbose_name_plural = "Termíny"

    def __str__(self):
        return f"{self.date} o {self.time_start} - {self.first_name} {self.last_name}"

class ContactMessage(models.Model):
    first_name = models.CharField(
        verbose_name="Meno", 
        help_text="Meno zákazníka.",
        max_length=20, 
        null=False
    )

    last_name = models.CharField(
        verbose_name="Priezvisko", 
        help_text="Priezvisko zákazníka.",
        max_length=50, 
        null=False
    )

    email_address = models.CharField(
        verbose_name="E-mailová adresa", 
        help_text="E-mailová adresa zákazníka.",
        max_length=50,
        null=False
    )


    message = models.TextField(
        verbose_name="Správa", 
        help_text="Obsah správy.",
        max_length=250, 
        null=True, 
        blank=True
    )

    creation_time = models.DateTimeField(
        verbose_name="Čas odoslania",
        help_text="Čas odoslania správy.", 
        auto_now_add=True,
        null=False
    )

    class Meta:
        verbose_name = "Správa"
        verbose_name_plural = "Správy"

    def __str__(self):
        return f"Správa od {self.first_name} {self.last_name}"