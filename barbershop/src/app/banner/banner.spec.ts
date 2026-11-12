import { formatNextOpening } from "./banner"

describe("formatNextOpening", () => {
  it("omits the day for later today", () => {
    expect(formatNextOpening("09:00", "dnes")).toBe("otvárame o 09:00")
    expect(formatNextOpening("09:00", null)).toBe("otvárame o 09:00")
  })

  it("names the day when the shop opens on another day", () => {
    expect(formatNextOpening("09:00", "zajtra")).toBe("otvárame zajtra o 09:00")
    expect(formatNextOpening("10:00", "v pondelok")).toBe("otvárame v pondelok o 10:00")
  })
})
