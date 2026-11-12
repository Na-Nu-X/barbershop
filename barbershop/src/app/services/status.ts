import { Injectable, inject } from "@angular/core"
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
    private readonly http = inject(HttpClient)

    // Method For Get Whether The Shop Is Open Right Now
    getStatus():Observable<StatusResponse> {
        return this.http.get<StatusResponse>(apiUrl("get-status/"))
    }
}