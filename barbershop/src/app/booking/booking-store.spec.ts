import { TestBed } from "@angular/core/testing"
import { provideHttpClient } from "@angular/common/http"
import { HttpTestingController, TestRequest, provideHttpClientTesting } from "@angular/common/http/testing"

import { BookingStore } from "./booking-store"
import { BookingDraft } from "../services/booking-draft"
import { Toast } from "../services/toast"
import { apiUrl } from "../config/api"
import type { Service } from "../services/booking"

const HAIRCUT:Service = { id: 1, title: "Strih", description: "", duration: 30, price: 1500 }
const BEARD:Service = { id: 2, title: "Brada", description: "", duration: 75, price: 2000 }
const CUSTOMER = { first_name: "Ján", last_name: "Novák", phone_number: "+421900123456" }

describe("BookingStore", () => {
  let store:BookingStore
  let http_testing:HttpTestingController
  let toast:Toast

  const slotsRequest = ():TestRequest => http_testing.expectOne((request) => request.url === apiUrl("get-available-slots/"))

  const respondWithSlots = (request:TestRequest):void => {
    request.flush({ success: true, message: "", is_closed: false, slots_data: [{ slot: "09:00", is_available: true }, { slot: "09:15", is_available: false }] })
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BookingStore, provideHttpClient(), provideHttpClientTesting()]
    })

    store = TestBed.inject(BookingStore)
    http_testing = TestBed.inject(HttpTestingController)
    toast = TestBed.inject(Toast)
  })

  afterEach(() => {
    http_testing.verify()
  })

  it("jumps to choosing a date when a service is picked in the price list", () => {
    TestBed.inject(BookingDraft).selectService(BEARD)
    TestBed.tick() // Runs Effects

    expect(store.service()?.id).toBe(2)
    expect(store.step()).toBe(2)
  })

  it("loads slots for the chosen service and exposes only free ones", () => {
    store.chooseService(HAIRCUT, true)
    store.chooseDate("2030-01-07")

    const request = slotsRequest()
    expect(request.request.params.get("date")).toBe("2030-01-07")
    expect(request.request.params.get("service_id")).toBe("1")
    respondWithSlots(request)

    expect(store.slots_state()).toBe("ready")
    expect(store.available_slots().map((slot) => slot.slot)).toEqual(["09:00"])
  })

  it("reloads slots when the service changes because availability depends on duration", () => {
    store.chooseService(HAIRCUT)
    store.chooseDate("2030-01-07")
    respondWithSlots(slotsRequest())
    store.chooseTime("09:00")

    store.chooseService(BEARD)

    expect(store.time()).toBeNull()
    expect(slotsRequest().request.params.get("service_id")).toBe("2")
  })

  it("cancels an older slots request when another date is picked", () => {
    store.chooseService(HAIRCUT)
    store.chooseDate("2030-01-07")
    const first = slotsRequest()

    store.chooseDate("2030-01-08")
    const second = slotsRequest()

    expect(first.cancelled).toBe(true)
    respondWithSlots(second)
  })

  it("only allows opening steps whose earlier choices are made", () => {
    store.goTo(3)
    expect(store.step()).toBe(1)

    store.chooseService(HAIRCUT)
    store.chooseDate("2030-01-07")
    respondWithSlots(slotsRequest())
    store.chooseTime("09:00")

    expect(store.step()).toBe(3)
    expect(store.can_open()).toEqual({ 1: true, 2: true, 3: true })
  })

  it("shows a confirmation after a successful booking", () => {
    store.chooseService(HAIRCUT)
    store.chooseDate("2030-01-07")
    respondWithSlots(slotsRequest())
    store.chooseTime("09:00")

    store.submit(CUSTOMER)
    const request = http_testing.expectOne(apiUrl("create-appointment/"))

    expect(request.request.body).toEqual({ customer: CUSTOMER, service_id: 1, date: "2030-01-07", time_start: "09:00" })
    request.flush({ success: true, message: "OK" }, { status: 201, statusText: "Created" })

    expect(store.confirmation()).toEqual({ service: HAIRCUT, date: "2030-01-07", time: "09:00", customer: CUSTOMER })
    expect(store.is_submitting()).toBe(false)
  })

  it("goes back to picking a time with fresh slots when the time was taken (409)", () => {
    const error_spy = vi.spyOn(toast, "error")

    store.chooseService(HAIRCUT)
    store.chooseDate("2030-01-07")
    respondWithSlots(slotsRequest())
    store.chooseTime("09:00")

    store.submit(CUSTOMER)
    http_testing.expectOne(apiUrl("create-appointment/")).flush({ success: false, message: "Obsadené" }, { status: 409, statusText: "Conflict" })

    expect(error_spy).toHaveBeenCalledWith("Obsadené")
    expect(store.step()).toBe(2)
    expect(store.time()).toBeNull()
    respondWithSlots(slotsRequest()) // Slots Were Reloaded
  })

  it("starts a new booking with the same service", () => {
    store.chooseService(HAIRCUT)
    store.chooseDate("2030-01-07")
    respondWithSlots(slotsRequest())
    store.chooseTime("09:00")
    store.submit(CUSTOMER)
    http_testing.expectOne(apiUrl("create-appointment/")).flush({ success: true, message: "OK" })

    store.reset()

    expect(store.confirmation()).toBeNull()
    expect(store.service()?.id).toBe(1)
    expect([store.date(), store.time(), store.step()]).toEqual([null, null, 2])
  })
})
