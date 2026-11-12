import { Component, inject } from "@angular/core"
import { BookingStore } from "../booking-store"
import { Button } from "../../shared/button/button"
import { EuroPipe } from "../../shared/pipes/euro.pipe"
import { DurationPipe } from "../../shared/pipes/duration.pipe"
import type { Service } from "../../services/booking"

// Step 1: Pick A Service (Native Radios Give Keyboard Arrow-Key Navigation For Free)
@Component({
  selector: "app-service-step",
  imports: [Button, EuroPipe, DurationPipe],
  templateUrl: "./service-step.html",
  styleUrl: "./service-step.scss"
})
export class ServiceStep {
  protected readonly store = inject(BookingStore)

  protected choose(service:Service):void {
    this.store.chooseService(service)
  }
}
