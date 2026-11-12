import { Component, ElementRef, afterNextRender, computed, inject, signal, viewChild } from "@angular/core"
import { Barber, BarberData } from "../services/barber"
import { Button } from "../shared/button/button"
import { SectionHeading } from "../shared/section-heading/section-heading"

type LoadState = "loading" | "ready" | "error"

interface LightboxState {
  barber:BarberData,
  index:number
}

const PORTFOLIO_PREVIEW_COUNT:number = 4 // Thumbnails Shown Per Card (The Rest Are In The Lightbox)

@Component({
  selector: "app-profiles",
  imports: [Button, SectionHeading],
  templateUrl: "./profiles.html",
  styleUrl: "./profiles.scss",
})
export class Profiles {
  private readonly BarberService = inject(Barber)
  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>("lightbox_dialog")

  protected readonly state = signal<LoadState>("loading")
  protected readonly barbers = signal<BarberData[]>([])
  protected readonly lightbox = signal<LightboxState|null>(null)
  protected readonly preview_count:number = PORTFOLIO_PREVIEW_COUNT

  protected readonly lightbox_image = computed<string|null>(() => {
    const current:LightboxState|null = this.lightbox()
    return current ? current.barber.portfolio[current.index] : null
  })

  constructor() {
    // The Team Changes In The Admin, So It Is Always Loaded Fresh In The Browser
    afterNextRender(() => this.loadBarbers())
  }

  // Method For Load The Barbers
  loadBarbers():void {
    this.state.set("loading")

    this.BarberService.getBarbers().subscribe({
      next:(response) => {
        this.barbers.set(response.success ? response.barbers : [])
        this.state.set(response.success ? "ready" : "error")
      },

      error:(error) => {
        console.error(error) // Shows The Error
        this.state.set("error")
      }
    })
  }

  // Method For Get The Name Shown On The Card (Nickname First, If Any)
  protected displayName(barber:BarberData):string {
    return barber.nickname || barber.first_name
  }

  // Method For Get Up To Two Initials For Barbers Without A Photo
  protected initials(barber:BarberData):string {
    return this.displayName(barber).split(/\s+/).map((part) => part.charAt(0)).join("").slice(0, 2).toUpperCase()
  }

  // Lightbox

  openLightbox(barber:BarberData, index:number):void {
    this.lightbox.set({ barber, index })
    this.dialog()?.nativeElement.showModal()
  }

  closeLightbox():void {
    this.dialog()?.nativeElement.close()
  }

  // Keeps State In Sync When The Dialog Closes Natively (Escape Key)
  protected onDialogClose():void {
    this.lightbox.set(null)
  }

  moveLightbox(step:number):void {
    this.lightbox.update((current) => {
      if(!current) return current

      const total:number = current.barber.portfolio.length
      return { ...current, index: (current.index + step + total) % total }
    })
  }

  // Closes When Clicking The Dark Backdrop Around The Image
  protected onDialogClick(event:MouseEvent):void {
    if(event.target === this.dialog()?.nativeElement) this.closeLightbox()
  }
}
