import { Injectable, computed, effect, inject, signal, untracked } from "@angular/core"
import { HttpErrorResponse } from "@angular/common/http"
import { Subscription } from "rxjs"
import { Booking as BookingService, Customer, OpeningDay, Service, Slot } from "../services/booking"
import { BookingDraft } from "../services/booking-draft"
import { Toast } from "../services/toast"

export type BookingStep = 1 | 2 | 3
export type LoadState = "idle" | "loading" | "ready" | "error"

export interface BookingConfirmation {
  service:Service,
  date:string,
  time:string,
  customer:Customer
}

const DEFAULT_HORIZON_DAYS:number = 90 // Matches BOOKING_HORIZON_DAYS In The Back-End

/*
 State And Actions For The 3-Step Booking Flow
 Provided By The Booking Component, So Each Booking Form Gets Its Own Instance.
 Step 1: Service → Step 2: Date & Time → Step 3: Contact Details → Confirmation
*/
@Injectable()
export class BookingStore {
  private readonly api = inject(BookingService)
  private readonly draft = inject(BookingDraft)
  private readonly toast = inject(Toast)

  private slots_subscription:Subscription|null = null

  // Data From The API
  readonly services = signal<Service[]>([])
  readonly services_state = signal<LoadState>("idle")
  readonly opening_days = signal<OpeningDay[]>([]) // Empty = Unknown, Every Day Is Offered
  readonly horizon_days = signal<number>(DEFAULT_HORIZON_DAYS)

  // The Visitor's Choices
  readonly step = signal<BookingStep>(1)
  readonly service = signal<Service|null>(null)
  readonly date = signal<string|null>(null)
  readonly time = signal<string|null>(null)

  // Slots For The Chosen Service And Date
  readonly slots = signal<Slot[]>([])
  readonly slots_state = signal<LoadState>("idle")
  readonly is_day_closed = signal<boolean>(false)
  readonly available_slots = computed<Slot[]>(() => this.slots().filter((slot) => slot.is_available))

  // Submission
  readonly is_submitting = signal<boolean>(false)
  readonly confirmation = signal<BookingConfirmation|null>(null)

  // Which Steps Can Be Opened From The Stepper
  readonly can_open = computed<Record<BookingStep, boolean>>(() => ({
    1: true,
    2: this.service() !== null,
    3: this.service() !== null && this.date() !== null && this.time() !== null
  }))

  constructor() {
    // A Service Picked In The Price List Jumps Straight To Choosing A Date
    effect(() => {
      const picked:Service|null = this.draft.service()
      if(picked) untracked(() => this.chooseService(picked, true))
    })
  }

  // Method For Load The Services And Opening Hours
  load():void {
    this.services_state.set("loading")

    this.api.getAvailableServices().subscribe({
      next:(response) => {
        this.services.set(response.success ? response.services : [])
        this.services_state.set(response.success ? "ready" : "error")
      },

      error:() => this.services_state.set("error")
    })

    // Optional: Without It Every Day Is Offered And The Back-End Still Validates
    this.api.getOpeningHours().subscribe({
      next:(response) => {
        if(response.success) {
          this.opening_days.set(response.opening_hours)
          this.horizon_days.set(response.booking_horizon_days)
        }
      },

      error:(error) => console.error(error)
    })
  }

  // Step 1: Choose A Service (Availability Depends On Its Duration, So Slots Are Reloaded)
  chooseService(service:Service, advance:boolean = false):void {
    this.confirmation.set(null)

    if(this.service()?.id !== service.id) {
      this.service.set(service)
      this.time.set(null)
      if(this.date()) this.loadSlots()
    }

    if(advance) this.step.set(2)
  }

  // Step 2: Choose A Date
  chooseDate(date:string):void {
    if(this.date() === date && this.slots_state() !== "error") return

    this.date.set(date)
    this.time.set(null)
    this.loadSlots()
  }

  // Step 2: Choose A Time, Then Continue To The Contact Details
  chooseTime(time:string):void {
    this.time.set(time)
    this.step.set(3)
  }

  // Method For Open A Step From The Stepper Or A "Back" Button
  goTo(step:BookingStep):void {
    if(this.can_open()[step]) this.step.set(step)
  }

  // Method For Load The Slots For The Chosen Service And Date (Cancels Any Older Request)
  loadSlots():void {
    const service:Service|null = this.service()
    const date:string|null = this.date()

    if(!service || !date) return

    this.slots_subscription?.unsubscribe()
    this.slots_state.set("loading")
    this.slots.set([])

    this.slots_subscription = this.api.getAvailableSlots(date, service.id).subscribe({
      next:(response) => {
        this.slots.set(response.slots_data ?? [])
        this.is_day_closed.set(response.is_closed ?? false)
        this.slots_state.set("ready")
      },

      error:(error:HttpErrorResponse) => {
        console.error(error)
        this.slots_state.set("error")
        this.toast.error(error.error?.message || "Pri hľadaní voľných termínov došlo k chybe.")
      }
    })
  }

  // Step 3: Send The Booking
  submit(customer:Customer):void {
    const service:Service|null = this.service()
    const date:string|null = this.date()
    const time:string|null = this.time()

    if(!service || !date || !time || this.is_submitting()) return

    this.is_submitting.set(true)

    this.api.createAppointment({ customer, service_id: service.id, date, time_start: time }).subscribe({
      next:(response) => {
        this.is_submitting.set(false)

        if(response.success) {
          this.confirmation.set({ service, date, time, customer })
        }

        else {
          this.toast.error(response.message)
        }
      },

      error:(error:HttpErrorResponse) => {
        this.is_submitting.set(false)
        this.toast.error(error.error?.message || "Pri vytváraní rezervácie nastala chyba.")

        // Someone Else Took The Time Meanwhile - Back To Picking A Time With Fresh Slots
        if(error.status === 409) {
          this.time.set(null)
          this.step.set(2)
          this.loadSlots()
        }
      }
    })
  }

  // Method For Start Another Booking (Keeps The Chosen Service For Convenience)
  reset():void {
    this.confirmation.set(null)
    this.date.set(null)
    this.time.set(null)
    this.slots.set([])
    this.slots_state.set("idle")
    this.step.set(this.service() ? 2 : 1)
  }
}
