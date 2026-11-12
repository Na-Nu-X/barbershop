import { Component, booleanAttribute, computed, input } from "@angular/core"

export type ButtonVariant = "primary" | "secondary" | "ghost"
export type ButtonSize = "sm" | "md" | "lg"

/*
 Styled Native Button / Link
 Usage: <button appButton type="button" variant="secondary" size="lg" block>Text</button>
        <a appButton href="#booking">Text</a>
*/
@Component({
  selector: "button[appButton], a[appButton]",
  template: "<ng-content />",
  styleUrl: "./button.scss",
  host: {
    "[class]": "classes()"
  }
})
export class Button {
  readonly variant = input<ButtonVariant>("primary") // Visual Style
  readonly size = input<ButtonSize>("md") // Height And Padding
  readonly block = input(false, { transform: booleanAttribute }) // Stretches To Full Width

  protected readonly classes = computed<string>(() => [
    `button_${this.variant()}`,
    `button_${this.size()}`,
    this.block() ? "button_block" : ""
  ].join(" ").trim())
}
