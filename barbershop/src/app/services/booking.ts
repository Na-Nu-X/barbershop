import { Injectable } from "@angular/core"
import { HttpClient } from "@angular/common/http"
import { Observable } from "rxjs"

import type { Customer } from "../booking/booking"

export interface Service {
    id:number,
    title:string,
    duration:number,
    price:number
}

interface AvailableServicesResponse {
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
    constructor(private http:HttpClient) {}

    // Method For Get The Available Services
    getAvailableServices():Observable<AvailableServicesResponse> {
        const api_url:string = `http://127.0.0.1:8001/api/get-available-services/` // Connection To The Back-End API
        return this.http.get<AvailableServicesResponse>(api_url) // Returns The Data
    }

    // Method For Get The Available Slots
    getAvailableSlots(date:string):Observable<AvailableSlotsResponse> {
        const api_url:string = `http://127.0.0.1:8001/api/get-available-slots/?date=${date}` // Connection To The Back-End API
        return this.http.get<AvailableSlotsResponse>(api_url) // Returns The Data
    }

    // Method For Create The Appointment
    createAppointment(customer:Customer, service_id:number, time_start:string, date:string):Observable<any> {
        const api_url = "http://127.0.0.1:8001/api/create-appointment/" // Connection To The Back-End API
        return this.http.post<any>(api_url, { customer, service_id, time_start, date }) // Returns The Data
    }
}