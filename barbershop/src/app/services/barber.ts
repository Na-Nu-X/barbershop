import { Injectable, inject } from "@angular/core"
import { HttpClient } from "@angular/common/http"
import { Observable } from "rxjs"
import { apiUrl } from "../config/api"

export interface BarberData {
    id:number,
    first_name:string,
    nickname:string|null,
    bio:string|null,
    profile_picture:string|null, // Absolute URL
    instagram:string|null,
    portfolio:string[] // Absolute URLs
}

export interface BarbersResponse {
    success:boolean,
    message:string,
    barbers:BarberData[]
}

@Injectable({
    providedIn: "root"
})
export class Barber {
    private readonly http = inject(HttpClient)

    // Method For Get The Active Barbers
    getBarbers():Observable<BarbersResponse> {
        return this.http.get<BarbersResponse>(apiUrl("get-barbers/"))
    }
}
