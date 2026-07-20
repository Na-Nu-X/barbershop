from django.urls import path
from . import views

urlpatterns = [
    path('api/get-status/', views.getStatus, name='get_status_url'),
    path('api/get-available-services/', views.getAvailableServices, name='get_available_services_url'),
    path('api/get-available-slots/', views.getAvailableSlots, name='get_available_slots_url'),
    path('api/create-appointment/', views.createAppointment, name='create_appointment_url'),
    path('api/contact/', views.sendMessage, name='send_message_url'),
    path('api/get-barbers/', views.getBarbers, name='get_barbers_url')
]