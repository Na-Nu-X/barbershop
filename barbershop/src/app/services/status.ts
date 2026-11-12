import { Injectable } from "@angular/core"
import { HttpClient } from "@angular/common/http"
import { Observable } from "rxjs"
import { apiUrl } from "../config/api"

export interface StatusResponse {
    success:boolean,
    message:string,
    is_open?:boolean,
    status?:string,
    reason?:string,
    open_till?:string,
    next_open?:string|null,
    next_open_day?:string|null // "dnes", "zajtra" Or e.g. "v pondelok"
}

@Injectable({
    providedIn: "root"
})
export class Status {
    private api_url:string = apiUrl("get-status/") // Connection To The Back-End API

    constructor(private http: HttpClient) { }

    // Method For Send The Message
    getStatus():Observable<StatusResponse> {
        return this.http.get<StatusResponse>(this.api_url) // Returns The Data
    }
}