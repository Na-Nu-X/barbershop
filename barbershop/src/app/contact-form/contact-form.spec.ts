import { ComponentFixture, TestBed } from "@angular/core/testing"
import { provideHttpClient } from "@angular/common/http"
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing"

import { ContactForm } from "./contact-form"
import { Toast } from "../services/toast"
import { apiUrl } from "../config/api"

describe("ContactForm", () => {
  let fixture:ComponentFixture<ContactForm>
  let element:HTMLElement
  let http_testing:HttpTestingController

  const type = (id:string, value:string):void => {
    const field = element.querySelector<HTMLInputElement|HTMLTextAreaElement>(`#${id}`)!
    field.value = value
    field.dispatchEvent(new Event("input"))
  }

  const submit = async ():Promise<void> => {
    element.querySelector<HTMLButtonElement>("button[type=submit]")!.click()
    await fixture.whenStable()
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactForm],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents()

    fixture = TestBed.createComponent(ContactForm)
    element = fixture.nativeElement as HTMLElement
    http_testing = TestBed.inject(HttpTestingController)
    await fixture.whenStable()
  })

  afterEach(() => {
    http_testing.verify()
  })

  it("shows errors and sends nothing when the form is invalid", async () => {
    type("contact_email", "jan@")
    await submit()

    expect(element.querySelector("#contact_email_error")?.textContent).toContain("platnú e-mailovú")
    expect(element.querySelectorAll(".field_error").length).toBe(4)
    http_testing.expectNone(apiUrl("contact/"))
  })

  it("sends trimmed values, then clears the form and confirms with a toast", async () => {
    const success_spy = vi.spyOn(TestBed.inject(Toast), "success")

    type("contact_first_name", " Ján ")
    type("contact_last_name", "Novák")
    type("contact_email", "jan@example.com")
    type("contact_message", "  Dobrý deň!  ")
    await submit()

    const request = http_testing.expectOne(apiUrl("contact/"))
    expect(request.request.body).toEqual({ first_name: "Ján", last_name: "Novák", email_address: "jan@example.com", message: "Dobrý deň!" })

    request.flush({ success: true, message: "Správa bola odoslaná." })
    await fixture.whenStable()

    expect(success_spy).toHaveBeenCalledWith("Správa bola odoslaná.")
    expect(element.querySelector<HTMLInputElement>("#contact_first_name")?.value).toBe("")
    expect(element.querySelectorAll(".field_error").length).toBe(0) // A Cleared Form Does Not Show Errors
  })

  it("shows the server's error message", async () => {
    const error_spy = vi.spyOn(TestBed.inject(Toast), "error")

    type("contact_first_name", "Ján")
    type("contact_last_name", "Novák")
    type("contact_email", "jan@example.com")
    type("contact_message", "Ahoj")
    await submit()

    http_testing.expectOne(apiUrl("contact/")).flush({ success: false, message: "Niektoré z polí je príliš dlhé." }, { status: 400, statusText: "Bad Request" })

    expect(error_spy).toHaveBeenCalledWith("Niektoré z polí je príliš dlhé.")
  })
})
