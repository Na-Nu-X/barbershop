import { Injectable, inject } from "@angular/core"
import { HttpClient } from "@angular/common/http"
import { Observable } from "rxjs"
import { apiUrl } from "../config/api"

export interface ContactMessage {
  first_name:string,
  last_name:string,
  email_address:string,
  message:string
}

export interface ContactResponse {
  success:boolean,
  message:string
}

@Injectable({
  providedIn: "root"
})
export class Message {
  private readonly http = inject(HttpClient)

  // Method For Send The Contact Form
  sendMessage(contact_message:ContactMessage):Observable<ContactResponse> {
    return this.http.post<ContactResponse>(apiUrl("contact/"), contact_message)
  }
}
