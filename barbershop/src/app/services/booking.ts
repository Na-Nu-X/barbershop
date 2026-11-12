import { Injectable, inject } from "@angular/core"
import { HttpClient, HttpParams } from "@angular/common/http"
import { Observable, shareReplay } from "rxjs"
import { apiUrl } from "../config/api"

export interface Service {
    id:number,
    title:string,
    description:string,
    duration:number, // Minutes
    price:number // Cents
}

export interface Customer {
    first_name:string,
    last_name:string,
    phone_number:string
}

export interface Slot {
    slot:string, // "HH:MM"
    is_available:boolean
}

export interface OpeningDay {
    day_of_week:number, // ISO Weekday, 1 = Monday
    is_closed:boolean,
    open_time:string|null,
    close_time:string|null
}

export interface AppointmentRequest {
    customer:Customer,
    service_id:number,
    date:string, // "YYYY-MM-DD"
    time_start:string // "HH:MM"
}

export interface ApiMessageResponse {
    success:boolean,
    message:string
}

export interface AvailableServicesResponse extends ApiMessageResponse {
    services:Service[]
}

export interface AvailableSlotsResponse extends ApiMessageResponse {
    is_closed:boolean,
    slots_data:Slot[]
}

export interface OpeningHoursResponse extends ApiMessageResponse {
    opening_hours:OpeningDay[],
    booking_horizon_days:number
}

@Injectable({
  providedIn: "root"
})
export class Booking {
    private readonly http = inject(HttpClient)

    // Shared Requests For Data That Rarely Changes (A Failed Request Is Retried On The Next Call)
    private services_request$:Observable<AvailableServicesResponse>|null = null
    private opening_hours_request$:Observable<OpeningHoursResponse>|null = null

    // Method For Get The Available Services (Used By The Price List And The Booking Form)
    getAvailableServices():Observable<AvailableServicesResponse> {
        this.services_request$ ??= this.http.get<AvailableServicesResponse>(apiUrl("get-available-services/")).pipe(
            shareReplay({ bufferSize: 1, refCount: false })
        )

        return this.services_request$
    }

    // Method For Get The Weekly Opening Hours And How Far Ahead Booking Is Allowed
    getOpeningHours():Observable<OpeningHoursResponse> {
        this.opening_hours_request$ ??= this.http.get<OpeningHoursResponse>(apiUrl("get-opening-hours/")).pipe(
            shareReplay({ bufferSize: 1, refCount: false })
        )

        return this.opening_hours_request$
    }

    // Method For Get The Bookable Start Times For A Service On A Date (Never Cached - Availability Changes Constantly)
    getAvailableSlots(date:string, service_id:number):Observable<AvailableSlotsResponse> {
        const params:HttpParams = new HttpParams().set("date", date).set("service_id", service_id)
        return this.http.get<AvailableSlotsResponse>(apiUrl("get-available-slots/"), { params })
    }

    // Method For Create The Appointment
    createAppointment(request:AppointmentRequest):Observable<ApiMessageResponse> {
        return this.http.post<ApiMessageResponse>(apiUrl("create-appointment/"), request)
    }
}
