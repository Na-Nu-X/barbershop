import { Injectable, DOCUMENT, inject } from "@angular/core"

// IDs Of The Page Sections That Can Be Scrolled To
export type SectionId = "services" | "booking" | "barbers" | "contact"

@Injectable({
  providedIn: "root"
})
export class Scroll {
  private document = inject(DOCUMENT)

  // Smoothly Scrolls To A Page Section (The Fixed Navigation Offset Is Handled By `scroll-padding-top` In styles.scss)
  toSection(id:SectionId):void {
    this.document.getElementById(id)?.scrollIntoView({ behavior: this.behavior(), block: "start" })
  }

  // Smoothly Scrolls Back To The Top Of The Page
  toTop():void {
    this.document.defaultView?.scrollTo({ top: 0, behavior: this.behavior() })
  }

  // Respects The User's "Reduce Motion" System Setting
  private behavior():ScrollBehavior {
    const reduce_motion:boolean = this.document.defaultView?.matchMedia("(prefers-reduced-motion: reduce)").matches ?? false
    return reduce_motion ? "auto" : "smooth"
  }
}
