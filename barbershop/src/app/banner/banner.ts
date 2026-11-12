import { Component, afterNextRender, inject, signal } from "@angular/core"
import { Status, StatusResponse } from "../services/status"
import { Scroll } from "../services/scroll"
import { Button } from "../shared/button/button"
import { SITE_CONFIG } from "../config/site.config"

// What The Open / Closed Pill Shows
interface StatusView {
  is_open:boolean,
  label:string, // e.g. "Otvorené"
  detail:string|null // e.g. "do 18:00"
}

@Component({
  selector: "app-banner",
  imports: [Button],
  templateUrl: "./banner.html",
  styleUrl: "./banner.scss",
})
export class Banner {
  private readonly StatusService = inject(Status)
  protected readonly ScrollService = inject(Scroll)

  protected readonly site = SITE_CONFIG // Business Details
  protected readonly hero = SITE_CONFIG.hero // Hero Copy And Image

  protected readonly status = signal<StatusView|null>(null) // Null Until The Live Status Is Loaded

  constructor() {
    // The Status Changes Over Time, So It Is Only Fetched In The Browser (Never Baked Into The Prerendered Page)
    afterNextRender(() => this.loadStatus())
  }

  // Method For Load The Current Open / Closed Status
  private loadStatus():void {
    this.StatusService.getStatus().subscribe({
      next:(response) => {
        if(response.success && response.status) {
          this.status.set(toStatusView(response))
        }

        else {
          console.error(response.message) // Shows The Error Message
        }
      },

      error:(error) => {
        console.error(error) // The Pill Simply Stays Hidden When The Status Is Unavailable
      }
    })
  }
}

// Function For Turn The API Response Into Pill Text
function toStatusView(response:StatusResponse):StatusView {
  let detail:string|null = null

  if(response.is_open && response.open_till) detail = `do ${response.open_till}`
  else if(!response.is_open && response.next_open) detail = `otvárame o ${response.next_open}`
  else if(!response.is_open && response.reason) detail = response.reason

  return {
    is_open: response.is_open ?? false,
    label: response.status ?? "",
    detail
  }
}
