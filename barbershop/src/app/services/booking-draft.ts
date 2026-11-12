import { Injectable, signal } from "@angular/core"
import type { Service } from "./booking"

// Shares The Visitor's In-Progress Booking Choices Between Sections (e.g. Picking A Service In The Price List)
@Injectable({
  providedIn: "root"
})
export class BookingDraft {
  private readonly service_state = signal<Service|null>(null)
  readonly service = this.service_state.asReadonly() // Currently Chosen Service, Null When None

  // A Fresh Object Each Time, So Picking The Same Service Again Still Notifies The Booking Form
  selectService(service:Service):void {
    this.service_state.set({ ...service })
  }
}
