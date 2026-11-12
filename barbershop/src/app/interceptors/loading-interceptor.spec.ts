import { TestBed } from "@angular/core/testing"
import { HttpClient, provideHttpClient, withInterceptors } from "@angular/common/http"
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing"

import { loadingInterceptor } from "./loading-interceptor"
import { Loading } from "../services/loading"

describe("loadingInterceptor", () => {
  let http:HttpClient
  let http_testing:HttpTestingController
  let loading:Loading

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([loadingInterceptor])),
        provideHttpClientTesting()
      ]
    })

    http = TestBed.inject(HttpClient)
    http_testing = TestBed.inject(HttpTestingController)
    loading = TestBed.inject(Loading)
  })

  afterEach(() => {
    http_testing.verify()
  })

  it("shows the loader while a request is pending and hides it afterwards", () => {
    http.get("/api/test/").subscribe()
    expect(loading.is_loading()).toBe(true)

    http_testing.expectOne("/api/test/").flush({})
    expect(loading.is_loading()).toBe(false)
  })

  it("keeps the loader visible until every concurrent request finishes", () => {
    http.get("/api/first/").subscribe()
    http.get("/api/second/").subscribe()

    http_testing.expectOne("/api/first/").flush({})
    expect(loading.is_loading()).toBe(true)

    http_testing.expectOne("/api/second/").flush({})
    expect(loading.is_loading()).toBe(false)
  })

  it("hides the loader when a request fails", () => {
    http.get("/api/broken/").subscribe({ error: () => {} })

    http_testing.expectOne("/api/broken/").flush(null, { status: 500, statusText: "Server Error" })
    expect(loading.is_loading()).toBe(false)
  })

  it("hides the loader when a request is cancelled", () => {
    const subscription = http.get("/api/slow/").subscribe()
    const request = http_testing.expectOne("/api/slow/")

    subscription.unsubscribe()

    expect(request.cancelled).toBe(true)
    expect(loading.is_loading()).toBe(false)
  })
})
