import { Component, HostListener, inject } from "@angular/core"
import { Scroll, SectionId } from "../services/scroll"

interface NavigationLink {
  label:string,
  section:SectionId|null // Null Scrolls To The Top
}

@Component({
  selector: "app-navigation-bar",
  imports: [],
  templateUrl: "./navigation-bar.html",
  styleUrl: "./navigation-bar.scss",
})
export class NavigationBar {
  private ScrollService = inject(Scroll)

  is_open:boolean = false // Stores The Information If The Mobile Menu Is Open

  readonly links:NavigationLink[] = [
    { label: "Domov", section: null },
    { label: "Rezervácia", section: "booking" },
    { label: "Kontakt", section: "contact" }
  ]

  // Method For Toggle The Mobile Menu
  toggleMenu():void {
    this.is_open = !this.is_open
  }

  // Method For Navigate To A Section (Keeps The Native Anchor As A No-JS Fallback)
  navigate(event:MouseEvent, section:SectionId|null):void {
    event.preventDefault()

    if(section) this.ScrollService.toSection(section)
    else this.ScrollService.toTop()

    this.is_open = false // Closes The Mobile Menu After Choosing A Link
  }

  // Closes The Mobile Menu When The Window Grows To Desktop Width
  @HostListener("window:resize", ["$event"])
  onResize(event:UIEvent):void {
    if((event.target as Window).innerWidth > 600) this.is_open = false
  }
}
