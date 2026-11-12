import { TestBed } from "@angular/core/testing"

import { Toast } from "./toast"

describe("Toast", () => {
  let service:Toast

  beforeEach(() => {
    vi.useFakeTimers()
    TestBed.configureTestingModule({})
    service = TestBed.inject(Toast)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("adds toasts with the right type in order", () => {
    service.success("Uložené")
    service.error("Chyba")

    expect(service.toasts().map((toast) => [toast.type, toast.message])).toEqual([
      ["success", "Uložené"],
      ["error", "Chyba"]
    ])
  })

  it("dismisses a single toast by id", () => {
    service.info("Prvý")
    service.info("Druhý")

    service.dismiss(service.toasts()[0].id)

    expect(service.toasts().map((toast) => toast.message)).toEqual(["Druhý"])
  })

  it("hides toasts automatically, keeping errors visible longer", () => {
    service.success("Krátky")
    service.error("Dlhý")

    vi.advanceTimersByTime(5000)
    expect(service.toasts().map((toast) => toast.message)).toEqual(["Dlhý"])

    vi.advanceTimersByTime(2500)
    expect(service.toasts()).toEqual([])
  })
})
