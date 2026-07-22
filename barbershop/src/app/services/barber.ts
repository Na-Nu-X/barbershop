import { Injectable } from "@angular/core"
import { HttpClient } from "@angular/common/http"
import { Observable } from "rxjs"

export interface BarberData {
    id:number,
    first_name:string,
    nickname:string,
    bio:string,
    profile_picture:string,
    instagram:string,
    portfolio:string[]
}

interface BarbersResponse {
    success:boolean,
    message:string,
    barbers:BarberData[]
}

@Injectable({
    providedIn: "root"
})
export class Barber {
    private api_url:string = "http://127.0.0.1:8001/api/get-barbers/" // Connection To The Back-End API

    constructor(private http: HttpClient) { }

    // Method For Send The Message
    getBarbers():Observable<BarbersResponse> {
        return this.http.get<BarbersResponse>(this.api_url) // Returns The Data
    }
}