import { Component, inject } from "@angular/core"
import { Toast, ToastType } from "../../services/toast"

// Renders The Toast Stack (Placed Once In app.html)
@Component({
  selector: "app-toasts",
  templateUrl: "./toasts.html",
  styleUrl: "./toasts.scss"
})
export class Toasts {
  protected readonly ToastService = inject(Toast)

  protected readonly icons:Record<ToastType, string> = {
    success: "fa-solid fa-circle-check", // https://fontawesome.com/icons/circle-check
    error: "fa-solid fa-circle-exclamation", // https://fontawesome.com/icons/circle-exclamation
    info: "fa-solid fa-circle-info" // https://fontawesome.com/icons/circle-info
  }
}
