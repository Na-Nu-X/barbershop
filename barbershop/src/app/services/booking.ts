import { Injectable } from "@angular/core"
import { HttpClient } from "@angular/common/http"
import { Observable, shareReplay } from "rxjs"
import { apiUrl } from "../config/api"

import type { Customer } from "../booking/booking"

export interface Service {
    id:number,
    title:string,
    description:string,
    duration:number,
    price:number
}

export interface AvailableServicesResponse {
    success:boolean,
    message:string,
    services:Service[]
}

interface AvailableSlotsResponse {
    success:boolean,
    message:string,

    slots_data:{
        slot:string,
        is_available:boolean
    }[]
}

@Injectable({
  providedIn: "root"
})
export class Booking {
    private services_request$:Observable<AvailableServicesResponse>|null = null // Shared Request So The Price List And Booking Form Fetch Services Only Once

    constructor(private http:HttpClient) {}

    // Method For Get The Available Services (Cached; A Failed Request Is Retried On The Next Call)
    getAvailableServices():Observable<AvailableServicesResponse> {
        const api_url:string = apiUrl("get-available-services/") // Connection To The Back-End API

        this.services_request$ ??= this.http.get<AvailableServicesResponse>(api_url).pipe(
            shareReplay({ bufferSize: 1, refCount: false })
        )

        return this.services_request$ // Returns The Data
    }

    // Method For Get The Available Slots
    getAvailableSlots(date:string):Observable<AvailableSlotsResponse> {
        const api_url:string = apiUrl(`get-available-slots/?date=${encodeURIComponent(date)}`) // Connection To The Back-End API
        return this.http.get<AvailableSlotsResponse>(api_url) // Returns The Data
    }

    // Method For Create The Appointment
    createAppointment(customer:Customer, service_id:number, time_start:string, date:string):Observable<any> {
        const api_url = apiUrl("create-appointment/") // Connection To The Back-End API
        return this.http.post<any>(api_url, { customer, service_id, time_start, date }) // Returns The Data
    }
}