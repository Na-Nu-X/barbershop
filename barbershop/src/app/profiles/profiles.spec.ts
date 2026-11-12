import { ComponentFixture, TestBed } from "@angular/core/testing"
import { provideHttpClient } from "@angular/common/http"
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing"

import { Profiles } from "./profiles"
import { apiUrl } from "../config/api"
import type { BarberData } from "../services/barber"

const BARBERS:BarberData[] = [
  { id: 1, first_name: "Marek", nickname: "Maro", bio: "Fade.", profile_picture: "/p1.jpg", instagram: null, portfolio: ["/a.jpg", "/b.jpg", "/c.jpg", "/d.jpg", "/e.jpg"] },
  { id: 2, first_name: "Lukáš Horák", nickname: null, bio: null, profile_picture: null, instagram: "https://instagram.com/x", portfolio: [] }
]

describe("Profiles", () => {
  let fixture:ComponentFixture<Profiles>
  let component:Profiles
  let element:HTMLElement
  let http_testing:HttpTestingController

  beforeAll(() => {
    // jsdom May Not Implement Modal Dialogs
    HTMLDialogElement.prototype.showModal ??= function(this:HTMLDialogElement) { this.open = true }
    HTMLDialogElement.prototype.close ??= function(this:HTMLDialogElement) { this.open = false; this.dispatchEvent(new Event("close")) }
  })

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Profiles],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents()

    fixture = TestBed.createComponent(Profiles)
    component = fixture.componentInstance
    element = fixture.nativeElement as HTMLElement
    http_testing = TestBed.inject(HttpTestingController)

    await fixture.whenStable()
    http_testing.expectOne(apiUrl("get-barbers/")).flush({ success: true, message: "", barbers: BARBERS })
    await fixture.whenStable()
  })

  it("shows the nickname with the real name, or initials when there is no photo", () => {
    const cards = element.querySelectorAll(".barber_card")

    expect(cards[0].querySelector("h3")?.textContent).toContain("Maro")
    expect(cards[0].querySelector(".name p")?.textContent).toContain("Marek")
    expect(cards[1].querySelector(".initials")?.textContent).toContain("LH")
    expect(cards[1].querySelector(".portfolio")).toBeNull()
  })

  it("shows four thumbnails and a counter for the rest", () => {
    const thumbs = element.querySelectorAll(".barber_card:first-child .thumb")

    expect(thumbs.length).toBe(4)
    expect(thumbs[3].querySelector(".more")?.textContent).toContain("+1")
  })

  it("opens the lightbox and wraps around when browsing", async () => {
    element.querySelectorAll<HTMLButtonElement>(".thumb")[0].click()
    await fixture.whenStable()

    expect(element.querySelector<HTMLDialogElement>(".lightbox")?.open).toBe(true)
    expect(element.querySelector(".lightbox figcaption")?.textContent).toContain("1 / 5")

    component.moveLightbox(-1)
    await fixture.whenStable()
    expect(element.querySelector(".lightbox figcaption")?.textContent).toContain("5 / 5")

    component.closeLightbox()
    await fixture.whenStable()
    expect(element.querySelector(".lightbox figure")).toBeNull()
  })
})
