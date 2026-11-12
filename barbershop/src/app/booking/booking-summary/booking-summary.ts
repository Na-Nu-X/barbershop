import { Component, computed, input } from "@angular/core"
import { EuroPipe } from "../../shared/pipes/euro.pipe"
import { DurationPipe } from "../../shared/pipes/duration.pipe"
import { formatLongDate } from "../date-utils"
import type { Service } from "../../services/booking"

// Compact Recap Of A Booking (Used Before Confirming And On The Confirmation Screen)
@Component({
  selector: "app-booking-summary",
  imports: [EuroPipe, DurationPipe],
  templateUrl: "./booking-summary.html",
  styleUrl: "./booking-summary.scss"
})
export class BookingSummary {
  readonly service = input.required<Service>()
  readonly date = input.required<string>() // "YYYY-MM-DD"
  readonly time = input.required<string>() // "HH:MM"

  protected readonly date_label = computed<string>(() => formatLongDate(this.date()))
}
