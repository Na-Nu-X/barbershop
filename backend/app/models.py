from django.db import models

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

    class Meta:
        verbose_name = "Termín"
        verbose_name_plural = "Termíny"

    def __str__(self):
        return f"{self.date} o {self.time_start} - {self.first_name} {self.last_name}"