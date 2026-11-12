import { Component, afterNextRender, inject, signal } from "@angular/core"
import { Booking as BookingService, Service } from "../services/booking"
import { BookingDraft } from "../services/booking-draft"
import { Scroll } from "../services/scroll"
import { Toast } from "../services/toast"
import { Button } from "../shared/button/button"
import { SectionHeading } from "../shared/section-heading/section-heading"
import { EuroPipe } from "../shared/pipes/euro.pipe"
import { DurationPipe } from "../shared/pipes/duration.pipe"

type LoadState = "loading" | "ready" | "error"

@Component({
  selector: "app-pricing",
  imports: [Button, SectionHeading, EuroPipe, DurationPipe],
  templateUrl: "./pricing.html",
  styleUrl: "./pricing.scss",
})
export class Pricing {
  private readonly BookingService = inject(BookingService)
  private readonly BookingDraftService = inject(BookingDraft)
  private readonly ScrollService = inject(Scroll)
  private readonly ToastService = inject(Toast)

  protected readonly state = signal<LoadState>("loading")
  protected readonly services = signal<Service[]>([])
  protected readonly skeletons:number[] = [1, 2, 3, 4] // Placeholder Cards While Loading

  constructor() {
    // Prices Change In The Admin, So They Are Always Loaded Fresh In The Browser
    afterNextRender(() => this.loadServices())
  }

  // Method For Load The Services
  loadServices():void {
    this.state.set("loading")

    this.BookingService.getAvailableServices().subscribe({
      next:(response) => {
        if(response.success) {
          this.services.set(response.services)
          this.state.set("ready")
        }

        else {
          console.error(response.message) // Shows The Error Message
          this.state.set("error")
        }
      },

      error:(error) => {
        console.error(error) // Shows The Error
        this.state.set("error")
      }
    })
  }

  // Method For Pre-Select A Service And Jump To The Booking Form
  book(service:Service):void {
    this.BookingDraftService.selectService(service)
    this.ScrollService.toSection("booking")
    this.ToastService.info(`Vybraná služba: ${service.title}. Teraz si zvoľte dátum a čas.`)
  }
}
