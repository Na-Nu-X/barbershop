import { ComponentFixture, TestBed } from "@angular/core/testing"
import { provideHttpClient } from "@angular/common/http"
import { provideHttpClientTesting } from "@angular/common/http/testing"

import { DetailsStep, PHONE_NUMBER_PATTERN } from "./details-step"
import { BookingStore } from "../booking-store"

describe("DetailsStep", () => {
  let fixture:ComponentFixture<DetailsStep>
  let element:HTMLElement
  let store:BookingStore

  const type = (id:string, value:string):void => {
    const input = element.querySelector<HTMLInputElement>(`#${id}`)!
    input.value = value
    input.dispatchEvent(new Event("input"))
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailsStep],
      providers: [BookingStore, provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents()

    store = TestBed.inject(BookingStore)
    vi.spyOn(store, "submit").mockImplementation(() => {})

    fixture = TestBed.createComponent(DetailsStep)
    element = fixture.nativeElement as HTMLElement
    await fixture.whenStable()
  })

  it("shows errors and does not submit an empty form", async () => {
    element.querySelector<HTMLButtonElement>("button[type=submit]")!.click()
    await fixture.whenStable()

    expect(element.querySelectorAll(".field_error").length).toBe(3)
    expect(store.submit).not.toHaveBeenCalled()
  })

  it("submits trimmed values when the form is valid", async () => {
    type("booking_first_name", "  Ján ")
    type("booking_last_name", "Novák")
    type("booking_phone", "+421 900 123 456")

    element.querySelector<HTMLButtonElement>("button[type=submit]")!.click()
    await fixture.whenStable()

    expect(store.submit).toHaveBeenCalledWith({ first_name: "Ján", last_name: "Novák", phone_number: "+421 900 123 456" })
  })

  it("accepts common Slovak phone formats and rejects text", () => {
    for(const valid of ["+421900123456", "+421 900 123 456", "0900 123 456", "0900/123 456"]) {
      expect(PHONE_NUMBER_PATTERN.test(valid)).toBe(true)
    }

    for(const invalid of ["call me", "12", "+421 900 123 456 789 000"]) {
      expect(PHONE_NUMBER_PATTERN.test(invalid)).toBe(false)
    }
  })
})
