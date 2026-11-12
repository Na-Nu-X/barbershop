import { TestBed } from "@angular/core/testing"
import { provideRouter } from "@angular/router"
import { provideHttpClient } from "@angular/common/http"
import { provideHttpClientTesting } from "@angular/common/http/testing"

import { App } from "./app"
import { SITE_CONFIG } from "./config/site.config"

describe("App", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents()
  })

  it("should create the app", () => {
    const fixture = TestBed.createComponent(App)
    expect(fixture.componentInstance).toBeTruthy()
  })

  it("should render the navigation, footer and toast region", async () => {
    const fixture = TestBed.createComponent(App)
    await fixture.whenStable()

    const compiled = fixture.nativeElement as HTMLElement

    expect(compiled.querySelector("app-navigation-bar nav")).toBeTruthy()
    expect(compiled.querySelector("app-footer h2")?.textContent).toContain(SITE_CONFIG.name)
    expect(compiled.querySelector("app-toasts [aria-live]")).toBeTruthy()
  })

  it("should apply the page title from the site config", () => {
    TestBed.createComponent(App)
    expect(document.title).toContain(SITE_CONFIG.name)
  })
})
