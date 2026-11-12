import { ComponentFixture, TestBed } from "@angular/core/testing"
import { provideHttpClient } from "@angular/common/http"
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing"

import { Footer } from "./footer"
import { apiUrl } from "../config/api"
import { isoWeekday } from "../booking/date-utils"
import type { OpeningDay } from "../services/booking"

const WEEK:OpeningDay[] = Array.from({ length: 7 }, (_, index) => ({
  day_of_week: index + 1,
  is_closed: index === 6,
  open_time: index === 6 ? null : "09:00",
  close_time: index === 6 ? null : "18:00"
}))

describe("Footer", () => {
  let fixture:ComponentFixture<Footer>
  let element:HTMLElement
  let http_testing:HttpTestingController

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Footer],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents()

    fixture = TestBed.createComponent(Footer)
    element = fixture.nativeElement as HTMLElement
    http_testing = TestBed.inject(HttpTestingController)
    await fixture.whenStable()
  })

  it("lists every day and highlights today", async () => {
    http_testing.expectOne(apiUrl("get-opening-hours/")).flush({ success: true, message: "", opening_hours: WEEK, booking_horizon_days: 90 })
    await fixture.whenStable()

    const days = element.querySelectorAll(".hours .day")
    expect(days.length).toBe(7)
    expect(days[0].textContent).toContain("09:00 – 18:00")
    expect(days[6].textContent).toContain("Zatvorené")

    const today = element.querySelector(".hours .today")
    expect(today).toBe(days[isoWeekday(new Date()) - 1])
    expect(today?.textContent).toContain("dnes")
  })

  it("falls back to the phone number when the hours cannot be loaded", async () => {
    http_testing.expectOne(apiUrl("get-opening-hours/")).flush(null, { status: 500, statusText: "Server Error" })
    await fixture.whenStable()

    expect(element.querySelector(".hours")).toBeNull()
    expect(element.querySelector(".muted a[href^='tel:']")).toBeTruthy()
  })
})
