import { addDays, formatLongDate, fromIsoDate, isoWeekday, toCalendarDay, toIsoDate } from "./date-utils"

describe("date-utils", () => {
  it("round-trips local dates without shifting the day", () => {
    const date:Date = new Date(2030, 0, 7, 23, 59) // Late Evening Would Shift A Day If Converted Through UTC
    expect(toIsoDate(date)).toBe("2030-01-07")
    expect(toIsoDate(fromIsoDate("2030-01-07"))).toBe("2030-01-07")
  })

  it("adds days across month and year boundaries", () => {
    expect(toIsoDate(addDays(new Date(2029, 11, 30), 3))).toBe("2030-01-02")
  })

  it("uses ISO weekdays with Sunday as 7", () => {
    expect(isoWeekday(new Date(2030, 0, 7))).toBe(1) // Monday
    expect(isoWeekday(new Date(2030, 0, 13))).toBe(7) // Sunday
  })

  it("describes days in Slovak", () => {
    const day = toCalendarDay(new Date(2030, 0, 7))

    expect(day).toEqual(expect.objectContaining({ iso: "2030-01-07", day: 7, iso_weekday: 1 }))
    expect(day.weekday).toBe("po")
    expect(formatLongDate("2030-01-07")).toBe("pondelok 7. januára")
  })
})
