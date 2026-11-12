import { Component, ElementRef, Injector, afterNextRender, computed, effect, inject, untracked, viewChild } from "@angular/core"
import { BookingStep, BookingStore } from "./booking-store"
import { ServiceStep } from "./service-step/service-step"
import { DatetimeStep } from "./datetime-step/datetime-step"
import { DetailsStep } from "./details-step/details-step"
import { BookingSummary } from "./booking-summary/booking-summary"
import { Button } from "../shared/button/button"
import { SectionHeading } from "../shared/section-heading/section-heading"
import { formatShortDate } from "./date-utils"
import { SITE_CONFIG } from "../config/site.config"

interface StepInfo {
  number:BookingStep,
  label:string,
  title:string, // Heading Shown Above The Step Content
  summary:string|null // The Choice Made In That Step, Shown In The Stepper
}

@Component({
  selector: "app-booking",
  imports: [ServiceStep, DatetimeStep, DetailsStep, BookingSummary, Button, SectionHeading],
  providers: [BookingStore],
  templateUrl: "./booking.html",
  styleUrl: "./booking.scss",
})
export class Booking {
  protected readonly store = inject(BookingStore)
  protected readonly site = SITE_CONFIG

  private readonly injector = inject(Injector)
  private readonly step_heading = viewChild<ElementRef<HTMLElement>>("step_heading")

  protected readonly steps = computed<StepInfo[]>(() => {
    const date:string|null = this.store.date()
    const time:string|null = this.store.time()

    return [
      { number: 1, label: "Služba", title: "Vyberte si službu", summary: this.store.service()?.title ?? null },
      { number: 2, label: "Termín", title: "Vyberte si dátum a čas", summary: date && time ? `${formatShortDate(date)} · ${time}` : null },
      { number: 3, label: "Údaje", title: "Vaše kontaktné údaje", summary: null }
    ]
  })

  protected readonly current = computed<StepInfo>(() => this.steps()[this.store.step() - 1])

  constructor() {
    afterNextRender(() => this.store.load()) // Services And Opening Hours Are Always Loaded Fresh In The Browser

    // Moves Keyboard / Screen-Reader Focus To The New Step's Heading (Not On The First Render)
    let is_first_run:boolean = true

    effect(() => {
      this.store.step()
      this.store.confirmation()

      if(is_first_run) {
        is_first_run = false
        return
      }

      untracked(() => afterNextRender(() => this.step_heading()?.nativeElement.focus(), { injector: this.injector }))
    })
  }
}
