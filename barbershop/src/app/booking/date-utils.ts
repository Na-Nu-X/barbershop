/*****************************************************
 Local Calendar Helpers For The Booking Flow
 Dates Travel As "YYYY-MM-DD" Strings In Local Time,
 Never Through UTC, So A Booking Can't Shift A Day.
*****************************************************/

const WEEKDAY_SHORT = new Intl.DateTimeFormat("sk-SK", { weekday: "short" })
const MONTH_SHORT = new Intl.DateTimeFormat("sk-SK", { month: "short" })
const DATE_LONG = new Intl.DateTimeFormat("sk-SK", { weekday: "long", day: "numeric", month: "long" })
const DATE_SHORT = new Intl.DateTimeFormat("sk-SK", { weekday: "short", day: "numeric", month: "numeric" })

export interface CalendarDay {
  iso:string, // "2026-11-20"
  weekday:string, // "pi"
  day:number, // 20
  month:string, // "nov"
  iso_weekday:number // 1 = Monday ... 7 = Sunday
}

// Function For Format A Local Date As "YYYY-MM-DD"
export function toIsoDate(date:Date):string {
  const year:number = date.getFullYear()
  const month:string = String(date.getMonth() + 1).padStart(2, "0")
  const day:string = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

// Function For Parse "YYYY-MM-DD" As A Local Date (Midnight)
export function fromIsoDate(iso:string):Date {
  const [year, month, day] = iso.split("-").map(Number)
  return new Date(year, month - 1, day)
}

// Function For Get A New Date `days` After `date`
export function addDays(date:Date, days:number):Date {
  const result:Date = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

// Function For Get The ISO Weekday (1 = Monday ... 7 = Sunday)
export function isoWeekday(date:Date):number {
  return date.getDay() === 0 ? 7 : date.getDay()
}

// Function For Describe A Date For The Day Picker
export function toCalendarDay(date:Date):CalendarDay {
  return {
    iso: toIsoDate(date),
    weekday: WEEKDAY_SHORT.format(date).replace(".", ""),
    day: date.getDate(),
    month: MONTH_SHORT.format(date).replace(".", ""),
    iso_weekday: isoWeekday(date)
  }
}

// "piatok 20. novembra"
export function formatLongDate(iso:string):string {
  return DATE_LONG.format(fromIsoDate(iso))
}

// "pi 20. 11."
export function formatShortDate(iso:string):string {
  return DATE_SHORT.format(fromIsoDate(iso))
}
