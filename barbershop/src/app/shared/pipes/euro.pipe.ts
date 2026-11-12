import { Pipe, PipeTransform } from "@angular/core"

const WHOLE_EUROS = new Intl.NumberFormat("sk-SK", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0 })
const WITH_CENTS = new Intl.NumberFormat("sk-SK", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 })

/*
 Formats A Price Stored In Cents (As In The Back-End) For Display
 1500 → "15 €", 1250 → "12,50 €"
*/
@Pipe({
  name: "euro"
})
export class EuroPipe implements PipeTransform {
  transform(cents:number|null|undefined):string {
    if(cents === null || cents === undefined || Number.isNaN(cents)) return ""

    const formatter:Intl.NumberFormat = cents % 100 === 0 ? WHOLE_EUROS : WITH_CENTS
    return formatter.format(cents / 100)
  }
}
