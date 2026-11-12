import { Injectable, PLATFORM_ID, inject, signal } from "@angular/core"
import { isPlatformBrowser } from "@angular/common"

export type ToastType = "success" | "error" | "info"

export interface ToastMessage {
  id:number,
  type:ToastType,
  message:string
}

const DEFAULT_DURATION:number = 5000 // How Long A Toast Stays Visible (ms)

@Injectable({
  providedIn: "root"
})
export class Toast {
  private readonly is_browser:boolean = isPlatformBrowser(inject(PLATFORM_ID))
  private next_id:number = 0

  private readonly toasts_state = signal<ToastMessage[]>([])
  readonly toasts = this.toasts_state.asReadonly() // Currently Visible Toasts (Oldest First)

  success(message:string):void {
    this.show("success", message)
  }

  error(message:string):void {
    this.show("error", message, DEFAULT_DURATION * 1.5) // Errors Stay Longer So They Can Be Read
  }

  info(message:string):void {
    this.show("info", message)
  }

  // Method For Show A Toast That Hides Itself After `duration` ms
  show(type:ToastType, message:string, duration:number = DEFAULT_DURATION):void {
    const id:number = ++this.next_id

    this.toasts_state.update((toasts) => [...toasts, { id, type, message }])

    if(this.is_browser) {
      setTimeout(() => this.dismiss(id), duration)
    }
  }

  // Method For Hide A Toast
  dismiss(id:number):void {
    this.toasts_state.update((toasts) => toasts.filter((toast) => toast.id !== id))
  }
}
