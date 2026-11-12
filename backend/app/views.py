import json
import re
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from datetime import datetime
from rest_framework.views import csrf_exempt
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.db import transaction
from .models import Service, Appointment, ContactMessage, BarbershopConfig, OpeningHour, Barber
from .scheduling import BookingError, ensure_slot_bookable, get_day_schedule, get_opening_hour, is_open_on, local_now, next_opening

@csrf_exempt
def getStatus(request):
    if request.method != "GET":
        return JsonResponse({
            "success": False,
            "message": "Stav podniku a otváracie hodiny je možné získať len pomocou GET metódy."
        }, status=405)

    config = BarbershopConfig.objects.first() # Gets The Global Config

    if config and config.is_force_closed:
        return JsonResponse({
            "success": True,
            "message": "Stav podniku bol úspešne získaný.",
            "is_open": False,
            "status": "Mimoriadne zatvorené",
            "reason": config.closure_reason or "Dôvod nebol uvedený."
        }, status=200)

    now = local_now() # Gets The Current Local Time
    opening_hour = get_opening_hour(now.date()) # Gets The Opening Hour For The Current Day

    if is_open_on(opening_hour) and opening_hour.open_time <= now.time() < opening_hour.close_time:
        return JsonResponse({
            "success": True,
            "message": "Stav podniku bol úspešne získaný.",
            "is_open": True,
            "status": "Otvorené",
            "reason": None,
            "open_till": opening_hour.close_time.strftime("%H:%M")
        }, status=200)

    # Closed Right Now - Explains Why And When The Shop Opens Next
    if opening_hour is None:
        reason = "Neboli zadané otváracie hodiny."

    elif not is_open_on(opening_hour):
        reason = "Pravidelný zatvárací deň."

    else:
        reason = "Mimo otváracích hodín."

    upcoming = next_opening(now) # Gets The Next Opening (Later Today Or The Next Open Day)

    return JsonResponse({
        "success": True,
        "message": "Stav podniku bol úspešne získaný.",
        "is_open": False,
        "status": "Zatvorené",
        "reason": reason,
        "next_open": upcoming.open_time.strftime("%H:%M") if upcoming else None,
        "next_open_day": upcoming.day_label if upcoming else None
    }, status=200)

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
                "description": one_service.description,
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
    service_id = request.query_params.get("service_id") # Gets The Service ID From The URL Parameters

    if not date_string:
        return JsonResponse({
            "success": False,
            "message": "Nebol vybraný žiaden dátum."
        }, status=400)

    if not service_id:
        return JsonResponse({
            "success": False,
            "message": "Nebola vybraná služba."
        }, status=400)

    try:
        chosen_date = datetime.strptime(date_string, "%Y-%m-%d").date() # Gets The Chosen Date

    except ValueError:
        return JsonResponse({
            "success": False,
            "message": "Neplatný formát dátumu."
        }, status=400)

    try:
        service = Service.objects.get(id=int(service_id)) # Gets The Chosen Service (Its Duration Decides Which Times Fit)

    except (ValueError, Service.DoesNotExist):
        return JsonResponse({
            "success": False,
            "message": "Zvolená služba neexistuje."
        }, status=400)

    try:
        schedule = get_day_schedule(chosen_date, service) # Builds The Slots From Opening Hours And Existing Appointments

    except BookingError as error:
        return JsonResponse({
            "success": False,
            "message": error.message
        }, status=error.status)

    if schedule.is_closed:
        message = "V tento deň máme zatvorené."

    elif not any(one_slot.is_available for one_slot in schedule.slots):
        message = "Na zvolený deň nie sú voľné žiadne termíny."

    else:
        message = "Položky boli nájdené."

    return JsonResponse({
        "success": True,
        "message": message,
        "is_closed": schedule.is_closed,
        "slots_data": [
            {
                "slot": one_slot.start.strftime("%H:%M"),
                "is_available": one_slot.is_available
            }
            for one_slot in schedule.slots
        ],
    }, status=200)

PHONE_NUMBER_PATTERN = re.compile(r"^\+?[0-9][0-9 ()/-]{5,18}$") # e.g. "+421 900 123 456", "0900/123 456"

@api_view(["POST"])
def createAppointment(request):
    data = request.data if isinstance(request.data, dict) else {} # Gets The Request Data
    customer = data.get("customer") if isinstance(data.get("customer"), dict) else {} # Gets The Customer's Data

    first_name = str(customer.get("first_name") or "").strip() # Gets The Customer's First Name
    last_name = str(customer.get("last_name") or "").strip() # Gets The Customer's Last Name
    phone_number = str(customer.get("phone_number") or "").strip() # Gets The Customer's Phone Number
    service_id = data.get("service_id") # Gets The Service ID
    time_start = data.get("time_start") # Gets The Time Start
    date = data.get("date") # Gets The Date

    # Checks If All Data Exist
    if not all([first_name, last_name, phone_number, service_id, time_start, date]):
        return JsonResponse({
            "success": False,
            "message": "Všetky polia sú povinné."
        }, status=400)

    # Checks The Lengths Allowed By The Database
    if len(first_name) > 20 or len(last_name) > 50:
        return JsonResponse({
            "success": False,
            "message": "Meno môže mať najviac 20 a priezvisko najviac 50 znakov."
        }, status=400)

    if not PHONE_NUMBER_PATTERN.match(phone_number):
        return JsonResponse({
            "success": False,
            "message": "Zadajte, prosím, platné telefónne číslo."
        }, status=400)

    try:
        service = Service.objects.get(id=int(service_id)) # Gets The Service

    except (TypeError, ValueError, Service.DoesNotExist):
        return JsonResponse({
            "success": False,
            "message": "Zvolená služba neexistuje."
        }, status=400)

    try:
        chosen_time = datetime.strptime(str(time_start), "%H:%M").time() # Gets The Chosen Time
        chosen_date = datetime.strptime(str(date), "%Y-%m-%d").date() # Gets The Chosen Date

    except ValueError:
        return JsonResponse({
            "success": False,
            "message": "Neplatný formát dátumu alebo času."
        }, status=400)

    try:
        with transaction.atomic():
            # Locks That Weekday's Opening Hours Row So Two Simultaneous Requests Cannot Book Overlapping Times (PostgreSQL)
            list(OpeningHour.objects.select_for_update().filter(day_of_week=chosen_date.isoweekday()))

            ensure_slot_bookable(chosen_date, chosen_time, service) # Checks Opening Hours, Duration And Overlaps

            # Creates The New Appointment
            Appointment.objects.create(
                service=service,
                first_name=first_name,
                last_name=last_name,
                phone_number=phone_number,
                date=chosen_date,
                time_start=chosen_time
            )

    except BookingError as error:
        return JsonResponse({
            "success": False,
            "message": error.message
        }, status=error.status)

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

@csrf_exempt
def getBarbers(request):
    barbers = Barber.objects.filter(is_active=True) # Gets All Barbers

    # Creates Valid Format Of Barbers For JSON Response
    barbers_data = [] # Stores The Barbers Data

    for one_barber in barbers:
        portfolio = [
            request.build_absolute_uri(one_image.image.url) 
            for one_image in one_barber.portfolio_images.all() if one_image.image
        ]

        barbers_data.append({
            "id": one_barber.id,
            "first_name": one_barber.first_name,
            "nickname": one_barber.nickname,
            "bio": one_barber.bio,
            "profile_picture": request.build_absolute_uri(one_barber.profile_picture.url) if one_barber.profile_picture else None,
            "instagram": one_barber.instagram,
            "portfolio": portfolio
        })

    return JsonResponse({
        "success": True, 
        "message": "Dostupní barberi boli nájdení.",
        "barbers": barbers_data
    }, status=200)