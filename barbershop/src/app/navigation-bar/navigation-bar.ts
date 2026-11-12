import { Component, DOCUMENT, ElementRef, HostListener, effect, inject, signal, viewChild } from "@angular/core"
import { Scroll, SectionId } from "../services/scroll"
import { Button } from "../shared/button/button"
import { SITE_CONFIG } from "../config/site.config"

interface NavigationLink {
  label:string,
  section:SectionId
}

const SCROLLED_OFFSET:number = 24 // Scroll Distance (px) After Which The Bar Gets A Solid Background
const DESKTOP_BREAKPOINT:number = 900 // Must Match $bp-md In _variables.scss

@Component({
  selector: "app-navigation-bar",
  imports: [Button],
  templateUrl: "./navigation-bar.html",
  styleUrl: "./navigation-bar.scss",
})
export class NavigationBar {
  private readonly ScrollService = inject(Scroll)
  private readonly document = inject(DOCUMENT)
  private readonly menu_toggle = viewChild<ElementRef<HTMLButtonElement>>("menu_toggle")

  protected readonly site = SITE_CONFIG // Business Details

  protected readonly is_open = signal<boolean>(false) // Stores The Information If The Mobile Menu Is Open
  protected readonly is_scrolled = signal<boolean>(false) // Stores The Information If The Page Is Scrolled

  protected readonly links:NavigationLink[] = [
    { label: "Rezervácia", section: "booking" },
    { label: "Barberi", section: "barbers" },
    { label: "Kontakt", section: "contact" }
  ]

  constructor() {
    // Locks The Page Scroll While The Mobile Menu Is Open
    effect(() => {
      this.document.body.classList.toggle("scroll_locked", this.is_open())
    })
  }

  // Method For Toggle The Mobile Menu
  toggleMenu():void {
    this.is_open.update((open) => !open)
  }

  // Method For Close The Mobile Menu (Optionally Returning Focus To The Toggle Button)
  closeMenu(restore_focus:boolean = false):void {
    if(!this.is_open()) return

    this.is_open.set(false)
    if(restore_focus) this.menu_toggle()?.nativeElement.focus()
  }

  // Method For Navigate To A Section Or The Top (Keeps The Native Anchor As A No-JS Fallback)
  navigate(event:MouseEvent, section:SectionId|null):void {
    event.preventDefault()

    if(section) this.ScrollService.toSection(section)
    else this.ScrollService.toTop()

    this.closeMenu()
  }

  @HostListener("window:scroll")
  onScroll():void {
    this.is_scrolled.set((this.document.defaultView?.scrollY ?? 0) > SCROLLED_OFFSET)
  }

  @HostListener("document:keydown.escape")
  onEscape():void {
    this.closeMenu(true)
  }

  // Closes The Mobile Menu When The Window Grows To Desktop Width
  @HostListener("window:resize", ["$event"])
  onResize(event:UIEvent):void {
    if((event.target as Window).innerWidth >= DESKTOP_BREAKPOINT) this.closeMenu()
  }
}
