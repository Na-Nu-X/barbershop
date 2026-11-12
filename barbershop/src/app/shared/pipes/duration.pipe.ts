import { Pipe, PipeTransform } from "@angular/core"

/*
 Formats A Duration In Minutes For Display
 30 → "30 min", 60 → "1 h", 75 → "1 h 15 min"
*/
@Pipe({
  name: "duration"
})
export class DurationPipe implements PipeTransform {
  transform(minutes:number|null|undefined):string {
    if(minutes === null || minutes === undefined || Number.isNaN(minutes) || minutes < 0) return ""

    const hours:number = Math.floor(minutes / 60)
    const rest:number = minutes % 60

    if(hours === 0) return `${rest} min`
    if(rest === 0) return `${hours} h`
    return `${hours} h ${rest} min`
  }
}
