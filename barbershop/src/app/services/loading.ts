import { Injectable, computed, signal } from "@angular/core"

// Tracks In-Flight HTTP Requests To Drive The Global Preloader
@Injectable({
  providedIn: "root",
})
export class Loading {
  private readonly pending_requests = signal<number>(0)

  readonly is_loading = computed<boolean>(() => this.pending_requests() > 0) // True While Any Request Is Pending

  // Method For Register A Started Request
  show():void {
    this.pending_requests.update((count) => count + 1)
  }

  // Method For Register A Finished Request (Never Drops Below Zero)
  hide():void {
    this.pending_requests.update((count) => Math.max(0, count - 1))
  }
}
