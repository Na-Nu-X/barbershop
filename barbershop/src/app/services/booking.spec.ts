import { TestBed } from "@angular/core/testing"
import { provideHttpClient } from "@angular/common/http"
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing"

import { Booking } from "./booking"
import { apiUrl } from "../config/api"

describe("Booking", () => {
  let service:Booking
  let http_testing:HttpTestingController

  const services_url:string = apiUrl("get-available-services/")

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })

    service = TestBed.inject(Booking)
    http_testing = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    http_testing.verify()
  })

  it("fetches the services only once for multiple subscribers", () => {
    const received:number[] = []

    service.getAvailableServices().subscribe((response) => received.push(response.services.length))
    service.getAvailableServices().subscribe((response) => received.push(response.services.length))

    http_testing.expectOne(services_url).flush({ success: true, message: "", services: [{ id: 1, title: "Strih", description: "", duration: 30, price: 1500 }] })

    service.getAvailableServices().subscribe((response) => received.push(response.services.length)) // Late Subscriber Gets The Cached Value
    http_testing.expectNone(services_url)

    expect(received).toEqual([1, 1, 1])
  })

  it("retries the request after a failure", () => {
    service.getAvailableServices().subscribe({ error: () => {} })
    http_testing.expectOne(services_url).flush(null, { status: 500, statusText: "Server Error" })

    service.getAvailableServices().subscribe()
    http_testing.expectOne(services_url).flush({ success: true, message: "", services: [] })
  })
})
