import { ComponentFixture, TestBed } from "@angular/core/testing"
import { provideHttpClient } from "@angular/common/http"
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing"

import { Pricing } from "./pricing"
import { BookingDraft } from "../services/booking-draft"
import { Scroll } from "../services/scroll"
import { apiUrl } from "../config/api"
import type { Service } from "../services/booking"

const SERVICES:Service[] = [
  { id: 1, title: "Pánsky strih", description: "Strih a styling.", duration: 45, price: 2200 },
  { id: 2, title: "Úprava brady", description: "", duration: 30, price: 1550 }
]

describe("Pricing", () => {
  let fixture:ComponentFixture<Pricing>
  let http_testing:HttpTestingController
  let element:HTMLElement

  const services_url:string = apiUrl("get-available-services/")

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Pricing],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Scroll, useValue: { toSection: vi.fn() } }
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(Pricing)
    http_testing = TestBed.inject(HttpTestingController)
    element = fixture.nativeElement as HTMLElement

    await fixture.whenStable() // Runs afterNextRender, Which Starts The Request
  })

  afterEach(() => {
    http_testing.verify()
  })

  it("shows skeleton cards while loading", () => {
    expect(element.querySelectorAll(".service_card.skeleton").length).toBeGreaterThan(0)
    http_testing.expectOne(services_url).flush({ success: true, message: "", services: [] })
  })

  it("renders a card per service with formatted price and duration", async () => {
    http_testing.expectOne(services_url).flush({ success: true, message: "", services: SERVICES })
    await fixture.whenStable()

    const cards = element.querySelectorAll(".service_card:not(.skeleton)")
    expect(cards.length).toBe(2)
    expect(cards[0].querySelector("h3")?.textContent).toContain("Pánsky strih")
    expect(cards[0].querySelector(".price")?.textContent?.replace(/\s/g, " ")).toContain("22 €")
    expect(cards[0].querySelector(".meta")?.textContent).toContain("45 min")
    expect(cards[1].querySelector(".description")).toBeNull() // Empty Descriptions Are Not Rendered
  })

  it("shows an error notice with a working retry button", async () => {
    http_testing.expectOne(services_url).flush(null, { status: 500, statusText: "Server Error" })
    await fixture.whenStable()

    const retry = element.querySelector<HTMLButtonElement>(".notice button")
    expect(retry?.textContent).toContain("Skúsiť znova")

    retry?.click()
    http_testing.expectOne(services_url).flush({ success: true, message: "", services: SERVICES })
    await fixture.whenStable()

    expect(element.querySelectorAll(".service_card:not(.skeleton)").length).toBe(2)
  })

  it("pre-selects the service and scrolls to the booking form when booking", async () => {
    http_testing.expectOne(services_url).flush({ success: true, message: "", services: SERVICES })
    await fixture.whenStable()

    element.querySelectorAll<HTMLButtonElement>(".service_card .book")[1].click()

    expect(TestBed.inject(BookingDraft).service()?.id).toBe(2)
    expect(TestBed.inject(Scroll).toSection).toHaveBeenCalledWith("booking")
  })
})
