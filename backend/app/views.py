import json
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from datetime import datetime, timedelta, time
from rest_framework.views import csrf_exempt
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from .models import Service, Appointment, ContactMessage

@csrf_exempt
def getAvailableServices(request):
    try:
        services = Service.objects.all() # Gets The All Available Services

        # Creates Valid Format Of Services For JSON Response
        services_data = []

        for one_service in services:
            services_data.append({
                "id": one_service.id,
                "title": one_service.title,
                "duration": one_service.duration,
                "price": one_service.price
            })

        # Sends The Data As A JSON Response
        return JsonResponse({
            "success": True,
            "message": "Dostupné služby boli nájdené.",
            "services": list(services_data), 
        }, status=200, safe=False)

    except Exception:
        return JsonResponse({
            "success": False, 
            "message": "Pri získavaní dostupných služieb došlo k chybe."
        }, status=500)

@api_view(["GET"])
def getAvailableSlots(request):
    date_string = request.query_params.get("date") # Gets The Date From The URL Parameters

    if not date_string:
        return JsonResponse({
            "success": False,
            "message": "Nebol vybraný žiaden dátum."
        }, status=400)

    START_HOUR = 9 # Defines The Start Hour
    END_HOUR = 17 # Defines The End Hour
    SLOT_DURATION = 30 # Defines The Slot Duration
    
    chosen_date = datetime.strptime(date_string, '%Y-%m-%d').date() # Gets The Chosen Date

    all_slots = [] # Stores The All Slots
    start_time = datetime.combine(chosen_date, time(START_HOUR, 0)) # Gets The Start Time
    end_time = datetime.combine(chosen_date, time(END_HOUR, 0)) # Gets The End Time

    while start_time < end_time:
        all_slots.append(start_time.time()) # Adds The Available Slot
        start_time += timedelta(minutes=SLOT_DURATION) # Increases The Start Time

    booked_appointments = Appointment.objects.filter(date=chosen_date) # Gets The Already Booked Appointments For The Chosen Date
    booked_times = [app.time_start for app in booked_appointments] # Gets The Already Booked Times For The Chosen Date

    slots_data = [] # Stores The Slots Data

    for one_slot in all_slots:
        slots_data.append({
            "slot": one_slot.strftime('%H:%M'),
            "is_available": one_slot not in booked_times
        })

    return JsonResponse({
        "success": True,
        "message": "Položky boli nájdené.",
        "slots_data": slots_data, 
    }, status=200)

@api_view(["POST"])
def createAppointment(request):
    customer = request.data.get("customer") # Gets The Customer's Data
    first_name = customer.get("first_name") # Gets The Customer's First Name
    last_name = customer.get("last_name") # Gets The Customer's Last Name
    phone_number = customer.get("phone_number") # Gets The Customer's Phone Number
    service_id = request.data.get("service_id") # Gets The Service ID
    time_start = request.data.get("time_start") # Gets The Time Start
    date = request.data.get("date") # Gets The Date

    # Checks If All Data Exist
    if not all([customer, first_name, last_name, phone_number, service_id, time_start, date]):
        return JsonResponse({
            "success": False,
            "message": "Všetky polia sú povinné."
        }, status=400)

    try:
        service = Service.objects.get(id=service_id) # Gets The Service
        chosen_time = datetime.strptime(time_start, '%H:%M').time() # Gets The Chosen Time
        chosen_date = datetime.strptime(date, '%Y-%m-%d').date() # Gets The Chosen Date

    except(Service.DoesNotExist):
        return JsonResponse({
            "success": False,
            "message": "Zvolená služba neexistuje."
        }, status=400)

    except(ValueError):
        return JsonResponse({
            "success": False,
            "message": "Neplatný formát času."
        }, status=400)

    is_booked = Appointment.objects.filter(date=chosen_date, time_start=chosen_time).exists() # Checks If The Appointment Is Already Booked

    if is_booked:
        return JsonResponse({
            "success": False,
            "message": "Tento termín bol práve obsadený. Vyberte si, prosím, iný."
        }, status=400)

    # Creates The New Appointment
    Appointment.objects.create(
        service=service,
        first_name=first_name,
        last_name=last_name,
        phone_number=phone_number,
        date=chosen_date,
        time_start=chosen_time
    )

    return Response({
        "success": True,
        "message": f"Rezervácia na meno {first_name} {last_name} bola úspešne vytvorená!"
    }, status=201)

@csrf_exempt
def sendMessage(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body) # Gets The Data

            first_name = data.get("first_name") # Gets The First Name
            last_name = data.get("last_name") # Gets The Last Name
            email_address = data.get("email_address") # Gets The E-mail Address
            message = data.get("message") # Gets The Message
            
            # Saves The New Message
            ContactMessage.objects.create(
                first_name=first_name,
                last_name=last_name,
                email_address=email_address,
                message=message
            )

            # Sends Mail
            subject = f"Barbershop - správa od zákazníka"
            text_content = f"{first_name} {last_name} - {email_address}\n\n{message}"
            sender = email_address
            receiver = [settings.EMAIL_HOST_USER]
            html_content = f"""
                <p>
                    <b>{first_name} {last_name} - {email_address}</b><br><br>
                    {message}
                </p>
            """

            mail_message = EmailMultiAlternatives(subject, text_content, sender, receiver)
            mail_message.attach_alternative(html_content, "text/html")

            mail_message.send()
            
            return JsonResponse({
                "success": True, 
                "message": "Správa bola odoslaná."
            }, status=200)

        except Exception as e:
            print(e)
            return JsonResponse({
                "success": False, 
                "message": "Pri odosielaní správy došlo k chybe."
            }, status=500)
            
    return JsonResponse({
        "success": False, 
        "message": "Správa sa dá odoslať len pomocou POST metódy."
    }, status=405)