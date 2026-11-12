import { EuroPipe } from "./euro.pipe"
import { DurationPipe } from "./duration.pipe"

// Intl Uses A Non-Breaking Space Between The Number And "€"
const normalize = (value:string):string => value.replace(/\s/g, " ")

describe("EuroPipe", () => {
  const pipe = new EuroPipe()

  it("hides cents for whole-euro prices", () => {
    expect(normalize(pipe.transform(1500))).toBe("15 €")
  })

  it("shows cents with a decimal comma when needed", () => {
    expect(normalize(pipe.transform(1250))).toBe("12,50 €")
  })

  it("returns an empty string for missing values", () => {
    expect(pipe.transform(null)).toBe("")
    expect(pipe.transform(undefined)).toBe("")
  })
})

describe("DurationPipe", () => {
  const pipe = new DurationPipe()

  it("formats minutes, whole hours and mixed durations", () => {
    expect(pipe.transform(30)).toBe("30 min")
    expect(pipe.transform(60)).toBe("1 h")
    expect(pipe.transform(75)).toBe("1 h 15 min")
  })

  it("returns an empty string for invalid values", () => {
    expect(pipe.transform(null)).toBe("")
    expect(pipe.transform(-5)).toBe("")
  })
})
