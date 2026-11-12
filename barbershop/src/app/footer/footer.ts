import { Component, afterNextRender, inject, signal } from "@angular/core"
import { Booking as BookingService, OpeningDay } from "../services/booking"
import { Scroll, SectionId } from "../services/scroll"
import { isoWeekday } from "../booking/date-utils"
import { SITE_CONFIG } from "../config/site.config"

type LoadState = "loading" | "ready" | "error"

interface FooterLink {
  label:string,
  section:SectionId
}

const DAY_NAMES:Record<number, string> = {
  1: "Pondelok",
  2: "Utorok",
  3: "Streda",
  4: "Štvrtok",
  5: "Piatok",
  6: "Sobota",
  7: "Nedeľa"
}

@Component({
  selector: "app-footer",
  imports: [],
  templateUrl: "./footer.html",
  styleUrl: "./footer.scss"
})
export class Footer {
  private readonly BookingService = inject(BookingService)
  protected readonly ScrollService = inject(Scroll)

  protected readonly site = SITE_CONFIG // Business Details
  protected readonly year:number = new Date().getFullYear() // Current Year For The Copyright
  protected readonly day_names = DAY_NAMES

  protected readonly hours_state = signal<LoadState>("loading")
  protected readonly opening_days = signal<OpeningDay[]>([])
  protected readonly today = signal<number|null>(null) // ISO Weekday, Only Known In The Browser

  protected readonly links:FooterLink[] = [
    { label: "Služby a cenník", section: "services" },
    { label: "Rezervácia", section: "booking" },
    { label: "Barberi", section: "barbers" },
    { label: "Kontakt", section: "contact" }
  ]

  constructor() {
    // Opening Hours Change In The Admin, So They Are Always Loaded Fresh In The Browser
    afterNextRender(() => {
      this.today.set(isoWeekday(new Date()))
      this.loadOpeningHours()
    })
  }

  private loadOpeningHours():void {
    this.BookingService.getOpeningHours().subscribe({
      next:(response) => {
        this.opening_days.set(response.success ? response.opening_hours : [])
        this.hours_state.set(response.success ? "ready" : "error")
      },

      error:(error) => {
        console.error(error) // Shows The Error
        this.hours_state.set("error")
      }
    })
  }

  protected navigate(event:MouseEvent, section:SectionId):void {
    event.preventDefault()
    this.ScrollService.toSection(section)
  }
}
