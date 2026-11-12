import { Component, input } from "@angular/core"

export type SectionHeadingAlign = "center" | "start"

/*
 Consistent Section Title Block
 Usage: <app-section-heading eyebrow="Rezervácia" title="Vyberte si termín" description="..." />
*/
@Component({
  selector: "app-section-heading",
  templateUrl: "./section-heading.html",
  styleUrl: "./section-heading.scss",
  host: {
    "[class.align_start]": "align() === 'start'"
  }
})
export class SectionHeading {
  readonly title = input.required<string>() // Main Heading (h2)
  readonly eyebrow = input<string>() // Small Label Above The Title
  readonly description = input<string>() // Supporting Text Below The Title
  readonly align = input<SectionHeadingAlign>("center")
}
