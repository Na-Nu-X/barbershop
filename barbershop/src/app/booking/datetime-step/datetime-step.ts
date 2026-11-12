import { Component, computed, effect, inject, signal, untracked } from "@angular/core"
import { BookingStore } from "../booking-store"
import { Button } from "../../shared/button/button"
import { CalendarDay, addDays, formatLongDate, fromIsoDate, toCalendarDay } from "../date-utils"
import type { Slot } from "../../services/booking"

interface DayOption extends CalendarDay {
  label:string, // Full Date For Screen Readers
  disabled:boolean
}

interface SlotGroup {
  label:string,
  slots:Slot[]
}

const DAYS_PER_PAGE:number = 7
const MS_PER_DAY:number = 86_400_000

// Step 2: Pick A Day From A Week Strip, Then A Free Start Time
@Component({
  selector: "app-datetime-step",
  imports: [Button],
  templateUrl: "./datetime-step.html",
  styleUrl: "./datetime-step.scss"
})
export class DatetimeStep {
  protected readonly store = inject(BookingStore)

  private readonly today:Date = startOfToday()

  protected readonly week = signal<number>(0) // Which 7-Day Page Is Shown (0 = Starting Today)
  protected readonly max_week = computed<number>(() => Math.floor(this.store.horizon_days() / DAYS_PER_PAGE))

  // Weekdays Marked As Closed In The Admin
  private readonly closed_weekdays = computed<Set<number>>(() => new Set(
    this.store.opening_days().filter((day) => day.is_closed).map((day) => day.day_of_week)
  ))

  protected readonly days = computed<DayOption[]>(() => {
    const first:number = this.week() * DAYS_PER_PAGE

    return Array.from({ length: DAYS_PER_PAGE }, (_, index) => this.toDayOption(first + index))
  })

  // Free Times Split Into Parts Of The Day (Empty Groups Are Hidden)
  protected readonly slot_groups = computed<SlotGroup[]>(() => {
    const groups:SlotGroup[] = [
      { label: "Dopoludnie", slots: [] },
      { label: "Popoludnie", slots: [] },
      { label: "Večer", slots: [] }
    ]

    for(const slot of this.store.available_slots()) {
      const hour:number = Number(slot.slot.slice(0, 2))
      groups[hour < 12 ? 0 : hour < 17 ? 1 : 2].slots.push(slot)
    }

    return groups.filter((group) => group.slots.length > 0)
  })

  protected readonly date_label = computed<string>(() => {
    const date:string|null = this.store.date()
    return date ? formatLongDate(date) : ""
  })

  constructor() {
    // Pre-Selects The First Open Day So Times Appear Immediately
    effect(() => {
      if(this.store.date() !== null) return

      const first_open:number|undefined = Array.from({ length: this.store.horizon_days() + 1 }, (_, offset) => offset)
        .find((offset) => !this.toDayOption(offset).disabled)

      if(first_open !== undefined) {
        untracked(() => this.store.chooseDate(this.toDayOption(first_open).iso))
      }
    })

    // Keeps The Visible Week In Sync With The Chosen Date
    effect(() => {
      const date:string|null = this.store.date()
      if(!date) return

      const offset:number = Math.round((fromIsoDate(date).getTime() - this.today.getTime()) / MS_PER_DAY)
      untracked(() => this.week.set(Math.max(0, Math.floor(offset / DAYS_PER_PAGE))))
    })
  }

  protected changeWeek(step:number):void {
    this.week.update((week) => Math.min(this.max_week(), Math.max(0, week + step)))
  }

  private toDayOption(offset:number):DayOption {
    const date:Date = addDays(this.today, offset)
    const day:CalendarDay = toCalendarDay(date)

    return {
      ...day,
      label: formatLongDate(day.iso),
      disabled: offset > this.store.horizon_days() || this.closed_weekdays().has(day.iso_weekday)
    }
  }
}

function startOfToday():Date {
  const today:Date = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}
